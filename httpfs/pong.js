function(args, stdin, stdout, stderr) {
  var size = {width: 640, height: 480};
  var gfx_id = libwm_create(size.width, size.height);
  libwm_get(gfx_id).canResize = false;
  gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#000000");
  
  function overlapRect(l1, r1, l2, r2) {
    //https://www.geeksforgeeks.org/find-two-rectangles-overlap/
    if(l1.x > r2.x || l2.x > r1.x) { return false; }
    if(l1.y > r2.y || l2.y > r1.y) { return false; }
    return true;
  }
  
  var MAX_SPEED = 0.8;
  var BALL_SPEED = 1;
  
  var paddles = [
    {x: 30, y: 210, w: 10, h: 60, sx: 0, sy: 0, vert: true, orient: 1},
    {x: 600, y: 210, w: 10, h: 60, sx: 0, sy: 0, vert: true, orient: -1}
  ];
  var ball = { x: 310, y: 230, w: 20, h: 20 };
  var ballSpeed = { x: 1, y: 1 };
  
  var points = [0, 0];
  
  var mouse = { x: 0, y: 0 };
  
  gfx_bind_mousemove(gfx_id, function(x, y) {
    mouse.x = x;
    mouse.y = y;
  });
  
  //TODO: stop interval when libwm_destroy
  gfx_register_interval(gfx_id, setInterval(function() {
    //rendering
    gfx_fillrect(gfx_id, 0, 0, size.width, size.height, "#000000");
    
    for(var i = 0; i < paddles.length; i++) {
      gfx_fillrect(gfx_id, Math.round(paddles[i].x), Math.round(paddles[i].y), paddles[i].w, paddles[i].h, "#FF0000");
    }
    
    gfx_fillrect(gfx_id, Math.round(ball.x), Math.round(ball.y), ball.w, ball.h, "#FFFFFF");
    
    gfx_text(gfx_id, "20px monospace", "#FFFFFF", points[0].toString(), 10, 30);
    gfx_text(gfx_id, "20px monospace", "#FFFFFF", points[1].toString(), size.width - 10 - gfx_measuretext(gfx_id, "20px monospace", points[1].toString()).width, 30);
    
    //control
    var target = mouse.y - (paddles[0].h / 2);
    if(paddles[0].y <= target - MAX_SPEED) {
      paddles[0].sy = MAX_SPEED;
    } else if(paddles[0].y >= target + MAX_SPEED) {
      paddles[0].sy = -MAX_SPEED;
    } else {
      paddles[0].sy = 0;
    }
    
    var target = (ball.y + (ball.h / 2)) - (paddles[1].h / 2);
    if(paddles[1].y <= target - MAX_SPEED) {
      paddles[1].sy = MAX_SPEED;
    } else if(paddles[1].y >= target + MAX_SPEED) {
      paddles[1].sy = -MAX_SPEED;
    } else {
      paddles[1].sy = 0;
    }
    
    //motion
    ball.x += ballSpeed.x;
    ball.y += ballSpeed.y;
    
    for(var i = 0; i < paddles.length; i++) {
      paddles[i].x += paddles[i].sx;
      paddles[i].y += paddles[i].sy;
    }
    
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
        if(paddles[i].vert) {
          ballSpeed.x = BALL_SPEED * paddles[i].orient;
        } else {
          ballSpeed.y = BALL_SPEED * paddles[i].orient;
        }
      }
    }
  }, 1 / 10));
}
