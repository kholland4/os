var httpfs_fs = [];
var httpfs_file_cache = [];

function httpfs_mount(id, params) {
  if(params.url.endsWith("/")) { params.url = params.url.substring(0, params.url.length - 1); }
  httpfs_fs.push({id: id, url: params.url});
}

function httpfs_umount(id) {
  var idx = httpfs_get_index(id);
  httpfs_fs.splice(idx, 1);
  
  //cache should be empty but just in case
  for(var i = httpfs_file_cache.length - 1; i >= 0; i--) {
    if(httpfs_file_cache[i].fsid == id) {
      httpfs_file_cache.splice(i, 1);
    }
  }
}

function httpfs_get_index(id) {
  for(var i = 0; i < httpfs_fs.length; i++) {
    if(httpfs_fs[i].id == id) {
      return i;
    }
  }
}

function httpfs_get_file(id, file) {
  var idx = httpfs_get_index(id);
  var url = httpfs_fs[idx].url + file;
  
  var request = new XMLHttpRequest();
  request.open("GET", url, false); //warning: this is a synchrounous request
  request.send(null);

  if(request.status == 200) {
    return request.responseText;
  }
  return null;
}

function httpfs_get_cached(fsid, file) {
  for(var i = 0; i < httpfs_file_cache.length; i++) {
    if(httpfs_file_cache[i].fsid == fsid && httpfs_file_cache[i].file == file) {
      return httpfs_file_cache[i].data;
    }
  }
  return null;
}

function httpfs_ls(id, file) {
  var f = httpfs_get_file(id, file);
  if(f == null) { return null; }
  if(!f.startsWith("HTTPFS_INDEX")) { return null; }
  
  var raw = f.split("\n");
  raw.splice(0, 1);
  var out = [];
  for(var i = 0; i < raw.length; i++) {
    if(raw[i] != "") {
      out.push(raw[i]);
    }
  }
  return out;
}

function httpfs_exists(id, file) {
  var idx = httpfs_get_index(id);
  var url = httpfs_fs[idx].url + file;
  
  var request = new XMLHttpRequest();
  request.open("HEAD", url, false); //warning: this is a synchrounous request
  request.send(null);

  if(request.status == 200) {
    return true;
  }
  return false;
}

function httpfs_isdir(id, file) {
  var data = httpfs_get_file(id, file);
  if(data == null) { return null; }
  return data.startsWith("HTTPFS_INDEX");
}

function httpfs_open(id, file, params) {
  var data = httpfs_get_file(id, file);
  if(data == null) { return null; }
  httpfs_file_cache.push({fsid: id, file: file, data: data});
  
  var fd = syscall_fd_create();
  syscall_fd_set_info(fd, {fsid: id, file: file, size: data.length, pos: 0})
  
  syscall_fd_bind_read(fd, function(fd, bytes) {
    var info = syscall_fd_info(fd);
    var f = httpfs_get_cached(info.fsid, info.file);
    if(f == null) { return null; }
    
    if(bytes + info.pos >= info.size) { bytes = info.size - info.pos; } //FIXME check if this is off-by-one or not
    var out = f.substring(info.pos, info.pos + bytes);
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

function httpfs_close(fd) {
  var info = syscall_fd_info(fd);
  for(var i = 0; i < httpfs_file_cache.length; i++) {
    if(httpfs_file_cache[i].fsid == info.fsid && httpfs_file_cache[i].file == info.file) {
      httpfs_file_cache.splice(i, 1);
      syscall_fd_destroy(fd);
      return;
    }
  }
  syscall_fd_destroy(fd);
}

function httpfs_mkdir(id, file) {
  return false;
}

function httpfs_rmdir(id, file) {
  return false;
}

function httpfs_create(id, file) {
  return false;
}

function httpfs_remove(id, file) {
  return false;
}
