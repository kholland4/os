//-----PIPES-----
var syscall_pipe = [];
var syscall_pipe_next = 0; //TODO: replace with true dynamic allocation

//TODO: buffering?
function syscall_pipe_create() {
  //allocate a pipe id number
  var data = {
    id: syscall_pipe_next,
    target: null,
    info: {}
  };
  syscall_pipe.push(data);
  syscall_pipe_next++;
  return data.id;
}

function syscall_pipe_get_index(id) {
  for(var i = 0; i < syscall_pipe.length; i++) {
    if(syscall_pipe[i].id == id) {
      return i;
    }
  }
}

function syscall_pipe_destroy(id) {
  if(id == null) { return; }
  var idx = syscall_pipe_get_index(id);
  syscall_pipe.splice(idx, 1);
}

function syscall_pipe_write(id, data) {
  if(id == null) { return; }
  var idx = syscall_pipe_get_index(id);
  if(syscall_pipe[idx].target != null) {
    syscall_pipe[idx].target(data);
  }
}

function syscall_pipe_bind_read(id, callback) {
  if(id == null) { return; }
  var idx = syscall_pipe_get_index(id);
  syscall_pipe[idx].target = callback;
}

function syscall_pipe_unbind_read(id) {
  if(id == null) { return; }
  var idx = syscall_pipe_get_index(id);
  syscall_pipe[idx].target = null;
}

function syscall_pipe_info(id) {
  if(id == null) { return; }
  var idx = syscall_pipe_get_index(id);
  return syscall_pipe[idx].info;
}

function syscall_pipe_set_info(id, info) {
  if(id == null) { return; }
  var idx = syscall_pipe_get_index(id);
  syscall_pipe[idx].info = info;
}

//-----FILE DESCRIPTORS-----
//TODO: truncate-to-size
var syscall_fd = [];
var syscall_fd_next = 0; //TODO: replace with true dynamic allocation

//TODO: buffering?
function syscall_fd_create() {
  //allocate a FD id number
  var data = {
    id: syscall_fd_next,
    info: {},
    read: null,
    write: null,
    seek: null,
    truncate: null
  };
  syscall_fd.push(data);
  syscall_fd_next++;
  return data.id;
}

function syscall_fd_get_index(id) {
  for(var i = 0; i < syscall_fd.length; i++) {
    if(syscall_fd[i].id == id) {
      return i;
    }
  }
}

function syscall_fd_destroy(id) {
  var idx = syscall_fd_get_index(id);
  syscall_fd.splice(idx, 1);
}

//read
function syscall_fd_bind_read(id, callback) {
  var idx = syscall_fd_get_index(id);
  syscall_fd[idx].read = callback;
}

function syscall_fd_unbind_read(id) {
  var idx = syscall_fd_get_index(id);
  syscall_fd[idx].read = null;
}

function syscall_fd_read(id, amount) {
  var idx = syscall_fd_get_index(id);
  if(syscall_fd[idx].read != null) {
    return syscall_fd[idx].read(id, amount);
  }
  return null;
}

//write
function syscall_fd_bind_write(id, callback) {
  var idx = syscall_fd_get_index(id);
  syscall_fd[idx].write = callback;
}

function syscall_fd_unbind_write(id) {
  var idx = syscall_fd_get_index(id);
  syscall_fd[idx].write = null;
}

function syscall_fd_write(id, data) {
  var idx = syscall_fd_get_index(id);
  if(syscall_fd[idx].write != null) {
    syscall_fd[idx].write(id, data);
  }
}

//seek
function syscall_fd_bind_seek(id, callback) {
  var idx = syscall_fd_get_index(id);
  syscall_fd[idx].seek = callback;
}

function syscall_fd_unbind_seek(id) {
  var idx = syscall_fd_get_index(id);
  syscall_fd[idx].seek = null;
}

function syscall_fd_seek(id, pos) {
  var idx = syscall_fd_get_index(id);
  if(syscall_fd[idx].seek != null) {
    syscall_fd[idx].seek(id, pos);
  }
}

//truncate
function syscall_fd_bind_truncate(id, callback) {
  var idx = syscall_fd_get_index(id);
  syscall_fd[idx].truncate = callback;
}

function syscall_fd_unbind_truncate(id) {
  var idx = syscall_fd_get_index(id);
  syscall_fd[idx].truncate = null;
}

function syscall_fd_truncate(id, len) {
  var idx = syscall_fd_get_index(id);
  if(syscall_fd[idx].truncate != null) {
    syscall_fd[idx].truncate(id, len);
  }
}

//info
function syscall_fd_info(id) {
  var idx = syscall_fd_get_index(id);
  return syscall_fd[idx].info;
}

function syscall_fd_set_info(id, info) {
  var idx = syscall_fd_get_index(id);
  syscall_fd[idx].info = info;
}

//-----RUNNING PROGRAMS-----
function syscall_run(args, stdin, stdout, stderr) {
  var fd = fs_open(args[0]);
  var progRaw = syscall_fd_read(fd, syscall_fd_info(fd).size);
  fs_close(fd);
  
  //TODO: rebind stdin to shell if necessary? or do in shell?
  
  eval("var prog = " + progRaw + ";");
  prog(args, stdin, stdout, stderr);
}

function syscall_loadlib(file) {
  var fd = fs_open(file);
  var progRaw = syscall_fd_read(fd, syscall_fd_info(fd).size);
  fs_close(fd);
  
  eval.call(window, progRaw);
}

//-----MISC-----
var ENV_CWD = "/";
var ENV_PATH = ["/bin", "/usr/bin"];

function shell_process_relative(cwd, file) {
  //TODO: clean up path
  if(!file.startsWith("/")) {
    if(cwd == "/") {
      file = "/" + file;
    } else {
      file = cwd + "/" + file;
    }
  }
  
  var qty = (file.match(/\/\./g) || []).length;
  for(var i = 0; i < qty; i++) {
    file = file.replace("/./", "/");
  }
  file = file.replace(/\/\.$/, "");
  
  var qty = (file.match(/\/\.\./g) || []).length;
  for(var i = 0; i < qty; i++) {
    file = file.replace(/\/[^\/]+\/\.\.\//, "/");
  }
  file = file.replace(/\/[^\/]+\/\.\.$/, "");
  
  if(file == "") { file = "/"; }
  
  return file;
}
