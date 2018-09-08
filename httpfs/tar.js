function(args, stdin, stdout, stderr) {
  //TODO: extract file
  //TODO: proper flags
  
  if(args.length < 2) { return; }
  
  var BLOCK_SIZE = 20 * 512;
  
  var totalSize = 0;
  
  var outFile = shell_process_relative(ENV_CWD, args[args.length - 1]);
  if(fs_exists(outFile)) {
    syscall_pipe_write(stderr, "tar: " + outFile + ": File exists\n");
    return;
  }
  fs_create(outFile);
  var outFD = fs_open(outFile);
  if(outFD == null) {
    syscall_pipe_write(stderr, "tar: " + file + ": Cannot open file\n");
    return;
  }
  
  for(var i = 1; i < args.length - 1; i++) {
    var file = shell_process_relative(ENV_CWD, args[i]);
    if(!fs_exists(file)) {
      syscall_pipe_write(stderr, "tar: " + file + ": No such file or directory\n");
      continue;
    }
    if(fs_isdir(file)) {
      syscall_pipe_write(stderr, "tar: " + file + ": Is a directory\n");
      continue;
    }
    var fd = fs_open(file);
    if(fd != null) {
      var data = syscall_fd_read(fd, syscall_fd_info(fd).size);
      fs_close(fd);
      
      //tar header
      var header = "";
      header += args[i].padEnd(100, "\0"); //TODO: normalize file name
      header += "0000644\0"; //mode
      header += "0001750\0"; //uid
      header += "0001750\0"; //gid
      header += data.length.toString(8).padStart(11, "0") + "\0"; //file size TODO: if file is too big
      header += Math.floor(Date.now() / 1000).toString(8).padStart(11, "0") + "\0"; /* last modified TODO: if timestamp is too big */
      header += "        "; //placeholder for checksum
      header += "0"; //link type none
      header += "".padEnd(100, "\0"); //no link name
      //UStar header extension
      header += "ustar  \0"; //magic
      //header += "00"; //UStar version
      header += "".padEnd(32, "\0"); //owner username
      header += "".padEnd(32, "\0"); //owner group name
      header += "".padEnd(16, "\0"); //device major/minor number
      header += "".padEnd(155, "\0"); //filename prefix
      header += "".padEnd(12, "\0"); //pad out to 512
      
      var checksum = 0;
      for(var n = 0; n < header.length; n++) {
        checksum += header.charCodeAt(n);
      }
      header = header.substring(0, 148) + checksum.toString(8).padStart(6, "0") + "\0 " + header.substring(156);
      
      var out = header + data;
      var m = Math.ceil(out.length / 512) * 512;
      out = out.padEnd(m, "\0");
      totalSize += out.length;
      
      syscall_fd_write(outFD, out);
    } else {
      syscall_pipe_write(stderr, "tar: " + file + ": Cannot open file\n");
      continue;
    }
  }
  
  var m = Math.ceil(totalSize / BLOCK_SIZE) * BLOCK_SIZE;
  syscall_fd_write(outFD, "".padEnd(m - totalSize, "\0"));
  
  fs_close(outFD);
}
