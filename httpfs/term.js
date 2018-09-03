function(args, stdin, stdout, stderr) {
  //TODO: line wrapping
  
  var size = {width: 600, height: 400};
  var gfx_id = libwm_create(size.width, size.height);
  gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#000000");
  
  var stdin = syscall_pipe_create();
  var stdout = syscall_pipe_create();
  var stderr = syscall_pipe_create();
  
  var buf = "";
  var FONT_SIZE = 12;
  var LINE_SIZE = 16;
  
  function getLines(text) {
    var raw = text.split("\n");
    var out = [];
    for(var i = 0; i < raw.length; i++) {
      if(raw[i] != "") {
        out.push(raw[i]);
      }
    }
    return out;
  }
  
  function render() {
    gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#000000");
    
    var lines = getLines(buf);
    var maxLines = Math.floor(gfx_get_size(gfx_id).height / LINE_SIZE);
    var offset = 0;
    if(lines.length > maxLines) {
      offset = lines.length - maxLines;
    }
    
    for(var i = 0; i < Math.min(lines.length, maxLines); i++) {
      gfx_text(gfx_id, FONT_SIZE.toString() + "px monospace", "#FFFFFF", lines[i + offset], 0, LINE_SIZE * (i + 1));
    }
  }
  
  //writing to terminal
  syscall_pipe_bind_read(stdout, function(data) {
    //TODO: scrolling-friendly modifications
    if(data == "\r") { //FIXME - multi-char strings
      var idx = buf.lastIndexOf("\n");
      if(idx != -1) {
        buf = buf.substring(0, idx + 1);
      } else {
        buf = "";
      }
    } else {
      buf += data;
    }
    render();
  });
  syscall_pipe_bind_read(stderr, function(data) {
    //TODO - \r
    buf += data;
    render();
  });
  
  gfx_bind_keypress(gfx_id, function(e) {
    //prevent Firefox quick find - https://greasyfork.org/en/scripts/13484-prevent-slash-opening-quickfind
    if(e.charCode == 47 || e.charCode == 39) {
      e.preventDefault();
    }
    //capture tab
    if(e.keyCode == 9) {
      e.preventDefault();
    }
    
    if(e.keyCode == 13) { //enter
      syscall_pipe_write(stdin, "\n");
    } else if(e.keyCode == 8) { //backspace
      syscall_pipe_write(stdin, "\b");
    } else if(e.keyCode == 9) { //tab
      syscall_pipe_write(stdin, "\t");
    } else if(e.charCode != 0) {
      syscall_pipe_write(stdin, String.fromCharCode(e.charCode)); //FIXME - docs say e.char should be used https://developer.mozilla.org/en-US/docs/Web/Events/keypress
    }
    //TODO: delete, home, end, etc.? or in shell?
  });
  
  syscall_run(["/bin/shell"], stdin, stdout, stderr);
}
