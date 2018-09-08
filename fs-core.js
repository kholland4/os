//TODO: truncate
//TODO: rename/move
//TODO: delete
//TODO: fs-devtmpfs.js

fs_mounts = [];
fs_mounts_next = 0;

//TODO: make sure mount is in an actual directory and isn't already a mounted
function fs_mount(target, type, params) {
  var mount_data = {
    id: fs_mounts_next,
    location: target,
    type: type,
    params: params
  };
  fs_mounts.push(mount_data);
  fs_mounts_next++;
  
  if(type == "tmpfs") {
    tmpfs_mount(mount_data.id, params);
  } else if(type == "httpfs") {
    httpfs_mount(mount_data.id, params);
  } else if(type == "procfs") {
    procfs_mount(mount_data.id, params);
  }
}

//TODO: look for open files on target
function fs_umount(target) {
  var id = null;
  var idx = null;
  var type = null;
  for(var i = 0; i < fs_mounts.length; i++) {
    var mount_data = fs_mounts[i];
    if(mount_data.location == target) {
      id = mount_data.id;
      idx = i;
      type = mount_data.type;
    }
  }
  if(id == null) { return null; }
  
  if(type == "tmpfs") {
    tmpfs_umount(id);
  } else if(type == "httpfs") {
    httpfs_umount(id);
  } else if(type == "procfs") {
    procfs_umount(id);
  }
  fs_mounts.splice(idx, 1);
}

function fs_find(file) { //finds the containing mount for a file
  var best_len = 0;
  var best_id = -1;
  for(var i = 0; i < fs_mounts.length; i++) {
    var mount_data = fs_mounts[i];
    if(file.startsWith(mount_data.location)) {
      if(mount_data.location.length > best_len) {
        best_len = mount_data.location.length;
        best_id = mount_data.id;
      }
    }
  }
  
  if(best_id == -1) {
    return null;
  } else {
    var subpath = file;
    if(best_len > 1) {
      subpath = file.substring(best_len);
    }
    if(subpath == "") { subpath = "/"; } //FIXME
    return {id: best_id, subpath: subpath};
  }
}

function fs_get_index(id) {
  for(var i = 0; i < fs_mounts.length; i++) {
    if(fs_mounts[i].id == id) {
      return i;
    }
  }
}

function fs_ls(file) {
  var location = fs_find(file);
  if(location == null) { return null; }
  var idx = fs_get_index(location.id);
  
  if(fs_mounts[idx].type == "tmpfs") {
    return tmpfs_ls(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "httpfs") {
    return httpfs_ls(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "procfs") {
    return procfs_ls(location.id, location.subpath);
  }
  return null;
}

function fs_exists(file) {
  var location = fs_find(file);
  if(location == null) { return false; }
  var idx = fs_get_index(location.id);
  
  if(fs_mounts[idx].type == "tmpfs") {
    return tmpfs_exists(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "httpfs") {
    return httpfs_exists(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "procfs") {
    return procfs_exists(location.id, location.subpath);
  }
  
  return false;
}

function fs_isdir(file) {
  var location = fs_find(file);
  if(location == null) { return null; }
  var idx = fs_get_index(location.id);
  
  if(fs_mounts[idx].type == "tmpfs") {
    return tmpfs_isdir(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "httpfs") {
    return httpfs_isdir(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "procfs") {
    return procfs_isdir(location.id, location.subpath);
  }
  
  return null;
}

//STANDARD FD INFO ATTRS: fsid (mount id), file (file path), size (file size), pos: (file cursor pos)

function fs_open(file, params) {
  var location = fs_find(file);
  if(location == null) { return null; }
  var idx = fs_get_index(location.id);
  
  if(fs_mounts[idx].type == "tmpfs") {
    return tmpfs_open(location.id, location.subpath, params);
  } else if(fs_mounts[idx].type == "httpfs") {
    return httpfs_open(location.id, location.subpath, params);
  } else if(fs_mounts[idx].type == "procfs") {
    return procfs_open(location.id, location.subpath, params);
  }
  
  return null;
}

function fs_close(fd) {
  var info = syscall_fd_info(fd);
  var idx = fs_get_index(info.fsid);
  if(fs_mounts[idx].type == "tmpfs") {
    return tmpfs_close(fd);
  } else if(fs_mounts[idx].type == "httpfs") {
    return httpfs_close(fd);
  } else if(fs_mounts[idx].type == "procfs") {
    return procfs_close(fd);
  }
  
  return null;
}

function fs_mkdir(file) {
  var location = fs_find(file); //fs_find will work even with a non-existent directory on the end
  if(location == null) { return null; }
  var idx = fs_get_index(location.id);
  
  if(fs_mounts[idx].type == "tmpfs") {
    return tmpfs_mkdir(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "httpfs") {
    return httpfs_mkdir(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "procfs") {
    return procfs_mkdir(location.id, location.subpath);
  }
  
  return null;
}

//TODO: check for active mounts
function fs_rmdir(file) {
  var location = fs_find(file);
  if(location == null) { return null; }
  var idx = fs_get_index(location.id);
  
  if(fs_mounts[idx].type == "tmpfs") {
    return tmpfs_rmdir(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "httpfs") {
    return httpfs_rmdir(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "procfs") {
    return procfs_rmdir(location.id, location.subpath);
  }
  
  return null;
}

function fs_create(file) {
  var location = fs_find(file); //fs_find will work even with a non-existent file on the end
  if(location == null) { return null; }
  var idx = fs_get_index(location.id);
  
  if(fs_mounts[idx].type == "tmpfs") {
    return tmpfs_create(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "httpfs") {
    return httpfs_create(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "procfs") {
    return procfs_create(location.id, location.subpath);
  }
  
  return null;
}

function fs_remove(file) {
  var location = fs_find(file);
  if(location == null) { return null; }
  var idx = fs_get_index(location.id);
  
  if(fs_mounts[idx].type == "tmpfs") {
    return tmpfs_remove(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "httpfs") {
    return httpfs_remove(location.id, location.subpath);
  } else if(fs_mounts[idx].type == "procfs") {
    return procfs_remove(location.id, location.subpath);
  }
  
  return null;
}
