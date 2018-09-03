function(args, stdin, stdout, stderr) {
  var size = {width: 100, height: 100};
  var gfx_id = libwm_create(size.width, size.height);
  gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#FFFFFF");
  
  gfx_bind_mousemove(gfx_id, function(x, y) {
    gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#FFFFFF");
    gfx_fillrect(gfx_id, x - 5, y - 5, 10, 10, "#FF0000");
  });
}
