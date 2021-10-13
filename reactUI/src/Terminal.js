import React from "react";
import Window from "./components/Window";
import "./Terminal.css";
import Table from "./components/Table";
import GFileSelector from "./FileExplorer/GFileSelector";
import BroadcastClient from "./Broadcast/BroadcastClient";
import Composer from "./FileExplorer/Composer";
import { wsRoot } from "./constants";
import { useChannel } from "./useChannel";
import { getUUID } from "./APICalls";
let socket = null;

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
    this.onMsg.bind(this);
    this.parseAPIResponse.bind(this);
  }

  initSocket() {
    this.onAddOutputRow({ type: "text", data: "Init.." + wsRoot });
    socket = new WebSocket(wsRoot);
    socket.onopen = (e) => {
      this.onAddOutputRow({ type: "text", data: "CONNECTED" });
      socket.onmessage = this.onMsg;
      socket.send("check-in " + this.state.uuid);
    };
  }
  onMsg = (e) => {
    if (!e.data) return;
    if (typeof e.data === "object") {
      var image = new Image();
      image.src = URL.createObjectURL(e.data);
      this.onAddOutputRow({ type: "image", data: image });
    } else if (e.data.startsWith("stdout: ")) {
      var stdout = e.data.replace("stdout: ", "");
      this.onAddOutputRow({ type: "text", data: stdout });
    } else if (e.data.startsWith("stderr: ")) {
      var stdout = e.data.replace("stderr: ", "");
      this.onAddOutputRow({ type: "text", data: stdout });
    } else {
      try {
        const jsonObj = JSON.parse(e.data);
        this.parseAPIResponse(jsonObj);
      } catch (e) {
        this.onAddOutputRow({ type: "text", data: stdout });
      }
    }
  };
  onAddOutputRow(row) {
    const list = this.state.output_rows.concat(row);
    this.setState({ output_rows: list });
  }

  parseAPIResponse(data) {
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
  }

  componentDidMount() {
    this.initSocket();
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
              className="table table-dark"
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
  keyboardLoaded(e) {
    e.target.focus();
  }
  windowLoaded(e) {
    document.getElementsByClassName("terminal-body").scrollTo(0, 100);
    e.target.offsetHeight = 1000;
  }

  locallyProcessed(cmd_str) {
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
  }
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

  renderInputBar() {
    const stdinPromptString = this.state.foregroundPid || "";
    return (
      <div className="input-line">
        <div id="stdin-prompt" className="prompt">
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
  }

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

export default Terminal;
