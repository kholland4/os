function(args, stdin, stdout, stderr) {
  //TODO: fix ability to use mouse through other windows
  
  var BORDER_SIZE = 3;
  var BAR_SIZE = 20;
  var BUTTON_SIZE_X = 20;
  var BUTTON_SIZE_Y = 15;
  var BUTTON_COUNT = 1;
  
  syscall_loadlib("/usr/lib/libwm");
  var gfx_id;
  if(args.length >= 2) {
    if(args[1] == "window") {
      gfx_id = libwm_create(640, 480);
    } else {
      gfx_id = parseInt(args[1]);
    }
  } else {
    gfx_id = gfx_get_default();
  }
  var size = gfx_get_size(gfx_id);
  gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#FFFFFF");
  
  var winSelID = null;
  var winSelPos = null;
  
  gfx_bind_mousemove(gfx_id, function(x, y) {
    var win = libwm_windows;
    for(var i = 0; i < win.length; i++) {
      var size = gfx_get_size(win[i].id);
      if(x >= win[i].x && x < win[i].x + size.width && y >= win[i].y && y < win[i].y + size.height) {
        gfx_trigger_mousemove(win[i].id, x - win[i].x, y - win[i].y);
      }
      //dragging
      if(winSelID == win[i].id) {
        win[i].x = x + winSelPos.x;
        win[i].y = y + winSelPos.y;
      }
    }
  });
  
  gfx_bind_click(gfx_id, function(x, y) {
    var win = libwm_windows;
    for(var i = 0; i < win.length; i++) {
      var size = gfx_get_size(win[i].id);
      if(x >= win[i].x && x < win[i].x + size.width && y >= win[i].y && y < win[i].y + size.height) {
        gfx_trigger_click(win[i].id, x - win[i].x, y - win[i].y);
      }
      //TODO: bar buttons
    }
  });
  
  gfx_bind_mousedown(gfx_id, function(x, y) {
    var win = libwm_windows;
    var hitWin = false;
    var toDestroy = [];
    for(var i = 0; i < win.length; i++) {
      var size = gfx_get_size(win[i].id);
      if(x >= win[i].x && x < win[i].x + size.width && y >= win[i].y && y < win[i].y + size.height) {
        gfx_trigger_mousedown(win[i].id, x - win[i].x, y - win[i].y);
        hitWin = true;
        
        for(var n = 0; n < win.length; n++) {
          win[n].focus = false;
        }
        win[i].focus = true;
      } else if(x >= win[i].x - BORDER_SIZE && x < win[i].x + size.width + BORDER_SIZE && y >= win[i].y - BAR_SIZE && y < win[i].y) {
        //buttons?
        if(x >= win[i].x + size.width - (BUTTON_SIZE_X * BUTTON_COUNT) && x < win[i].x + size.width && y >= win[i].y - BAR_SIZE && y < win[i].y + BUTTON_SIZE_Y) {
          //buttons
          //TOOD: multi-button support
          //libwm_destroy(win[i].id);
          toDestroy.push(i);
        } else {
          //on bar
          winSelID = win[i].id;
          winSelPos = {
            x: win[i].x - x,
            y: win[i].y - y
          };
          
          for(var n = 0; n < win.length; n++) {
            win[n].focus = false;
          }
          win[i].focus = true;
          hitWin = true;
        }
      }
    }
    
    //destroy closed window(s)
    for(var i = toDestroy.length - 1; i >= 0; i--) {
      libwm_destroy(win[toDestroy[i]].id);
    }
    
    if(!hitWin) {
      for(var i = 0; i < win.length; i++) {
        win[i].focus = false;
      }
    }
    
    //move focused window to the top
    var toFocus = null;
    for(var i = 0; i < libwm_windows.length; i++) {
      if(libwm_windows[i].focus) {
        toFocus = i;
      }
    }
    if(toFocus != null) {
      var w = libwm_windows[toFocus];
      libwm_windows.splice(toFocus, 1);
      libwm_windows.push(w);
    }
  });
  
  gfx_bind_mouseup(gfx_id, function(x, y) {
    var win = libwm_windows;
    for(var i = 0; i < win.length; i++) {
      var size = gfx_get_size(win[i].id);
      if(x >= win[i].x && x < win[i].x + size.width && y >= win[i].y && y < win[i].y + size.height) {
        gfx_trigger_mouseup(win[i].id, x - win[i].x, y - win[i].y);
      }
    }
    
    winSelID = null;
    winSelPos = null;
  });
  
  gfx_bind_keypress(gfx_id, function(e) {
    var win = libwm_windows;
    for(var i = 0; i < win.length; i++) {
      if(win[i].focus) {
        gfx_trigger_keypress(win[i].id, e);
      }
    }
  });
  
  setInterval(function() {
    var size = gfx_get_size(gfx_id);
    gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#FFFFFF");
    var win = libwm_windows;
    for(var i = 0; i < win.length; i++) {
      var size = gfx_get_size(win[i].id);
      //border
      var color = "#3333FF"; if(!win[i].focus) { color = "#7777FF"; }
      gfx_fillrect(gfx_id, win[i].x - BORDER_SIZE, win[i].y - BAR_SIZE, size.width + (BORDER_SIZE * 2), size.height + (BORDER_SIZE + BAR_SIZE), color);
      
      //close button
      var color = "#FF3333"; if(!win[i].focus) { color = "#FF7777"; }
      gfx_fillrect(gfx_id, win[i].x + size.width - BUTTON_SIZE_X, win[i].y - BAR_SIZE, BUTTON_SIZE_X, BUTTON_SIZE_Y, color);
      
      gfx_copy(gfx_id, win[i].id, win[i].x, win[i].y);
    }
  }, 30);
}
