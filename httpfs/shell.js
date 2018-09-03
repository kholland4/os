function(args, stdin, stdout, stderr) {
  //TODO: mount
  //TODO: pipes and >
  //TODO: shell vars
  //TODO: glob operator *
  //TODO: remove multi-shell support?

  var shells = [];
  var shell_id_next = 0;
  function shell_create(stdin, stdout, stderr) {
    var shell_id = shell_id_next;
    shell_id_next++;
    shells.push({
      id: shell_id,
      cwd: ENV_CWD,
      inbuf: "",
      stdin: stdin,
      stdout: stdout,
      stderr: stderr
    });
    
    shell_bind(shell_id);
    
    shell_prompt(shell_id);
  }
  
  function shell_destroy(shell_id) {
    var idx = shell_get_index(shell_id);
    syscall_pipe_bind_read(shells[idx].stdin, null);
    shells.splice(idx, 1);
  }
  
  function shell_bind(shell_id) {
    var idx = shell_get_index(shell_id);
    var stdin = shells[idx].stdin;
    var stdout = shells[idx].stdout;
    var stderr = shells[idx].stderr;
    
    syscall_pipe_bind_read(stdin, function(data) {
      if(data == "\b") {
        if(shells[idx].inbuf.length > 0) {
          shells[idx].inbuf = shells[idx].inbuf.substring(0, shells[idx].inbuf.length - 1);
          syscall_pipe_write(stdout, "\r");
          shell_prompt(shell_id);
          syscall_pipe_write(stdout, shells[idx].inbuf);
        }
        return;
      } else if(data == "\t") {
        var buf = shells[idx].inbuf;
        if(buf.indexOf(" ") == -1) {
          if(buf.indexOf("/") == -1) {
            var opts = [];
            for(var i = 0; i < ENV_PATH.length; i++) {
              var c = fs_ls(ENV_PATH[i]);
              if(c != null) {
                opts = opts.concat(c);
              }
            }
            
            var vOpts = [];
            for(var i = 0; i < opts.length; i++) {
              if(opts[i].startsWith(buf)) {
                vOpts.push(opts[i]);
              }
            }
            
            if(vOpts.length == 1) {
              shells[idx].inbuf = vOpts[0] + " ";
              syscall_pipe_write(stdout, "\r");
              shell_prompt(shell_id);
              syscall_pipe_write(stdout, shells[idx].inbuf);
            }
            //TODO: list all options on double-tab
          } else {
            var obuf = buf;
            buf = shell_process_relative(shells[idx].cwd, buf);
            var dir = buf.substring(0, buf.lastIndexOf("/"));
            var odir = dir;
            if(dir == "") { dir = "/"; }
            var opts = fs_ls(dir);
            if(opts != null) {
              var vOpts = [];
              for(var i = 0; i < opts.length; i++) {
                if((odir + "/" + opts[i]).startsWith(buf)) {
                  vOpts.push(opts[i]);
                }
              }
              
              //TODO: only executables and dirs
              
              if(vOpts.length == 1) {
                shells[idx].inbuf = obuf.substring(0, obuf.lastIndexOf("/")) + "/" + vOpts[0] + " ";
                syscall_pipe_write(stdout, "\r");
                shell_prompt(shell_id);
                syscall_pipe_write(stdout, shells[idx].inbuf);
              }
            }
          }
        } else {
          var oobuf = buf;
          buf = buf.substring(buf.lastIndexOf(" ") + 1);
          var obuf = buf;
          buf = shell_process_relative(shells[idx].cwd, buf);
          var dir = buf.substring(0, buf.lastIndexOf("/"));
          var odir = dir;
          if(dir == "") { dir = "/"; }
          var opts = fs_ls(dir);
          if(opts != null) {
            var vOpts = [];
            for(var i = 0; i < opts.length; i++) {
              if((odir + "/" + opts[i]).startsWith(buf)) {
                vOpts.push(opts[i]);
              }
            }
            
            if(vOpts.length == 1) {
              if(obuf.indexOf("/") != -1) {
                shells[idx].inbuf = oobuf.substring(0, oobuf.lastIndexOf(" ") + 1) + obuf.substring(0, obuf.lastIndexOf("/")) + "/" + vOpts[0] + " ";
              } else {
                shells[idx].inbuf = oobuf.substring(0, oobuf.lastIndexOf(" ") + 1) + vOpts[0] + " ";
              }
              syscall_pipe_write(stdout, "\r");
              shell_prompt(shell_id);
              syscall_pipe_write(stdout, shells[idx].inbuf);
            }
          }
        }
        return;
      }
      
      syscall_pipe_write(stdout, data);
      //TODO: handle multibyte strings
      if(data != "\n") { 
        shells[idx].inbuf += data;
      } else {
        var buf = shells[idx].inbuf;
        shells[idx].inbuf = "";
        shell_exec(shell_id, buf);
        shell_prompt(shell_id);
      }
    });
  }

  function shell_get_index(id) {
    for(var i = 0; i < shells.length; i++) {
      if(shells[i].id == id) {
        return i;
      }
    }
  }

  function shell_exec(shell_id, cmd) {
    var idx = shell_get_index(shell_id);
    if(cmd != "" && cmd != null && cmd != undefined) {
      var args = cmd.trim().split(" ");
      
      if(args[0] == "cd") { //builtin: cd
        if(args.length == 2) {
          var newPath = shells[idx].cwd;
          //TODO: use shell_process_relative
          if(args[1] == ".") {
            
          } else if(args[1] == "..") {
            var s = newPath.lastIndexOf("/");
            if(s != -1) {
              newPath = newPath.substring(0, s);
            }
            if(newPath.length < 1) {
              newPath = "/";
            }
          } else if(args[1].charAt(0) == "/") { //absolute path
            //TODO: strip trailing slash (if any); remove any multiple-slashes
            newPath = args[1];
          } else {
            var newPath = shells[idx].cwd;
            if(newPath != "/") {
              newPath += "/";
            }
            
            newPath += args[1];
          }
          
          if(fs_exists(newPath)) {
            if(fs_isdir(newPath)) {
              shells[idx].cwd = newPath;
            } else {
              syscall_pipe_write(shells[idx].stderr, "cd: " + newPath + ": Not a directory\n");
            }
          } else {
            syscall_pipe_write(shells[idx].stderr, "cd: " + newPath + ": No such file or directory\n");
          }
        }
      } else if(args[0] == "exit") {
        shell_destroy(shell_id);
      } else {
        //TODO: validate form
        var file = args[0];
        if(file.indexOf("/") == -1) {
          for(var i = 0; i < ENV_PATH.length; i++) {
            if(fs_exists(ENV_PATH[i] + "/" + file)) {
              args[0] = ENV_PATH[i] + "/" + file;
            }
          }
        }
        
        if(args[0].indexOf("/") != -1) { //FIXME
          args[0] = shell_process_relative(shells[idx].cwd, args[0]);
          
          if(fs_exists(args[0])) {
            ENV_CWD = shells[idx].cwd;
            
            syscall_run(args, shells[idx].stdin, shells[idx].stdout, shells[idx].stderr);
            
            shell_bind(shell_id); //TODO: only rebind on program completion (even for event-driven shells)
          } else {
            syscall_pipe_write(shells[idx].stderr, args[0] + ": No such file or directory\n");
          }
        } else {
          syscall_pipe_write(shells[idx].stderr, args[0] + ": command not found\n");
        }
      }
    }
  }

  function shell_prompt(shell_id) {
    var idx = shell_get_index(shell_id);
    syscall_pipe_write(shells[idx].stdout, shells[idx].cwd + "$ ");
  }
  
  shell_create(stdin, stdout, stderr);
}
