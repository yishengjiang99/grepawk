import React from "react";
import Window from "../components/Window";
import SignalClient from "../Model/SignalClient.js";
import Video from "../Video";
import MediaObject from "./MediaObject";
import './broadcast.css';
import BroadcastClient from "./BroadcastClient";


const streamHost = "https://grepawk.com/watch/";
const defaultDimensions ={
    screenshare: [0,0,100,100],
    webcam: [0, 80, 20,20],
    audio: [90,0,10,10],
    textBanner:[5,5,80, 10]
}

class Broadcast extends React.Component {
  state = {
    screenshare: false,
    webcam: false,
    audio: false,
    streamElements:{},
    broadcasting: false,
    broadcastEvents:[],
  };

  constructor(props){
      super(props);
      this.broadcastClient = BroadcastClient({
          onEvent: this.onBroadcastEvent,
          console: "console"
      })
  }
  onBroadcastEvent = (event)=>{
      let events = this.state.broadcastEvents;
      events.push(event);
      this.setState({broadcastEvents:events});
  }

  updateStreamElements=(type, mediaObject, dimensions)=>{
    let cstate = this.state.streamElements;
    cstate[type]=[type, mediaObject, dimensions];
    if(mediaObject!==null && this.state.broadcasting===true){
        this.broadcastClient.addStream(mediaObject, dimensions);
        this.onBroadcastEvent("Adding stream "+type);
    }
    this.setState({streamElements:cstate});
  }
  componentDidMount() {

  }
  renderObjectives = () =>{

  }
  renderPreview = () =>{
      const parts = Object.keys(this.state.streamElements);
      return (
            <div>
            {parts.map(part=>{return (
                <MediaObject mediaObject={this.state.streamElements[part]}></MediaObject>)})}   
            </div>         
      )
  }

  controlClicked=async (control)=>{
      let turnOn = !this.state[control];

      let existingStream = (this.state.streamElements[control] && this.state.streamElements[control][1]) || null; 
      let stream;
      switch(control){
          case "screenshare":
                stream = turnOn ? await this.broadcastClient.requestUserStream(control) 
                                    : await this.broadcastClient.removeStream(existingStream);
                this.updateStreamElements(control, stream, defaultDimensions[control]);
                this.setState({screenshare: turnOn});
                break;
          case "webcam":
                stream = turnOn ? await this.broadcastClient.requestStream(control) 
                                    : await this.broadcastClient.removeStream(existingStream);
                                    
                this.updateStreamElements(control, stream, defaultDimensions[control]);
                this.setState({webcam:turnOn});
                break;
           case "audio":
                stream = turnOn ? await this.broadcastClient.requestStream(control) 
                                    : await this.broadcastClient.removeStream(existingStream);

                this.updateStreamElements(control, stream, defaultDimensions[control]);
                this.setState({audio:turnOn});
                break;
            default: break;
      }
  }
  renderConsole = () =>{
      return (
          <div>
              {this.state.broadcastEvents.map(event=>{
                  let msg;
                  if(typeof event==="object"){
                      msg=JSON.stringify(event);
                  }else{
                     msg = event;
                  }
                  return (<p>{msg}</p>)
              })}
          </div>
      )

  }

  startBroadcasting = async ()=>{
    this.broadcastClient.startBroadcast("yisheng");
    Object.values(this.state.streamElements).forEach((streamElements)=>{
        if(streamElements[1]!==null){
            this.broadcastClient.addStream(streamElements[1],streamElements[2]);
        }
    })
    this.setState({broadcasting:true});
  }
  stopBroadcasting = ()=>{
    this.setState({broadcasting:false});
  }

  renderControls = () => {
    return (
        <ul className="list-group controls">
            {
                ["screenshare","webcam","audio"].map(control=>{
                    var isOn = this.state[control];
                    var text = isOn ? control+" off" : control;
                    var btnClass = isOn ? "btn btn-secondary" : "btn btn-primary";
                    return(
                        <li className="list-group-item">
                            <button className={btnClass} onClick={()=>{this.controlClicked(control)}}>{text}</button>
                        </li>
                    )
                })
            }
                            
            {this.state.broadcasting === false
              ? <button className='btn' onClick={this.startBroadcasting}>Start Broadcast  </button>
              : <button className='btn' onClick={this.stopBroadcasting} >Stop Broadcast</button>}
        </ul>
    );
  };

  render() {
    return (
      <Window
        className="stream"
        title={this.props.title}
        pid={this.props.pid}
        ipc={this.props.ipc}
        draggable={false}
      >
        {this.state.flashMessage ? <div>{this.state.flashMessage}</div> : null}
        <div className="obs">
            {this.renderControls()}
            <div className='preview' ref={this.previewDiv}>
                {this.renderPreview()}
            </div>
          <div className="objectives">{this.renderObjectives()}</div>
          <div className="console">{this.renderConsole()}</div>
        </div>
      </Window>
    );
  }
}
export default Broadcast;
