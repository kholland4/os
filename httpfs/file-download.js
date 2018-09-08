function(args, stdin, stdout, stderr) {
  if(args.length == 2) {
    var file = shell_process_relative(ENV_CWD, args[1]);
    if(!fs_exists(file)) {
      syscall_pipe_write(stderr, file + ": No such file or directory\n");
      return;
    }
    if(fs_isdir(file)) {
      syscall_pipe_write(stderr, file + ": Is a directory\n");
      return;
    }
    var fd = fs_open(file);
    if(fd == null) {
      syscall_pipe_write(stderr, file + ": Cannot open file\n");
      return;
    }
    var data = syscall_fd_read(fd, syscall_fd_info(fd).size);
    fs_close(fd);
    
    var a = document.createElement("a");
    a.href = "data:application/x-octet-stream;base64," + btoa(data);
    a.download = args[1]; //FIXME basename() equivalent
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
