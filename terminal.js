//TODO: cursor
var terminal_tabindex_next = 0;

function terminal_init() {
  var terms = document.getElementsByClassName("terminal");
  for(var i = 0; i < terms.length; i++) {
    var term = terms[i];
    //TODO: bind auto resize here
    term.style.width = window.innerWidth.toString() + "px";  
    term.style.height = window.innerHeight.toString() + "px";  
  }
}

function terminal_attach(term, stdin, stdout, stderr) {
  //writing to terminal
  syscall_pipe_bind_read(stdout, function(data) {
    //TODO: scrolling-friendly modifications
    if(data == "\r") { //FIXME - multi-char strings
      var idx = term.innerText.lastIndexOf("\n");
      if(idx != -1) {
        term.innerText = term.innerText.substring(0, idx + 1);
      } else {
        term.innerText = "";
      }
    } else {
      term.innerText += data;
    }
  });
  syscall_pipe_bind_read(stderr, function(data) {
    //TODO - \r
    term.innerText += data;
  });
  
  term.tabIndex = terminal_tabindex_next;
  terminal_tabindex_next++;
  term.addEventListener("keypress", function(e) {
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
    //TODO: delete, home, end, etc.
    //TODO: u/d/l/r arrows
  });
  term.focus();
}

document.addEventListener("DOMContentLoaded", terminal_init);
