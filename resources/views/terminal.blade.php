<html>
<head>
    <title>cmd</title>
     <link href="{{ asset('css/cmd.css') }}" rel="stylesheet">
     <link href="{{ asset('css/modal.css') }}" rel="stylesheet">
     <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">

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
  var option_select=[];
  var activePrompt=null;
  var prompt_select=[];
  var more_options_index=-1;
  var full_options_mode=false;
  
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
      input.autofocus = true;
      input.readOnly = true;
      output_.appendChild(line);
      var args = this.value.split(' ').filter(function(val, i) {
          return val;
        });
      var cmd = args[0].toLowerCase();
      args = args.splice(1); // Remove cmd from arg list.

      var option_index=parseInt(cmd);

      if(option_index){
        if(false && more_options_index !=-1 && option_index==more_options_index){
          // full_options_mode=true;
          // outputOptions(); // todo: ????
          // window.scrollTo(0,document.body.scrollHeight+100);// todo: ???
          // return;
        }
        if(typeof option_select[option_index-1] !== 'undefined') {
          cmd = option_select[option_index-1];
        }
      } 
      $(".cmdline").last().val("");

      //$(".cmdline").removeAttr("value");
      switch (cmd) {
        case 'new':
          outputHtml($("#new_file_form").clone().wrap('<div>').parent().html())
          break;
        case 'upload':
          outputHtml($("#new_file_upload_form").clone().wrap('<div>').parent().html())
          break;
        default:
          if (cmd) {
            $.getJSON("/stdin?msg="+cmd, function(ret){
              _parse_api_response(ret);

              $('html, body').animate({scrollTop:$(document).height()}, 'fast');
              window.scrollTo(0,getDocHeight_());


            });
          }
      };

      $('html, body').animate({scrollTop:$(document).height()}, 'fast');
              window.scrollTo(0,getDocHeight_());
                
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
  function outputPrompts(prompts){
    $.each(prompts,function(i,prompt){
      updatePromptWithString("What is the "+prompt+"? >");
    });
  }
  function outputOptions(){
    options=option_select;
    output_.insertAdjacentHTML('beforeEnd',"<p>Numerical Options");
    output_.insertAdjacentHTML('beforeEnd',"<ol>");
    $.each(options,function(i,cmd){
      if(full_options_mode===false && i>50){
        more_options_index=(i+1);
        output_.insertAdjacentHTML('beforeEnd', "<li>" + (i+1) +'): more option </li>');
        return false;
      }else{
        output_.insertAdjacentHTML('beforeEnd', "<li>" + (i+1) +'): '+cmd + '</li>');
      }
    });
    output_.insertAdjacentHTML('beforeEnd',"</ol>");
    output_.insertAdjacentHTML('beforeEnd',"</p>");
    full_options_mode=false;

  }
  //
  function outputHtml(html) {
    output_.insertAdjacentHTML('beforeEnd', html);
  }
  function output(html) {
    output_.insertAdjacentHTML('beforeEnd', '<p>' + html + '</p>');
  }
  function outputIframe(url){
     $("#preview_content").html('<iframe width=100% height=100% src="'+url+'"></iframe>').parent().show();
  }
  function open_dl_iframe(url){
     $("#file_download_1").attr("src",url);
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
    updatePromptWithString('['+username_+']:'+cd_);
  }
  function updatePromptWithString(string){
    $(".prompt").last().html(string);
  }
  function _parse_api_response(ret){
      if(ret.output){
        output(ret.output);
      }
      if(ret.options){
          option_select=ret.options;
          outputOptions();
      }
      if(ret.error){
        outputError(ret.error);
      }
      if(ret.cd){
        set_cd(ret.cd);
      }
      if(ret.meta && ret.meta.prompts){
        outputPrompts(ret.meta.prompts);
      }
      if(ret.meta && ret.meta.url){
        outputIframe(ret.meta.url);
      }
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
    parse_api_response:function(ret){
      _parse_api_response(ret);
    },
    output_ext:function(string){
      output(string)
    },
    processNewCommand:function(cmd){
	    processNewCommand_(cmd);
    }
  }
};


$(function() {
  // Initialize a new terminal object  
    var term = new Terminal('#input-line .cmdline', '#container output');
    term.setUsername("{{$username}}@grepawk");
    term.setCd("{{$cd}}");

    term.init();
    term.processNewCommand("ls");
    var g_previewModal = document.getElementById('previewModal');
    $("body").on('click', "#new-file-submit",function(e){
      e.preventDefault();
      var _form =$(this).closest('form');
      var entries=_form.serialize();
      $.post("/files/new",entries,function(ret){
        term.output_ext("File Uploaded");
        term.parse_api_response(ret)
        _form.remove();
      });
    })
    window.terminal=term;
   // term.updatePrompt();
});
function iframe_interface(msg){
  ret=$.parseJSON(msg);
  window.terminal.parse_api_response(ret);
  if(ret.output=='upload completed'){
    $("#new_file_upload_form").remove();
  }
}

</script>
</head>
<body style='background-color:black;color:white'>
    <div id="container" class='container'>
        <output></output>
        <div id="input-line" class="input-line">
            <div class="prompt"></div><div><input size=100 class="cmdline" autofocus /></div>
        </div>
    </div>
  <div id="previewModal" class="modal">
    <span class="close">&times;</span>
    <div id='preview_content'></div>
    <div id="caption"></div>
  </div>

  <div id='forms-section' style='display:none'>
    <form id='new_file_form'>
      @csrf
      <div class="form-group">
        <label for="file-name-input">File Name</label>
        <input type="text" name='filename' class="form-control" id="file-name-input" placeholder="File Name">
      </div>
      <div class="form-group">
        <label for="file-content-input">File Content</label>
        <TextArea type="text" name='filecontent' class="form-control" id="file-content-input" placeholder="Another input"></TextArea>
      </div>
      <div class="form-group">
        <div class="offset-sm-2 col-sm-10">
          <button id='new-file-submit' class="btn btn-primary">Create</button>
        </div>
      </div>
    </form>
    <form id='new_file_upload_form' method='POST' 
          enctype="multipart/form-data" 
          action='/files/upload' 
          target="uploadTrg">
        @csrf
        <input type="file" class="form-control" id="file-select-input" name="file">
        <input type="submit" name="submitBtn" value="Upload" />
    </form>
  </div>

  <div id='iframes' style='display:none'>
    <iframe id="uploadTrg" name="uploadTrg" height="0" width="0" frameborder="0" scrolling="yes"></iframe>
    <iframe id="file_download_1" name="file_download_1" height="0" width="0" frameborder="0" scrolling="yes"></iframe>
  </div>
</body>

</html>
