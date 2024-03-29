var Terminal =
  Terminal ||
  function (cmdLineContainer, outputContainer) {
    window.URL = window.URL || window.webkitURL;
    window.requestFileSystem =
      window.requestFileSystem || window.webkitRequestFileSystem;
    var interpreters = [];
    input_auto_complete_source = [];
    var cmdLine_ = document.querySelector(cmdLineContainer),
      $cmdLine_ = $(cmdLineContainer);
    var output_ = document.querySelector(outputContainer);

    var history_ = [];
    var histpos_ = 0;
    var histtemp_ = 0;
    var input_auto_complete_source = [];
    var socket = null;
    var user = User();
    var userInfo;
    var uuid = user.get_uuid();
    var in_proc_mode = false;

    cmdLine_.addEventListener("click", inputTextClick_, false);
    cmdLine_.focus();
    cmdLine_.addEventListener("keydown", historyHandler_, false);
    cmdLine_.addEventListener("keydown", processNewCommand_, false);

    function inputTextClick_(e) {
      this.value = this.value;
    }

    //
    var tab_scan_index = 0;
    var possible_matched_words = [];
    var tab_complete_last_word = "";

    function historyHandler_(e) {
      if (history_.length) {
        if (e.keyCode == 38 || e.keyCode == 40) {
          if (history_[histpos_]) {
            history_[histpos_] = this.value;
          } else {
            histtemp_ = this.value;
          }
        }
        if (e.keyCode == 38) {
          // up
          histpos_--;
          if (histpos_ < 0) {
            histpos_ = 0;
          }
        } else if (e.keyCode == 40) {
          // down
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
    async function processNewCommand_(e) {
      await connectSocketIfNotOpen();
      if (e.keyCode == 37) {
        socket.send("esc");
      }
      if (e.keyCode == 67 && (e.metaKey || e.ctrKey)) {
        socket.send("esc");
      }
      if (e.keyCode == 32) {
        //space
        tab_scan_index = 0;
        possible_matched_words = [];
      } else if (e.keyCode == 9) {
        // tab
        e.preventDefault();
        var word_parts = this.value.split(" ");
        if (this.value[this.value.length - 1] === " ") {
          //starting new words
          word_parts.push("");
        }

        if (word_parts.length == 0) return;

        var tab_complete_source;
        if (word_parts.length == 1) {
          tab_complete_source = CMDS_;
        } else {
          tab_complete_source = input_auto_complete_source;
        }

        var current_word = word_parts[word_parts.length - 1];
        var matched_words = [];
        var matched_length = [];
        var max_distance = current_word.length;
        var closest_substring = current_word;

        if (
          tab_scan_index > 0 &&
          possible_matched_words.length &&
          tab_complete_last_word == current_word
        ) {
          matched_words = possible_matched_words;
        } else {
          tab_complete_source.forEach(function (word, i) {
            console.log(word + " vs " + current_word);
            if (word.startsWith(current_word)) {
              matched_words.push(word);
            }
          });
        }

        if (matched_words.length == 0) {
          //outputError("No matched file/folder name");
          tab_scan_index = 0;
        } else if (matched_words.length == 1) {
          //("replacing "+ word_parts[word_parts.length-1]+" with "+matched_words[0]);
          word_parts[word_parts.length - 1] = matched_words[0];
          var newstr = word_parts.join(" ");
          this.value = newstr + " ";
          tab_scan_index = 0;
        } else {
          var output_str = "";
          matched_words.forEach(function (word, i) {
            if (i === tab_scan_index) {
              output_str += "<b>" + word + "</b>&emsp;";
            } else {
              output_str += word + "&emsp;";
            }
          });
          output(output_str);

          var suggested_str = matched_words[tab_scan_index++];
          word_parts[word_parts.length - 1] = suggested_str;
          possible_matched_words = matched_words;
          tab_complete_last_word = this.value;

          this.value = word_parts.join(" ");
          if ($(this).parent().find(".ending").length > 0) {
            $(this).parent().find(".ending")[0].html(suggested_str);
          } else {
            $(this)
              .parent()
              .append(
                '<span class="ending" style="color: gray" >' +
                  suggested_str +
                  "</span>"
              );
          }
          $("#ending").last().html(suggested_str);
        }
        return;
      } else if (e.keyCode == 13) {
        // enter
        if (this.value[this.value.length - 1] === "\\") {
          $(this).parent().append("<textarea id=newline_tf></textarea>");
          $("#newline_tf").focus();
          return;
        }
        // Save shell history.
        if (this.value) {
          history_[history_.length] = this.value;
          histpos_ = history_.length;
        }
        $("#ending").html("");
        // Duplicate current input and append to output section.
        var line = this.parentNode.parentNode.cloneNode(true);
        line.removeAttribute("id");
        line.classList.add("line");

        var input = line.querySelector("input.cmdline");
        input.autofocus = false;
        input.readOnly = true;
        output_.appendChild(line);
        var cmd_str = this.value;

        for (var k = 0; k < interpreters.length; k++) {
          var interp = await interpreters[k].interpret(cmd_str);
          if (interp && interp !== false) {
            interp
              .then((res) => {
                output(res);
                $(".cmdline").last().val("");
              })
              .catch((err) => {
                outputError(res);
                $(".cmdline").last().val("");
              });
            return;
          }
        }
        _cmd_string(cmd_str);
        $(".cmdline").last().val("");
      }
    }

    function _cmd_string(cmd_str) {
      var args = cmd_str.split(" ").filter(function (val, i) {
        return val;
      });
      if (args.length === 0) {
        return;
      }
      var cmd = args[0].toLowerCase();
      args = args.splice(1); // Remove cmd from arg list.
      var argsstr = args.join(" ");

      switch (cmd) {
        case "watch":
          if (args.length < 1) {
            outputError("Usage: watch {youtube video ID}");
          }
          var iframeHTML =
            '<iframe width=90% height="315" src="https://www.youtube.com/embed/' +
            args[0] +
            '?rel=0" frameborder="0" allowfullscreen></iframe>';
          outputHtml(iframeHTML);
          break;
        case "audio":
          window.open("/video/dl_audio?id=" + args[0], "_blank");
          break;
        case "edit":
          parent.stdin("edit " + args[0] + " " + args[1]);
          break;
        case "cam":
          parent.stdin("show_cam");
          break;
        case "camoff":
          client.leave();
          break;
        case "host":
          break;
        case "chart":
        case "pie":
        case "scatter":
          _parse_api_response({
            chart: {
              type: cmd,
              argstr: argsstr,
            },
          });
          break;
        case "download":
          open_dl_iframe(
            nodeurl + "/download/?msg=" + argsstr + "&format=" + cmd
          );
          break;
        case "pay":
          debugger;
          user.deposit(args);
          break;
        case "new":
          let filename = args[0] || "";
          parent.stdin("new " + filename + " " + userInfo.cwd);
          break;
        case "upload":
          file_type = args[0] || "";
          var formObj = $("#new_file_upload_form").clone();
          var form_uuid = "uploader-" + user.gen_uuid();
          if (file_type) formObj.attr("accept", "*." + file_type);
          formObj.attr("action", node_url + "/files/upload?type=" + file_type);
          formObj.attr("method", "POST");
          formObj.append(
            `<input type='hidden' name='uuid' value='${localStorage.uuid}' />`
          );
          outputHtml(formObj.wrap("<div>").parent().html());
          var file;
          document.getElementById("file-select-input").addEventListener(
            "change",
            function (e) {
              if (!e.target.files[0]) return;
              file = e.target.files[0];
              if (file.type.includes("csv")) {
                Papa.parse(file, {
                  header: false,
                  dynamicTyping: true,
                  preview: 10,
                  complete: function (result) {
                    socket.send(
                      "create_table " + JSON.stringify(result.meta.fields)
                    );
                    displayHTMLTable(result);
                    result.data.forEach((row) => {
                      socket.send("table_data " + JSON.stringify(row));
                    });
                  },
                });
              }
            },
            false
          );

          break;
        default:
          socket.send(cmd + " " + argsstr);
          break;
      }
      $("html, body").animate(
        {
          scrollTop: getDocHeight_() + 100,
        },
        "fast"
      );

      // window.scrollTo(0, getDocHeight_());
    }

    function displayHTMLTable(results) {
      var table = "<table border=1 bordercolor='white'>";
      var data = results.data;

      for (i = 0; i < data.length; i++) {
        table += "<tr>";
        var row = data[i];
        var cells = row.join(",").split(",");

        for (j = 0; j < cells.length; j++) {
          table += "<td>";
          table += cells[j];
          table += "</th>";
        }
        table += "</tr>";
      }
      table += "</table>";
      outputHtml(table);
    }

    function outputOptions(options) {
      var html = "";
      $.each(options, function (i, option) {
        var onclick_cmd =
          "<a href='#' cmd='" +
          option.cmd +
          "' class='onclick_cmd'>" +
          option.cmd +
          "</a>";
        html +=
          "<p><button type='button' class='cmd_btn col-6 btn-light mr-2'>" +
          onclick_cmd +
          "</button></p>";
      });
    }
    //
    function outputHtml(html) {
      output_.insertAdjacentHTML("beforeEnd", html);
      window.scrollTo(0, getDocHeight_());
      $(cmdLine_).focus();
    }

    function outputAppend(data) {
      $(output_).find("p").last().append(data);
    }

    function output(html) {
      output_.insertAdjacentHTML("beforeEnd", "<p>" + html + "</p>");
      window.scrollTo(0, getDocHeight_());
      $(cmdLine_).focus();
    }

    function outputDiv(div) {
      output_.append(div);
    }

    function outputImageLink(imageUrl) {
      output_.insertAdjacentHTML(
        "beforeEnd",
        '<p><a target=_blank href="' +
          imageUrl +
          '"><img src="' +
          imageUrl +
          '"></a></p>'
      );
    }

    function outputIframe(url) {
      $("#preview_content")
        .html(
          "<iframe width=90% onload='resizeIframe(this)' src=\"" +
            url +
            '"></iframe>'
        )
        .parent()
        .show();
    }

    function open_dl_iframe(url) {
      $("#file_download_1").attr("src", url);
    }

    function outputError(html) {
      output_.insertAdjacentHTML(
        "beforeEnd",
        '<p style="color:red">' + html + "</p>"
      );
    }

    function outputTable(table) {
      var html = '<table border=1 bordercolor="white">';
      if (table.headers) {
        html += "<thead>";
        html += "<tr>";
        $.each(table.headers, function (i, header) {
          html += "<th>" + header + "</th>";
        });
        html += "</tr></thead>";
      }
      $.each(table.rows, function (index, row) {
        html += "<tr>";
        $.each(table.headers, function (i, header) {
          var val = row[header] || "";
          var td_val = "";
          if (header == "opts") {
            val.forEach((opt, i) => {
              var cmd_str = opt.cmd;
              td_val += `<li><a style='color:yellow' href='#' class='onclick_cmd' cmd='${opt.cmd}'>${opt.desc}</a>`;
            });
            html += "<td>" + td_val + "</td>";
          } else if (header === "thumbnail") {
            var img_url = val;
            html += "<td><img width=120 src='" + img_url + "'></td>";
          } else {
            html += "<td>" + val + "</td>";
          }
        });
        html += "</tr>";
      });
      html += "</table>";
      outputHtml(
        "<div style='max-height:400px;overflow-y:scroll'>" + html + "</div>"
      );
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

    function setUsername(username) {
      username_ = username;
      updatePrompt();
    }

    function updatePrompt() {
      if (in_proc_mode) {
        updatePromptWithString("> ");
      } else if (userInfo) {
        var p = userInfo.cwd + "$";
        updatePromptWithString(p);
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
      if (ret.hints) {
        Array.prototype.clone = function () {
          return this.slice(0);
        };
        input_auto_complete_source = ret.hints.clone();
      }

      if (ret.options && ret.options.rows) {
        outputOptions(ret.options.rows);
        option_select = ret.options;
      }
      if (ret.chart) {
        var type = ret.chart.type;
        var data;
        if (ret.chart.opts) {
          data = {
            opts: ret.chart.opts,
          };
        } else if (ret.chart.data) {
          data = ret.chart.data;
        } else if (ret.chart.argstr) {
          var t = ret.chart.argstr.split("|");
          data = t.map((d) => {
            d.trim();
            return d.split(" ").map((dd) => {
              if (!isNaN(dd)) {
                dd = parseInt(dd);
              }
              return dd;
            });
          });

          console.log(data);
        }

        var divId = "chart-" + user.gen_uuid();
        var chart = Chart(divId);
        var div = $("#graph-template").clone();
        div.find(".c3").attr("id", divId);
        $(output_).append(div);

        chart.chart_line(ret.chart.type, data);
        return;
      }

      ret.meta = ret.meta || {};
      if (ret.error) {
        outputError(ret.error);
      }
      if (ret.meta && ret.meta.download_link) {
        open_dl_iframe(ret.meta.download_link);
      }
      if (ret.img) {
        outputImageLink(ret.img);
      }
      if (ret.meta && ret.meta.url) {
        window.open(ret.meta.url, "_blank");
      }
      if (ret.username) {
        setUsername(ret.username);
      }
      if (ret.updatePrompt) {
        updatePromptWithString(ret.updatePrompt);
      }
      if (ret.cwd) {
        cwd_ = ret.cwd;
      }
      if (ret.link) {
        var url = ret.link.url;
        const text = ret.link.text || "link";
        var val_html = "";
        if (url.indexOf("onclick:") === 0) {
          var cmd_str = url.replace("onclick:", "");
          var onclick = 'term.processNewCommand("' + cmd_str + '")';
          val_html +=
            "<a style='color:yellow' href='javascript://' class='onclick_cmd' cmd='" +
            cmd_str +
            "'>" +
            text +
            "</a>";
        } else {
          val_html += "<a target=_blank href='" + url + "'>" + text + "</a>";
        }
        outputHtml(val_html);
      }
      if (ret.userInfo) {
        userInfo = ret.userInfo;
        localStorage.setItem("uuid", userInfo.uuid);
        updatePrompt();
      }
    }

    function connectSocketIfNotOpen() {
      return new Promise((resolve, reject) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }
        if (socket && socket.readyState === WebSocket.CONNECTING) {
          output("Connecting..");
          resolve();
          return;
        }
        const node_ws_url = `${
          window.location.protocol.includes("https") ? "wss" : "ws"
        }://${window.location.host}`;
        socket = new WebSocket(node_ws_url);
        socket.onopen = (e) => {
          socket.send("check-in " + uuid);
          resolve();
        };
        setTimeout(() => {
          reject(new Error("connection timed outt"));
        }, 5000);
      });
    }
    return {
      init: async function () {
        try {
          await connectSocketIfNotOpen();
        } catch (e) {
          outputError(e.message);
          return;
        }
        socket.onmessage = function (event) {
          try {
            if (typeof event.data === "object") {
              var image = new Image();
              image.src = URL.createObjectURL(event.data);
              outputDiv(image);
            } else if (event.data && event.data.startsWith("stdout: ")) {
              var stdout = event.data.replace("stdout: ", "");
              output("<pre>" + stdout + "</pre>");
            } else if (event.data.startsWith("stderr: ")) {
              var stderr = event.data.replace("stderr: ", "");
              outputError(stderr);
            } else if (event.data == "set-spawn-mode-on") {
              in_proc_mode = true;
              updatePrompt();
            } else if (event.data == "set-spawn-mode-off") {
              in_proc_mode = false;
              updatePrompt();
            } else if (event.data == "checkedin") {
              //
            } else {
              _parse_api_response(JSON.parse(event.data));
            }
          } catch (e) {
            console.log("parsing res", e, event);
          }
        };
      },
      setUsername: function (username) {
        setUsername(username);
      },
      set_socket: function (socket) {
        socket = socket;
      },
      parse_api_response: function (ret) {
        _parse_api_response(ret);
      },
      output_ext: function (string) {
        outputHtml(string);
      },
      processNewCommand: function (cmd) {
        processNewCommand_(cmd);
      },
      cmd_string: function (str) {
        output(str);
        _cmd_string(str);
      },
    };
  };
