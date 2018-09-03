var gfx_ctx = [];

function gfx_create(canvas, width, height) {
  var ctx = canvas.getContext("2d", {alpha: false});
  //TODO: bind auto resize here
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  
  //FIXME
  ctx.canvas.tabIndex = terminal_tabindex_next;
  terminal_tabindex_next++;
  
  gfx_ctx.push(ctx);
  return gfx_ctx.length - 1;
}

function gfx_create_buffer(width, height) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d", {alpha: false});
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  
  gfx_ctx.push(ctx);
  return gfx_ctx.length - 1;
}

function gfx_resize(id, width, height) {
  var ctx = gfx_ctx[id];
  ctx.canvas.width = width;
  ctx.canvas.height = height;
}

function gfx_destroy(id) {
  gfx_ctx[id] = null;
}

function gfx_get_default() {
  if(gfx_ctx.length == 0) { return null; }
  return 0;
}

function gfx_get_size(id) {
  var ctx = gfx_ctx[id];
  return {
    width: ctx.canvas.width,
    height: ctx.canvas.height
  };
}

function gfx_bind_mousedown(id, callback) {
  var ctx = gfx_ctx[id];
  ctx.canvas.onmousedown = function(e, x, y) {
    if(x != undefined && y != undefined) { callback(x, y); return; }
    var rect = this.getBoundingClientRect();
    callback(e.clientX - rect.left, e.clientY - rect.top);
  };
}

function gfx_trigger_mousedown(id, x, y) {
  var ctx = gfx_ctx[id];
  if(ctx.canvas.onmousedown == null) { return; }
  ctx.canvas.onmousedown(null, x, y);
}

function gfx_bind_mouseup(id, callback) {
  var ctx = gfx_ctx[id];
  ctx.canvas.onmouseup = function(e, x, y) {
    if(x != undefined && y != undefined) { callback(x, y); return; }
    var rect = this.getBoundingClientRect();
    callback(e.clientX - rect.left, e.clientY - rect.top);
  };
}

function gfx_trigger_mouseup(id, x, y) {
  var ctx = gfx_ctx[id];
  if(ctx.canvas.onmouseup == null) { return; }
  ctx.canvas.onmouseup(null, x, y);
}

function gfx_bind_click(id, callback) {
  var ctx = gfx_ctx[id];
  ctx.canvas.onclick = function(e, x, y) {
    if(x != undefined && y != undefined) { callback(x, y); return; }
    var rect = this.getBoundingClientRect();
    callback(e.clientX - rect.left, e.clientY - rect.top);
  };
}

function gfx_trigger_click(id, x, y) {
  var ctx = gfx_ctx[id];
  if(ctx.canvas.onclick == null) { return; }
  ctx.canvas.onclick(null, x, y);
}

function gfx_bind_mousemove(id, callback) {
  var ctx = gfx_ctx[id];
  ctx.canvas.onmousemove = function(e, x, y) {
    if(x != undefined && y != undefined) { callback(x, y); return; }
    var rect = this.getBoundingClientRect();
    callback(e.clientX - rect.left, e.clientY - rect.top);
  };
}

function gfx_trigger_mousemove(id, x, y) {
  var ctx = gfx_ctx[id];
  if(ctx.canvas.onmousemove == null) { return; }
  ctx.canvas.onmousemove(null, x, y);
}

function gfx_bind_keypress(id, callback) {
  var ctx = gfx_ctx[id];
  ctx.canvas.onkeypress = callback;
}

function gfx_trigger_keypress(id, e) {
  var ctx = gfx_ctx[id];
  if(ctx.canvas.onkeypress == null) { return; }
  ctx.canvas.onkeypress(e);
}

function gfx_fillrect(id, x, y, w, h, color) {
  var ctx = gfx_ctx[id];
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function gfx_strokerect(id, x, y, w, h, color, linewidth) {
  var ctx = gfx_ctx[id];
  ctx.strokeStyle = color;
  ctx.lineWidth = linewidth;
  ctx.strokeRect(x, y, w, h);
}

function gfx_path_fill(id, color) {
  var ctx = gfx_ctx[id];
  ctx.fillStyle = color;
  ctx.fill();
}

function gfx_path_stroke(id, color, linewidth) {
  var ctx = gfx_ctx[id];
  ctx.strokeStyle = color;
  ctx.lineWidth = linewidth;
  ctx.stroke();
}

function gfx_path_begin(id) {
  var ctx = gfx_ctx[id];
  ctx.beginPath();
}

function gfx_path_moveto(id, x, y) {
  var ctx = gfx_ctx[id];
  ctx.moveTo(x, y);
}

function gfx_path_close(id) {
  var ctx = gfx_ctx[id];
  ctx.closePath();
}

function gfx_path_lineto(id, x, y) {
  var ctx = gfx_ctx[id];
  ctx.lineTo(x, y);
}

function gfx_path_rect(id, x, y, w, h) {
  var ctx = gfx_ctx[id];
  ctx.rect(x, y, w, h);
}

//TODO: ctx.clip()

function gfx_path_quadratic(id, cpx, cpy, x, y) {
  var ctx = gfx_ctx[id];
  ctx.quadraticCurveTo(cpx, cpy, x, y);
}

function gfx_path_bezier(id, cp1x, cp1y, cp2x, cp2y, x, y) {
  var ctx = gfx_ctx[id];
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
}

function gfx_path_arc(id, x, y, r, sAngle, eAngle, counterclockwise = false) {
  var ctx = gfx_ctx[id];
  ctx.arc(x, y, r, sAngle, eAngle, counterclockwise);
}

function gfx_path_arcto(id, x1, y1, x2, y2, r) {
  var ctx = gfx_ctx[id];
  ctx.arc(x1, y1, x2, y2, r);
}

//TODO: text
//TODO: images

function gfx_copy(id, source, x, y) {
  var sourceCTX = gfx_ctx[source].canvas;
  var destCTX = gfx_ctx[id];
  destCTX.drawImage(sourceCTX, x, y);
}

function gfx_text(id, font, color, text, x, y) {
  var ctx = gfx_ctx[id];
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function gfx_measuretext(id, font, text) {
  var ctx = gfx_ctx[id];
  ctx.font = font;
  return ctx.measureText(text);
}
