function(args, stdin, stdout, stderr) {
  if(args.length == 2) {
    var target = shell_process_relative(ENV_CWD, args[1]);
    
    //get file from user
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    fileInput.onchange = function(e) {
      if(!window.FileReader) { return; }
      var reader = new FileReader();
      reader.onload = function(e) {
        if(e.target.readyState != 2) { return; }
        if(e.target.error) { } //TODO
        
        var data = e.target.result;
        
        var res = fs_create(target);
        if(res == null) { syscall_pipe_write(stderr, "error\n"); return; }
        var fd = fs_open(target);
        if(fd == null) { syscall_pipe_write(stderr, "error\n"); return; }
        syscall_fd_write(fd, data);
        fs_close(fd);
      };
      reader.readAsText(e.target.files[0]);
    };
    fileInput.click();
  }
}
