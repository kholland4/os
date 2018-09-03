//TODO: metadata/permissions/etc.

var tmpfs_fs = [];

function tmpfs_mount(id, params) {
  tmpfs_fs.push({
    id: id,
    data: []
  });
}

function tmpfs_umount(id) {
  var idx = tmpfs_get_index(id);
  tmpfs_fs.splice(idx, 1);
}

function tmpfs_get_index(id) {
  for(var i = 0; i < tmpfs_fs.length; i++) {
    if(tmpfs_fs[i].id == id) {
      return i;
    }
  }
}

function tmpfs_get_file(id, file) {
  var idx = tmpfs_get_index(id);
  var dir = {name: "/", type: "dir", data: tmpfs_fs[idx].data}; //FIXME put root dir in fs structure
  if(file == "/") {
    return dir;
  }
  
  //walk down tree until desired directory is reached
  var path = "";
  while(true) {
    for(var i = 0; i < dir.data.length; i++) {
      if(path + "/" + dir.data[i].name == file) {
        return dir.data[i];
      }
    }
    
    var found = false;
    for(var i = 0; i < dir.data.length; i++) {
      if(file.startsWith(path + "/" + dir.data[i].name + "/")) {
        found = true;
        path += "/" + dir.data[i].name;
        dir = dir.data[i];
      }
    }
    if(!found) { return null; }
  }
}

function tmpfs_ls(id, file) {
  var dir = tmpfs_get_file(id, file);
  if(dir == null) { return null; }
  if(dir.type != "dir") { return null; }
  
  var out = [];
  for(var i = 0; i < dir.data.length; i++) {
    out.push(dir.data[i].name);
  }
  return out;
}

function tmpfs_exists(id, file) {
  //TODO: more efficient - don't load data
  var f = tmpfs_get_file(id, file);
  if(f != null) {
    return true;
  }
  return false;
}

function tmpfs_isdir(id, file) {
  //TODO: more efficient - don't load data
  var f = tmpfs_get_file(id, file);
  if(f == null) { return null; }
  
  if(f.type == "dir") { return true; }
  return false;
}

function tmpfs_open(id, file, params) {
  var f = tmpfs_get_file(id, file);
  if(f == null) { return null; }
  if(f.type != "file") { return null; }
  
  var fd = syscall_fd_create();
  syscall_fd_set_info(fd, {fsid: id, file: file, size: f.data.length, pos: 0});
  
  syscall_fd_bind_read(fd, function(fd, bytes) {
    var info = syscall_fd_info(fd);
    var f = tmpfs_get_file(info.fsid, info.file);
    if(f == null) { return null; }
    if(f.type != "file") { return null; }
    
    if(bytes + info.pos >= info.size) { bytes = info.size - info.pos; } //FIXME check if this is off-by-one or not
    var out = f.data.substring(info.pos, info.pos + bytes);
    info.pos += bytes;
    syscall_fd_set_info(fd, info);
    return out;
  });
  
  syscall_fd_bind_write(fd, function(fd, data) {
    var info = syscall_fd_info(fd);
    var f = tmpfs_get_file(info.fsid, info.file);
    if(f == null) { return null; }
    if(f.type != "file") { return null; }
    
    if(info.pos + data.length <= info.size) {
      //full overwrite
      f.data = f.data.substring(0, info.pos) + data + f.data.substring(info.pos + data.length);
    } else if(info.pos < info.size) {
      //partial overwrite
      f.data = f.data.substring(0, info.pos) + data;
    } else if(info.pos == info.size) {
      //append
      f.data += data;
    } else {
      return false; //error - shouldn't happen FIXME
    }
    
    info.pos += data.length; //FIXME bounds check
    info.size = f.data.length;
    syscall_fd_set_info(fd, info);
    return true;
  });
  
  syscall_fd_bind_seek(fd, function(fd, pos) {
    //TODO: -1 refers to end of file?/etc.
    var info = syscall_fd_info(fd);
    
    if(pos >= 0 && pos <= info.size) {
      info.pos = pos;
    }
    
    syscall_fd_set_info(fd, info);
  });
  
  return fd;
}

function tmpfs_close(fd) {
  syscall_fd_destroy(fd);
}

function tmpfs_mkdir(id, file) {
  var o = file.lastIndexOf("/");
  if(o == -1) { return null; }
  var dirname = file.substring(o + 1);
  file = file.substring(0, o);
  if(file == "") { file = "/"; }
  
  var f = tmpfs_get_file(id, file);
  if(f == null) { return null; }
  if(f.type != "dir") { return null; }
  
  f.data.push({name: dirname, type: "dir", data: []});
  return true;
}

function tmpfs_rmdir(id, file) {
  if(!tmpfs_exists(id, file)) { return null; }
  if(!tmpfs_isdir(id, file)) { return false; }
  
  var o = file.lastIndexOf("/");
  if(o == -1) { return null; }
  var dirname = file.substring(o + 1);
  file = file.substring(0, o);
  if(file == "") { file = "/"; }
  
  var f = tmpfs_get_file(id, file);
  if(f == null) { return null; }
  if(f.type != "dir") { return null; }
  
  for(var i = 0; i < f.data.length; i++) {
    if(f.data[i].name == dirname) {
      if(f.data[i].data.length == 0) { //tmpfs CAN remove full directories but most FSes can't
        f.data.splice(i, 1);
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
}

function tmpfs_create(id, file) {
  if(tmpfs_exists(id, file)) { return false; }
  
  var o = file.lastIndexOf("/");
  if(o == -1) { return null; }
  var fileNew = file.substring(o + 1);
  file = file.substring(0, o);
  if(file == "") { file = "/"; }
  
  var f = tmpfs_get_file(id, file);
  if(f == null) { return null; }
  if(f.type != "dir") { return null; }
  
  f.data.push({name: fileNew, type: "file", data: ""});
  return true;
}

function tmpfs_remove(id, file) {
  if(!tmpfs_exists(id, file)) { return null; }
  if(tmpfs_isdir(id, file)) { return false; } //tmpfs CAN remove whole directories but most FSes can't
  
  var o = file.lastIndexOf("/");
  if(o == -1) { return null; }
  var fileNew = file.substring(o + 1);
  file = file.substring(0, o);
  if(file == "") { file = "/"; }
  
  var f = tmpfs_get_file(id, file);
  if(f == null) { return null; }
  if(f.type != "dir") { return null; }
  
  for(var i = 0; i < f.data.length; i++) {
    if(f.data[i].name == fileNew) {
      f.data.splice(i, 1);
      return true;
    }
  }
  return false;
}
