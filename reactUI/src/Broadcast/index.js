import React from "react";
import Window from "../components/Window";
import SignalClient from "../Model/SignalClient.js";
import Video from "../Video";

const signalClient = SignalClient();
const streamHost = "https://grepawk.com/watch/";

const fullWidthAnchorStyle = {
  overflow: "hidden",
  position: "relative",
  width: 100,
  height: 100
};

class Broadcast extends React.Component {
  state = {
    controls: {
      screenshare: false,
      webcam: false,
      audio: false
    },
    broadcasting: false
  };
  componentDidMount() {}
  renderObjectives = () =>{

  }
  renderPreview = () =>{
      
  }
  controlClicked=(control)=>{

  }
  renderConsole = () =>{

  }
  renderControls = () => {
    return (
      <div>
        <ul class="list-group">
          {Object.keys(this.state.controls).map((control, idx) => {
              var on = this.state.controls[control];
              var btnClass = on ? "btn btn-secondary" : "btn btn-primary";
              var btnTxt= on ? "Start "+control : control+" off";
            return (
              <li class="list-group-item">
                <button class={btnClass} onClick={this.controlClicked(control)}>{btnTxt}</button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  render() {
    return (
      <Window
        className="stream"
        title={this.props.title}
        pid={this.props.pid}
        ipc={this.props.ipc}
      >
        {this.state.flashMessage ? <div>{this.state.flashMessage}</div> : null}
        <div class="obs">
          <div class="controls">{this.renderControls()}</div>
          <div class="preview">{this.renderPreview()}</div>
          <div class="objectives">{this.renderObjectives()}</div>
          <div class="console">{this.renderConsole()}</div>
        </div>
      </Window>
    );
  }
}
export default Broadcast;
