//TODO: libwm_move?
if(typeof libwm_windows === "undefined") { //don't reset libwm_windows when libwm is reloaded
  eval.call(window, "var libwm_windows = [];");
}

function libwm_create(width, height) {
  var id = gfx_create_buffer(width, height);
  libwm_windows.push({
    id: id,
    x: 50,
    y: 50,
    focus: false,
  });
  return id;
}

function libwm_destory(id) {
  for(var i = 0; i < libwm_windows.length; i++) {
    if(libwm_windows[i].id == id) {
      gfx_destroy(libwm_windows[i].id);
      libwm_windows.splice(i, 1);
      return;
    }
  }
}
