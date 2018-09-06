function(args, stdin, stdout, stderr) {
  var size = {width: 640, height: 480};
  var gfx_id = libwm_create(size.width, size.height);
  gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#000000");
  
  function overlapRect(l1, r1, l2, r2) {
    //https://www.geeksforgeeks.org/find-two-rectangles-overlap/
    if(l1.x > r2.x || l2.x > r1.x) { return false; }
    if(l1.y > r2.y || l2.y > r1.y) { return false; }
    return true;
  }
  
  var paddles = [ {x: 30, y: 210, w: 10, h: 60, sx: 0, sy: 0}, {x: 600, y: 210, w: 10, h: 60, sx: 0, sy: 0} ];
  var ball = { x: 310, y: 230, w: 20, h: 20 };
  var ballSpeed = { x: 1, y: 1 };
  
  var points = [0, 0];
  
  gfx_bind_mousemove(gfx_id, function(x, y) {
    //TODO: speed-limit tracking
    paddles[0].y = y - (paddles[0].h / 2);
  });
  
  //TODO: stop interval when libwm_destroy
  gfx_register_interval(gfx_id, setInterval(function() {
    //rendering
    gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#000000");
    
    for(var i = 0; i < paddles.length; i++) {
      gfx_fillrect(gfx_id, paddles[i].x, paddles[i].y, paddles[i].w, paddles[i].h, "#FF0000");
    }
    
    gfx_fillrect(gfx_id, ball.x, ball.y, ball.w, ball.h, "#FFFFFF");
    
    gfx_text(gfx_id, "20px monospace", "#FFFFFF", points[0].toString(), 10, 30);
    gfx_text(gfx_id, "20px monospace", "#FFFFFF", points[1].toString(), size.width - 10 - gfx_measuretext(gfx_id, "20px monospace", points[1].toString()).width, 30);
    
    //motion
    ball.x += ballSpeed.x;
    ball.y += ballSpeed.y;
    
    //collisions
    if(ball.x < 0) {
      ballSpeed.x *= -1;
      points[1]++;
    } else if(ball.x + ball.w >= size.width) {
      ballSpeed.x *= -1;
      points[0]++;
    }
    if(ball.y < 0 || ball.y + ball.h >= size.height) {
      ballSpeed.y *= -1;
    }
    
    for(var i = 0; i < paddles.length; i++) {
      if(overlapRect(paddles[i], {x: paddles[i].x + paddles[i].w, y: paddles[i].y + paddles[i].h}, ball, {x: ball.x + ball.w, y: ball.y + ball.h})) {
        ballSpeed.x *= -1;
      }
    }
  }, 1 / 10));
}
