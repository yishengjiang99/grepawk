<html>

<head>
  <title>cmd</title>
  <link href="{{ asset('css/cmd.css') }}" rel="stylesheet">
  <link href="{{ asset('css/modal.css') }}" rel="stylesheet">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">
<style>

</style>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
  <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
  <script src="/js/jquery-ui.js"></script>
  <script>
    iframe_interface=function(msg) {
        if(typeof msg ==='string'){
          ret = $.parseJSON(msg);
        }else{
          ret=msg;
        }
        window.terminal.parse_api_response(ret);
    }
    //adapted from https://codepen.io/anon/pen/gZGpBZ

    var util = util || {};
    util.toArray = function(list) {
      return Array.prototype.slice.call(list || [], 0);
    };
    var FileSystem = FileSystem || function(filesJson, currDir) {

    }
    var Terminal = Terminal || function(cmdLineContainer, outputContainer) {
      window.URL = window.URL || window.webkitURL;
      window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
      input_auto_complete_source = [];
      var cmdLine_ = document.querySelector(cmdLineContainer),
        $cmdLine_ = $(cmdLineContainer);

      $cmdLine_.autocomplete({
        autoFocus: true,
        source: input_auto_complete_source,
        minLength: 1,
        select: function(event, ui) {
          //var _val = ui.item && ui.item.cmd || this.value;
          $cmdLine_.val(ui.item && ui.item.cmd || this.value);
          if (event.keyCode == 7) { //tab
            event.preventDefault();
            $(this).focus();
          }
          if (event.keyCode == 9) { //tab
            event.preventDefault();
            $(this).focus();
          }
          //event.preventDefault();
        }
      }).autocomplete("instance")._renderItem = function(ul, item) {
        return $("<li>")
          .append("<div>" + item.cmd + "<br>" + item.display + "</div>")
          .appendTo(ul);
      };

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
      var username_ = "guest";
      var cd_ = "/public";
      var input_auto_complete_source = ['help'];
      var option_select = [];
      var activePrompt = null;
      var prompt_select = [];
      var more_options_index = -1;
      var full_options_mode = false;
      var prompt_loop_mode = false;
      var prompt_loop_answers = [];
      var prompt_context = "";
      var prompt_string = "";

      // window.addEventListener('click', function(e) {
      //   $(e.target).is("input") || $(e.target).is("input") || cmdLine_.focus();
      // }, false);

      cmdLine_.addEventListener('click', inputTextClick_, false);
      cmdLine_.addEventListener('keydown', historyHandler_, false);
      cmdLine_.addEventListener('keydown', processNewCommand_, false);

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

          //return;
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
          /* input.readOnly = true; */
          output_.appendChild(line);
          var cmd_str = this.value;
          if (prompt_loop_mode) {
            $(".cmdline").last().val("");
            if (cmd_str === '') return;
            if (cmd_str === 'q' || cmd_str === "Q") {
              prompt_loop_complete();
            } else {
              prompt_loop_answers.push(cmd_str);
              output("Added " + cmd_str);
            }
            return;
          }
          _cmd_string(cmd_str);
          $(".cmdline").last().val("");
        }
      }

      function _cmd_string(cmd_str) {
        var args = cmd_str.split(' ').filter(function(val, i) {
          return val;
        });
        if (args.length === 0) {
          return;
        }
        var cmd = args[0].toLowerCase();
        args = args.splice(1); // Remove cmd from arg list.
        switch (cmd) {
          case 'new':
            parent.iframe_interface("new");
            //outputHtml($("#new_file_form").clone().wrap('<div>').parent().html())
            break;
          case 'upload':
            file_type = args[0] || "";
            var formObj = $("#new_file_upload_form").clone();
            formObj.attr("accept", "*." + file_type);
            formObj.attr("action", "/files/upload?type=" + file_type);
            outputHtml(formObj.wrap('<div>').parent().html())
            break;
          default:
            if (cmd) {
              var fullcmd = encodeURIComponent(cmd + " " + args.join());
              $.getJSON("/stdin?msg=" + fullcmd, function(ret) {
                _parse_api_response(ret);
                $('html, body').animate({
                  scrollTop: $(document).height()
                }, 'fast');
                window.scrollTo(0, getDocHeight_());
              });
            }
        }
        $('html, body').animate({
          scrollTop: $(document).height()
        }, 'fast');
        window.scrollTo(0, getDocHeight_());
      }

      function prompt_loop_complete() {
          output("Sending api request for " + prompt_context + " with data: " + JSON.stringify(prompt_loop_answers));
          prompt_loop_mode = false;
          updatePrompt();
          $.getJSON("/stdin?msg=" + prompt_context + "&data=" + JSON.stringify(prompt_loop_answers), function(ret) {
            prompt_loop_answers = [];
            prompt_context = "";
            prompt_string = "";
            _parse_api_response(ret);
          })
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
          colWidth, 'px;', height, '">'
        ];
      }

      function outputPrompts(prompts) {
        $.each(prompts, function(i, prompt) {
          updatePromptWithString("What is the " + prompt + "? >");
        });
      }

      function outputOptions(options) {
          var html="";
          $.each(options, function(i, option) {
            html += "<button type='button' class='cmd_btn btn btn-light col-2 mr-2 mb-2'>"+option.cmd+"</button>";
          })
          outputHtml(html);

          //c$("#hud-options").html(html);
        }
        //
      function outputHtml(html) {
        output_.insertAdjacentHTML('beforeEnd', html);
        $('html, body').animate({
          scrollTop: $(document).height()
        }, 'fast');
        window.scrollTo(0, getDocHeight_());
      }

      function output(html) {
        output_.insertAdjacentHTML('beforeEnd', '<p>' + html + '</p>');
        $('html, body').animate({
          scrollTop: $(document).height()
        }, 'fast');
        window.scrollTo(0, getDocHeight_());
      }

      function outputImageLink(imageUrl) {
        output_.insertAdjacentHTML('beforeEnd', '<p><img width=320 src="' + imageUrl + '"></p>');
      }

      function outputIframe(url) {
        $("#preview_content").html('<iframe width=100% height=100% src="' + url + '"></iframe>').parent().show();
      }

      function open_dl_iframe(url) {
        $("#file_download_1").attr("src", url);
      }

      function outputError(html) {
        output_.insertAdjacentHTML('beforeEnd', '<p style="color:red">' + html + '</p>');
      }

      function outputTable(table) {
        var html = '<table border=1 bordercolor="white">';
        if (table.headers) {
          html += "<thead>";
          html += "<tr>";
          $.each(table.headers, function(i, header) {
            html += "<th>" + header + "</th>";
          });
          html += "</tr></thead>";
        }
        $.each(table.rows, function(index, row) {
          html += "<tr>";
          $.each(table.headers, function(i, header) {
            var val = row[header] || "";
            if (header === 'link') {
              if (val.indexOf("onclick:") === 0) {
                debugger;
                var cmd_str = val.replace("onclick:", "");
                var onclick = "term.processNewCommand(\"" + cmd_str + "\")";
                val = "<a style='color:yellow' href='javascript://' class='onclick_cmd' cmd='" + cmd_str + "'>link</a>";
              } else {
                val = "<a target=_blank href='" + val + "'>link</a>";
              }
            }
            html += "<td>" + val + "</td>";
          });
          html += "</tr>";
        });
        html += "</table>";
        outputHtml("<div style='max-height:400px;overflow-y:scroll'>" + html + "</div>");
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

      function set_cd(cd) {
        cd_ = cd;
        updatePrompt();
      }

      function setUsername(username) {
        username_ = username;
        updatePrompt();
      }

      function updatePrompt() {
        if (prompt_loop_mode && prompt_string) {
          updatePromptWithString(prompt_string);
        } else {
          updatePromptWithString('[' + username_ + ']:' + cd_);
        }
      }

      function updatePromptWithString(string) {
          $(".prompt").last().html(string);
        }
        //parse api ret
      function _parse_api_response(ret) {

        if (ret.output) {
          output(ret.output);
        }
        if (ret.table) {
          outputTable(ret.table);
        }
        if (ret.options) {
          outputOptions(ret.options.rows);
          option_select = ret.options;
          if (ret.options.rows) {
            input_auto_complete_source = ret.options.rows.map(function(elem, i) {
              elem.value = elem.cmd;
              return elem;
            });
          }
          $cmdLine_.autocomplete("option", "source", input_auto_complete_source);
        }
        ret.meta = ret.meta || {};
        if (ret.meta.prompt_loop) {
          prompt_string = ret.meta.prompt_loop;
          prompt_loop_mode = true;
          prompt_loop_answers = [];
          prompt_context = ret.meta.prompt_context;
        }
        if (ret.error) {
          outputError(ret.error);
        }
        if (ret.cd) {
          set_cd(ret.cd);
        }
        if (ret.meta && ret.meta.prompts) {
          outputPrompts(ret.meta.prompts);
        }
        if (ret.meta && ret.meta.download_link) {
          open_dl_iframe(ret.meta.download_link);
        }
        if (ret.meta && ret.meta.image_link) {
          outputImageLink(ret.meta.image_link);
        }
        if (ret.meta && ret.meta.url) {
          window.open(ret.meta.url, '_blank');
        }
      }

      //
      return {
        init: function() {
          output('Welcome to grep|awk 2.0');
        },
        setUsername: function(username) {
          setUsername(username);
        },
        setCd: function(cd) {
          set_cd(cd);
        },
        parse_api_response: function(ret) {
          _parse_api_response(ret);
        },
        output_ext: function(string) {
          output(string)
        },
        processNewCommand: function(cmd) {
          processNewCommand_(cmd);
        },
        cmd_string: function(str) {
          _cmd_string(str);
        }
      }
    };

    $(function() {
      // Initialize a new terminal object  
      var term = new Terminal('#input-line .cmdline', '#container output');
      term.setUsername("{{$username}}@grepawk");
      term.setCd("{{$pwd}}");
      term.init();
      term.cmd_string("help");
      $("body").on('click', '.cmd_btn', function(e) {
        term.cmd_string($(this).find('a').first().attr('cmd'));
      });
      $("body").on('click', '.onclick_cmd', function(e) {
        term.cmd_string($(this).attr('cmd'));
      });
      window.terminal=term;
    });
  </script>
</head>

<body  style='background-color:black;color:white;'>
<div class='position-relative'>
  <div id="container">
    <output></output>
    <div id="input-line" class="input-line">
      <div class="prompt"></div>
      <div>
        <input size=100 class="cmdline" autofocus />
      </div>
    </div>
  </div>
</div>
</body>


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
    <form id='new_file_upload_form' method='POST' enctype="multipart/form-data" action='/files/upload' target="uploadTrg">
      @csrf
      <input type="file" class="form-control" id="file-select-input" name="file">
      <input type="submit" class="form-control" name="submitBtn" value="Upload" />
    </form>
    <form id='upload_csv_form' method='POST' enctype="multipart/form-data" action='/files/upload/csv' target="upload_csv_form">
      @csrf
      <input type="file" class="form-control" id="file-select-input" name="file">
      <input type="submit" class="form-control" name="submitBtn" value="Upload" />
    </form>
  </div>

  <div id='iframes' style='display:none'>
    <iframe id="uploadTrg" name="uploadTrg" height="0" width="0" frameborder="0" scrolling="yes"></iframe>
    <iframe id="file_download_1" name="file_download_1" height="0" width="0" frameborder="0" scrolling="yes"></iframe>
    <iframe id="csv_upload" name="csv_upload" height="0" width="0" frameborder="0" scrolling="yes"></iframe>
  </div>
</body>

</html>