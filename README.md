# os
An experimental operating system environment written in JavaScript

### Filesystem
The filesystem interface is provided by fs-core.js. It currently has three backends:
* fs-tmpfs.js - a temporary filesystem. This is the only one with write support and is used for the root fs.
* fs-httpfs.js - mounts a directory on a web server (but with some caveats). The demo uses this to mount the httpfs folder at /web.
* fs-procfs.js - similar data structure to tmpfs, but is read-only and uses functions to get data. Used for /proc/mounts.
All of these are accessed through fs-core.js and file descriptors (in syscall.js).

### Terminals
The system has a built-in terminal (terminal.js) displayed on the left side of the screen. It connects via stdin/stdout/stderr pipes to a program, usually for a shell.
The graphics demo automatically starts another terminal (httpfs/term.js), which does the same thing.

### Shell
The default shell (httpfs/shell.js) connects to a terminal via syscall.js pipes. Due to some nuances related to JavaScript being event-driven and non-blocking, you currently cannot run a shell inside a shell.

### Graphics!
The "kernel" module gfx.js provides a wrapper around the HTML canvas interface, along with some management capabilities.
The demo automatically loads the window manager (httpfs/libwm.js + httpfs/wm.js) to run on top of this. The window manager selectively passes through keyboard and mouse events to client programs (via gfx.js).

### Demo programs
* /web/gfx_test.js - simple test of gfx.js and the window manager
* /web/pong.js - basic pong game
* /web/pong2.js - pong.js but with four paddles
* /web/term.js - graphical terminal
* /web/textedit.js - basic text editor (not yet complete)
