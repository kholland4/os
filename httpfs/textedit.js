function(args, stdin, stdout, stderr) {
  //TODO: l/r scrolling
  
  if(args.length != 2) { syscall_pipe_write(stderr, "Bad args\n"); return; }
  var file = shell_process_relative(ENV_CWD, args[1]);
  if(!fs_exists(file)) { syscall_pipe_write(stderr, file + ": No such file or directory\n"); return; }
  if(fs_isdir(file)) { syscall_pipe_write(stderr, file + ": Is a directory\n"); return; }
  var fd = fs_open(file);
  if(fd == null) { syscall_pipe_write(stderr, "Error opening file\n"); return; }
  var buf = syscall_fd_read(fd, syscall_fd_info(fd).size);
  fs_close(fd);
  
  var size = {width: 576, height: 768};
  var gfx_id_window = libwm_create(size.width, size.height);
  
  var gfx_id = gfx_id_window;
  gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#FFFFFF");
  
  var FONT_SIZE = 12;
  var LINE_SIZE = 16;
  var font = FONT_SIZE.toString() + "px monospace";
  //var buf = "";
  var offset = {x: 0, y: 0};
  var cursor = {x: 0, y: LINE_SIZE, line: 0, col: 0, pos: 0, visible: true, flashState: true, flashDelay: false};
  
  function render() {
    size = gfx_get_size(gfx_id);
    gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#FFFFFF");
    
    var lines = buf.split("\n");
    var maxLines = Math.floor(gfx_get_size(gfx_id).height / LINE_SIZE);
    
    for(var i = 0; i < Math.min(lines.length, maxLines); i++) {
      gfx_text(gfx_id, font, "#000000", lines[i + offset.y], 0, LINE_SIZE * (i + 1));
    }
    
    if(cursor.visible && cursor.flashState) {
      //some cosmetic adjustments on cursor positioning
      gfx_line(gfx_id, cursor.x, cursor.y + 1, cursor.x, cursor.y + 1 - FONT_SIZE, "#000000", 0.5);
    }
  }
  
  function save() {
    var fd = fs_open(file);
    if(fd == null) { syscall_pipe_write(stderr, "Error opening file\n"); return; }
    syscall_fd_truncate(fd, 0);
    syscall_fd_write(fd, buf);
    fs_close(fd);
  }
  
  //recalc cursor properties based on cursor.pos
  function calcCursor() {
    var sub = buf.substring(0, cursor.pos);
    cursor.line = (sub.match(/\n/g) || []).length;
    var lines = buf.split("\n");
    cursor.col = sub.length - sub.lastIndexOf("\n") - 1;
    
    if(cursor.line < offset.y) {
      offset.y = cursor.line;
    } else {
      var maxLines = Math.floor(gfx_get_size(gfx_id).height / LINE_SIZE);
      if(cursor.line >= offset.y + maxLines) {
        offset.y = cursor.line - maxLines + 1;
      }
    }
    
    cursor.x = gfx_measuretext(gfx_id, font, lines[cursor.line].substring(0, cursor.col)).width;
    cursor.y = ((cursor.line + 1) - offset.y) * LINE_SIZE; //add one to line b/c canvas text uses bottom as position
    
    cursor.flashState = true;
    cursor.flashDelay = true;
  }
  
  //move the cursor on click
  gfx_bind_click(gfx_id, function(x, y) {
    var line = Math.floor(y / LINE_SIZE) + offset.y; /* round down to nearest line and apply offset */
    
    var char = 0;
    var charX = 0;
    var lines = buf.split("\n");
    if(line >= lines.length) { return; }
    var lineData = lines[line];
    for(var i = 0; i <= lineData.length; i++) {
      var wThis = gfx_measuretext(gfx_id, font, lineData.substring(0, i)).width;
      var wNext = null;
      if(i + 1 <= lineData.length) { wNext = gfx_measuretext(gfx_id, font, lineData.substring(0, i + 1)).width; }
      
      if(wNext == null || x < ((wThis + wNext) / 2)) {
        char = i;
        charX = Math.floor(wThis);
        break;
      }
    }
    
    cursor.x = charX;
    cursor.y = ((line + 1) - offset.y) * LINE_SIZE; //add one to line b/c canvas text uses bottom as position
    cursor.line = line;
    cursor.col = char;
    cursor.pos = 0;
    for(var i = 0; i < line; i++) {
      cursor.pos += lines[i].length + 1;
    }
    cursor.pos += char;
    
    cursor.flashState = true;
    cursor.flashDelay = true;
    
    render();
  });
  
  //keyboard input
  gfx_bind_keypress(gfx_id, function(e) {
    //prevent Firefox quick find - https://greasyfork.org/en/scripts/13484-prevent-slash-opening-quickfind
    if(e.key == "/" || e.key == "'") {
      e.preventDefault();
    }
    //capture tab
    if(e.keyCode == 9) {
      e.preventDefault();
    }
    
    var char = null;
    
    if(e.keyCode == 13) { //enter
      char = "\n";
    } else if(e.keyCode == 8) { //backspace
      char = "\b";
    } else if(e.keyCode == 9) { //tab
      char = "\t";
    } else if(e.key.length == 1) {
      char = e.key;
    }
    
    //TODO: delete, home, end, etc.
    //TODO: auto-indent and \t -> spaces
    if(char == "\b") {
      if(cursor.pos > 0) {
        buf = buf.substring(0, cursor.pos - 1) + buf.substring(cursor.pos);
        cursor.pos--;
        calcCursor();
      }
    } else if(char != null) {
      buf = buf.substring(0, cursor.pos) + char + buf.substring(cursor.pos);
      cursor.pos++;
      calcCursor();
    } else {
      //no char - do u/d/l/r keys
      if(e.keyCode == 38) { //up
        if(cursor.line > 0) {
          cursor.line--;
          var lines = buf.split("\n");
          if(cursor.col > lines[cursor.line].length) {
            cursor.col = lines[cursor.line].length;
          }
          
          cursor.pos = 0;
          for(var i = 0; i < cursor.line; i++) {
            cursor.pos += lines[i].length + 1;
          }
          cursor.pos += cursor.col;
          
          calcCursor();
        }
      } else if(e.keyCode == 40) { //down
        var lines = buf.split("\n");
        if(cursor.line + 1 < lines.length) {
          cursor.line++;
          if(cursor.col > lines[cursor.line].length) {
            cursor.col = lines[cursor.line].length;
          }
          
          cursor.pos = 0;
          for(var i = 0; i < cursor.line; i++) {
            cursor.pos += lines[i].length + 1;
          }
          cursor.pos += cursor.col;
          
          calcCursor();
        }
      } else if(e.keyCode == 37) { //left
        if(cursor.pos > 0) { cursor.pos--; }
        calcCursor();
      } else if(e.keyCode == 39) { //right
        if(cursor.pos < buf.length) { cursor.pos++; }
        calcCursor();
      }
    }
    render();
    save(); //FIXME
  });
  
  //cursor flashing
  gfx_register_interval(gfx_id, setInterval(function() {
    cursor.visible = libwm_get(gfx_id).focus;
    if(cursor.flashDelay) {
      cursor.flashDelay = false;
    } else {
      cursor.flashState = !cursor.flashState;
    }
    render(); //TODO: only partial rerender?
  }, 500));
  
  gfx_bind_resize(gfx_id_window, render);
  
  render();
}
