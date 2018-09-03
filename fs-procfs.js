var procfs_files = {
  name: "/",
  type: "dir",
  data: [
    {name: "mounts", type: "file", data: function() {
      var out = "";
      for(var i = 0; i < fs_mounts.length; i++) {
        var propsRaw = fs_mounts[i].params;
        var props = "";
        for(const [key, value] of Object.entries(propsRaw)) {
          if(props != "") { props += ","; }
          props += key + "=" + value;
        }
        out += fs_mounts[i].location + " " + fs_mounts[i].type + " " + props + "\n";
      }
      return out;
    }}
  ]
};

function procfs_mount(id, params) {
  
}

function procfs_umount(id) {
  
}

function procfs_get_file(id, file) {
  var dir = procfs_files;
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

function procfs_ls(id, file) {
  var dir = procfs_get_file(id, file);
  if(dir == null) { return null; }
  if(dir.type != "dir") { return null; }
  
  var out = [];
  for(var i = 0; i < dir.data.length; i++) {
    out.push(dir.data[i].name);
  }
  return out;
}

function procfs_exists(id, file) {
  var f = procfs_get_file(id, file);
  if(f != null) {
    return true;
  }
  return false;
}

function procfs_isdir(id, file) {
  var f = procfs_get_file(id, file);
  if(f == null) { return null; }
  
  if(f.type == "dir") { return true; }
  return false;
}

function procfs_open(id, file, params) {
  var f = procfs_get_file(id, file);
  if(f == null) { return null; }
  if(f.type != "file") { return null; }
  
  var fd = syscall_fd_create();
  syscall_fd_set_info(fd, {fsid: id, file: file, size: f.data().length, pos: 0});
  
  syscall_fd_bind_read(fd, function(fd, bytes) {
    var info = syscall_fd_info(fd);
    var f = procfs_get_file(info.fsid, info.file);
    if(f == null) { return null; }
    if(f.type != "file") { return null; }
    
    if(bytes + info.pos >= info.size) { bytes = info.size - info.pos; } //FIXME check if this is off-by-one or not
    var out = f.data().substring(info.pos, info.pos + bytes); //TODO: cache result of f.data() while file is open (like httpfs)
    info.pos += bytes;
    syscall_fd_set_info(fd, info);
    return out;
  });
  
  syscall_fd_bind_write(fd, function(fd, data) {
    return false;
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

function procfs_close(fd) {
  syscall_fd_destroy(fd);
}

function procfs_mkdir(id, file) {
  return false;
}

function procfs_create(id, file) {
  return false;
}
