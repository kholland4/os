function(args, stdin, stdout, stderr) {
  var size = {width: 100, height: 100};
  var gfx_id = libwm_create(size.width, size.height);
  gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#FFFFFF");
  
  var pos = {x: 0, y: 0};
  function render() {
    size = gfx_get_size(gfx_id);
    gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#FFFFFF");
    gfx_fillrect(gfx_id, pos.x - 5, pos.y - 5, 10, 10, "#FF0000");
  }
  
  gfx_bind_mousemove(gfx_id, function(x, y) {
    pos.x = x; pos.y = y;
    render();
  });
  
  gfx_bind_resize(gfx_id, render);
}
