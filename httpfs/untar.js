function(args, stdin, stdout, stderr) {
  if(args.length < 2) { return; }
  var inFile = shell_process_relative(ENV_CWD, args[1]);
  if(!fs_exists(inFile)) {
    syscall_pipe_write(stderr, "tar: " + inFile + ": No such file or directory\n");
    return;
  }
  if(fs_isdir(inFile)) {
    syscall_pipe_write(stderr, "tar: " + inFile + ": Is a directory\n");
    return;
  }
  var fd = fs_open(inFile);
  if(fd == null) { syscall_pipe_write(stderr, "tar: " + inFile + ": Cannot open file\n"); }
  var data = syscall_fd_read(fd, syscall_fd_info(fd).size);
  fs_close(fd);
  
  var offset = 0;
  while(offset < data.length) {
    var header = data.substring(offset, offset + 512);
    //TODO: check checksum
    //TODO: filename prefix
    var fileName = header.substring(0, 100).replace(/\0/g, "");
    var size = parseInt(header.substring(124, 136).replace(/\0/g, ""), 8);
    var fileData = data.substring(offset + 512, offset + 512 + size);
    offset += Math.ceil((size + 512) / 512) * 512;
    
    if(fileName == "") { continue; }
    
    //TODO: skip unsafe paths
    var file = shell_process_relative(ENV_CWD, fileName);
    fs_create(file);
    var fd = fs_open(file);
    syscall_fd_write(fd, fileData);
    fs_close(fd);
  }
}
