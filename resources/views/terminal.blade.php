<html>
<head>
    <title>cmd</title>
     <link href="{{ asset('css/cmd.css') }}" rel="stylesheet">

    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>

<script>

//adapted from https://codepen.io/anon/pen/gZGpBZ

var util = util || {};
util.toArray = function(list) {
  return Array.prototype.slice.call(list || [], 0);
};
var FileSystem = FileSystem || function(filesJson, currDir){
   
}
var Terminal = Terminal || function(cmdLineContainer, outputContainer) {
  window.URL = window.URL || window.webkitURL;
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

  var cmdLine_ = document.querySelector(cmdLineContainer);
  var output_ = document.querySelector(outputContainer);

  const CMDS_ = [
    'ls', 'cat', 'search', 'shout', 'say'
  ];
  
  var fs_ = null;
  var cwd_ = null;
  var fileSystem_ = null;

  var history_ = [];
  var histpos_ = 0;
  var histtemp_ = 0;
  var username_="guest";
  var cd_ = "/public";
  
  window.addEventListener('click', function(e) {
   // cmdLine_.focus();
  }, false);

  cmdLine_.addEventListener('click', inputTextClick_, false);
  cmdLine_.addEventListener('keydown', historyHandler_, false);
  cmdLine_.addEventListener('keydown', processNewCommand_, false);

  //
  function inputTextClick_(e) {
    this.value = this.value;
  }

  //
  function historyHandler_(e) {
    if (history_.length) {
      if (e.keyCode == 38 || e.keyCode == 40) {
        if (history_[histpos_]) {
          history_[histpos_] = this.value;
        } else {
          histtemp_ = this.value;
        }
      }

      if (e.keyCode == 38) { // up
        histpos_--;
        if (histpos_ < 0) {
          histpos_ = 0;
        }
      } else if (e.keyCode == 40) { // down
        histpos_++;
        if (histpos_ > history_.length) {
          histpos_ = history_.length;
        }
      }

      if (e.keyCode == 38 || e.keyCode == 40) {
        this.value = history_[histpos_] ? history_[histpos_] : histtemp_;
        this.value = this.value; // Sets cursor to end of input.
      }
    }
  }

  //
  function processNewCommand_(e) {
    if (e.keyCode == 9) { // tab
      e.preventDefault();
      // Implement tab suggest.
    } else if (e.keyCode == 13) { // enter
      // Save shell history.
      if (this.value) {
        history_[history_.length] = this.value;
        histpos_ = history_.length;
      }

      // Duplicate current input and append to output section.
      var line = this.parentNode.parentNode.cloneNode(true);
      line.removeAttribute('id')
      line.classList.add('line');
      var input = line.querySelector('input.cmdline');
      input.autofocus = false;
      input.readOnly = true;
      output_.appendChild(line);

      if (this.value && this.value.trim()) {
        var args = this.value.split(' ').filter(function(val, i) {
          return val;
        });
        var cmd = args[0].toLowerCase();
        args = args.splice(1); // Remove cmd from arg list.
      }
      
      switch (cmd) {
        case 'new':
           input.autofocus = false;
           outputHtl(
              "<form method='POST'style='background-color:grey;color:white' action='/photos/create'>"
              + "<textarea style='background-color:transparent' class='cmd' rows=30 cols=60 name='filename' placeholder='filec oontent'></textarea>"
              + "<br><input style='background-color:transparent' class='cmd' type=text name='filename' placeholder='filename'>"
              + "<br><input type=submit>"
              +"</form>");
        default:
          input.autofocus = false;

          if (cmd) {
            $.getJSON("/stdin?msg="+this.value,function(ret){
              if(ret.output){
                output(ret.output);
              }
              if(ret.error){
                outputError(ret.error);
              }
              if(ret.cd){
                set_cd(ret.cd);
              }
            });
          }
      };

      window.scrollTo(0, getDocHeight_());
      this.value = ''; // Clear/setup line for next input.
    }
  }

  //
  function formatColumns_(entries) {
    var maxName = entries[0].name;
    util.toArray(entries).forEach(function(entry, i) {
      if (entry.name.length > maxName.length) {
        maxName = entry.name;
      }
    });

    var height = entries.length <= 3 ?
        'height: ' + (entries.length * 15) + 'px;' : '';

    // 12px monospace font yields ~7px screen width.
    var colWidth = maxName.length * 7;

    return ['<div class="ls-files" style="-webkit-column-width:',
            colWidth, 'px;', height, '">'];
  }

  //
  function outputHtl(html) {
    output_.insertAdjacentHTML('beforeEnd', html);
  }
  function output(html) {
    output_.insertAdjacentHTML('beforeEnd', '<p>' + html + '</p>');
  }
  function outputError(html) {
    output_.insertAdjacentHTML('beforeEnd', '<p style="color:red">' + html + '</p>');
  }

  // Cross-browser impl to get document's height.
  function getDocHeight_() {
    var d = document;
    return Math.max(
        Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
        Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
        Math.max(d.body.clientHeight, d.documentElement.clientHeight)
    );
  }

  function set_cd(cd){
      cd_=cd;
      updatePrompt();
  }
  function setUsername(username){
    username_=username;
      updatePrompt();
  }
  function updatePrompt(){
    $(".prompt").html('['+username_+']:'+cd_);
  }

  //
  return {
    init: function() {
      output('Welcome to grep|awk 2.0');
    },
    setUsername:function(username){
      setUsername(username);
    },
    setCd:function(cd){
      set_cd(cd);
    },
  }
};


$(function() {

  // Initialize a new terminal object  
    var term = new Terminal('#input-line .cmdline', '#container output');
    term.init();
    term.setUsername("{{$username}}@grepawk");
    term.setCd("{{$cd}}");

   // term.updatePrompt();
});
</script>
</head>
<body style='background-color:black;color:white'>
    <div id="container">
        <output></output>
        <div id="input-line" class="input-line">
            <div class="prompt"></div><div><input class="cmdline"  /></div>
        </div>
    </div>
</body>
</html>
