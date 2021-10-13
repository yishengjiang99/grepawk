import React from "react";
import Window from "./components/Window";
import "./Terminal.css";
import Table from "./components/Table";
import GFileSelector from "./FileExplorer/GFileSelector";
import BroadcastClient from "./Broadcast/BroadcastClient";
import Composer from "./FileExplorer/Composer";
var socket = null;
const node_ws_url = `${
  window.location.protocol.includes("https") ? "wss" : "ws"
}://${window.location.hostname}:${process.env.PORT || 3000}`;
const redStyle = { color: "red" };

class Terminal extends React.Component {
  constructor(props) {
    super(props);
    this.prompt = React.createRef();
    this.promptInput = React.createRef();
    this.broadclient = BroadcastClient({
      onEvent: this.onBroadcastEvent,
      console: "stdin2",
    });
    this.state = {
      socket,
      output_rows: [],
      output_cursor_position: 0,
      uuid: getUUID(),
      canvasStream: null,
      canvasStream2: null,
      foregroundPid: null,
      composerPhase: "root",
    };
  }

  initSocket = () => {
    return new Promise((resolve, reject) => {
      this.onAddOutputRow({ type: "text", data: "Initializing connection" });

      if (socket && socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      if (socket && socket.readyState === WebSocket.CONNECTING) {
        this.onAddOutputRow({ type: "text", data: "Connecting.." });
        resolve();
        return;
      }
      socket = new WebSocket(node_ws_url);
      socket.onopen = (e) => {
        clearTimeout(timeoutId);
        this.onAddOutputRow({ type: "text", data: "CONNECTED" });

        socket.send("check-in " + this.state.uuid);
        resolve();
      };
      socket.onmessage = (event) => {
        if (typeof event.data === "object") {
          var image = new Image();
          image.src = URL.createObjectURL(event.data);
          this.onAddOutputRow({ type: "image", data: image });
        } else if (event.data && event.data.startsWith("stdout: ")) {
          var stdout = event.data.replace("stdout: ", "");
          this.onAddOutputRow({ type: "text", data: stdout });
        } else if (event.data && event.data.startsWith("stderr: ")) {
          var stdout = event.data.replace("stderr: ", "");
          this.onAddOutputRow({ type: "text", data: stdout });
        } else {
          this.parseAPIResponse(JSON.parse(event.data));
        }
      };
      var timeoutId = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          this.onAddOutputRow({ type: "stderr", data: "Connection timed out" });

          // reject(new Error("connection timed outt"));
        }
      }, 5000);
    });
  };
  onAddOutputRow = (row) => {
    const list = this.state.output_rows.concat(row);
    this.setState({ output_rows: list });
  };
  parseAPIResponse = (data) => {
    if (data.stdout) {
      this.onAddOutputRow({ type: "text", data: data.stdout });
    }
    if (data.stderr) {
      this.onAddOutputRow({ type: "text", data: data.stderr });
    }
    if (data.table) {
      this.onAddOutputRow({ type: "table", data: data.table });
    }
    if (data.userInfo) {
      // this.onAddOutputRow({type:"text",data: JSON.stringify(data)})
      localStorage.setItem("uuid", data.userInfo.uuid);
      this.props.ipc("hud-update", data.userInfo);
    }
    if (data.quests) {
      this.props.ipc("questlist", data.quests);
    }
    if (data.hint) {
      //todo
    }
  };

  async componentDidMount() {
    await this.initSocket();
  }

  onBroadcastEvent = (evt) => {
    alert(evt);
  };
  composeCmd = (cmd, args) => {};

  renderOutputRow = (row, i) => {
    switch (row.type) {
      case "compose":
        return (
          <Composer
            title="Compose Tracks"
            phase={this.state.composerPhase}
            ipc={this.composeCmd}
          ></Composer>
        );
      case "stdout":
      case "text":
        return <pre key={"op-" + i}>{row.data}</pre>;
      case "stderr":
        return (
          <pre key={"op-" + i}>
            <span style={redStyle}>{row.data}</span>
          </pre>
        );
      case "stdin":
        return (
          <div className="input-line" key={"op-" + i}>
            <div className="prompt">{this.state.foregroundPid}></div>
            <input className="cmdline input-line" disabled value={row.cmd} />
          </div>
        );
      case "table":
        return (
          <div key={"op-" + i}>
            <Table
              clickedCmd={this.stdin}
              // className="table table-dark"
              headers={row.data.headers}
              rows={row.data.rows}
            ></Table>
          </div>
        );
      case "imageLink":
        return (
          <div key={"op-" + i}>
            <img src={row.data}></img>
          </div>
        );
      case "filelink":
        return (
          <div key={"op-" + i}>
            <iframe src={row.data}></iframe>
          </div>
        );
      case "upload":
        return <GFileSelector></GFileSelector>;
        break;
      default:
        break;
    }
  };
  keyboardLoaded = (e) => {
    e.target.focus();
  };
  windowLoaded = (e) => {
    document.getElementsByClassName("terminal-body").scrollTo(0, 100);
    e.target.offsetHeight = 1000;
  };

  locallyProcessed = (cmd_str) => {
    if (!cmd_str) return false;

    var t = cmd_str.split(" ");
    const cmd = t[0];
    const args = t.splice(1);
    if (this.state.foregroundPid === "compose") {
      this.setState({
        composerState: cmd,
      });
      return true;
    }
    switch (cmd) {
      case "compose":
        this.setState({ foregroundPid: "compose" });
        break;
      case "upload":
      case "openimage":
        this.onAddOutputRow({ type: cmd, data: args[0] });
        return true;
      case "edit":
        this.props.ipc(cmd, args);
        return true;
      case "cam":
      case "new":
      case "stream":
      case "broadcast":
      case "draw":
      case "watch":
        this.props.ipc(cmd, args);
        return true;
      default:
        return false;
    }
  };
  stdin = (cmd) => {
    this.onAddOutputRow({ type: "stdin", cmd });
    if (!this.locallyProcessed(cmd)) {
      if (socket.readyState !== WebSocket.OPEN) {
        this.onAddOutputRow({ type: "stderr", data: "Not connected" });
      } else {
        socket.send(cmd);
      }
    }
  };

  keyboardPressed = (e) => {
    if (e.keyCode == 13) {
      //enter
      this.stdin(e.target.value);
      e.target.value = "";
    }
  };

  renderInputBar = () => {
    const stdinPromptString = this.state.foregroundPid || "";
    return (
      <div className="input-line">
        <div id="stdin-prompt" className="prompt">
          {" "}
          {stdinPromptString}>{" "}
        </div>
        <input
          autoFocus={true}
          onLoad={this.keyboardLoaded}
          onKeyDown={this.keyboardPressed}
          size="80"
          id="terminal_input"
          autoComplete="off"
          className="cmdline input-line"
        />
      </div>
    );
  };

  clickOnTerminal = (e) => {
    document.getElementById("terminal_input").focus();
  };

  render() {
    const fontStyle = {
      color: "white",
      backgroundColor: "black",
    };
    return (
      <Window
        className="terminal"
        title={this.props.title}
        pid={this.props.pid}
        ipc={this.props.ipc}
      >
        <div
          style={fontStyle}
          className="terminal-body"
          onClick={this.clickOnTerminal}
        >
          {this.state.output_rows.map((row, i) => {
            return this.renderOutputRow(row, i);
          })}
          {this.renderInputBar()}
          <div
            className="terminal-anchor"
            ref={(el) => {
              this.messagesEnd = el;
            }}
          >
            {" "}
          </div>
        </div>
      </Window>
    );
  }
  componentDidUpdate() {
    this.scrollToBottom();
  }
  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  };
}

function generateUUID() {
  // Public Domain/MIT
  var d = new Date().getTime();
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    d += performance.now(); //use high-precision timer if available
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function getUUID() {
  var uuid = localStorage.getItem("uuid");
  if (uuid) return uuid;

  uuid = generateUUID();
  localStorage.setItem("uuid", uuid);
}
export default Terminal;
