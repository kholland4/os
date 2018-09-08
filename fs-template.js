var templatefs_fs = [];

function templatefs_mount(id, params) {
  templatefs_fs.push({id: id});
}

function templatefs_umount(id) {
  var idx = templatefs_get_index(id);
  templatefs_fs.splice(idx, 1);
}

function templatefs_get_index(id) {
  for(var i = 0; i < templatefs_fs.length; i++) {
    if(templatefs_fs[i].id == id) {
      return i;
    }
  }
}

function templatefs_get_file(id, file) {
  var idx = httpfs_get_index(id);
  return null;
}

function templatefs_ls(id, file) {
  var dir = templatefs_get_file(id, file);
  if(dir == null) { return null; }
  if(dir.type != "dir") { return null; }
  
  var out = [];
  return out;
}

function templatefs_exists(id, file) {
  var idx = httpfs_get_index(id);
  return false;
}

function templatefs_isdir(id, file) {
  var f = templatefs_get_file(id, file);
  if(f == null) { return null; }
  
  if(f.type == "dir") { return true; }
  return false;
}

function templatefs_open(id, file, params) {
  var data = httpfs_get_file(id, file);
  if(data == null) { return null; }
  
  var fd = syscall_fd_create();
  syscall_fd_set_info(fd, {fsid: id, file: file, size: data.length, pos: 0})
  
  syscall_fd_bind_read(fd, function(fd, bytes) {
    var info = syscall_fd_info(fd);
    
    if(bytes + info.pos >= info.size) { bytes = info.size - info.pos; } //FIXME check if this is off-by-one or not
    var out = null;
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
  
  syscall_fd_bind_truncate(fd, function(fd, data) {
    return false;
  });
  
  return fd;
}

function templatefs_close(fd) {
  syscall_fd_destroy(fd);
}

function templatefs_mkdir(id, file) {
  return false;
}

function templatefs_rmdir(id, file) {
  return false;
}

function templatefs_create(id, file) {
  return false;
}

function templatefs_remove(id, file) {
  return false;
}
