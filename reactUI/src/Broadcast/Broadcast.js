import React from "react";
import Window from "../components/Window";
import MediaObject from "./MediaObject";
import './broadcast.css';
import BroadcastClient from "./BroadcastClient";

const streamHost = "https://grepawk.com/watch/";
const defaultDimensions ={
    screenshare: [0,0,100,100],
    webcam: [80, 80, 20,20],
    audio: [90,0,10,10],
    text:[5,5,80, 10],
    picture:[0, 10, 20,20],
    audioMeter: [60,70, 20,20]
}

class Broadcast extends React.Component {
  state = {
    screenshare: false,
    webcam: false,
    audio: false,
    streamElements:{},
    additionalStreamParts: [],
    broadcasting: false,
    broadcastEvents:[],
  };

  constructor(props){
      super(props);
      this.broadcastClient = BroadcastClient({
          onEvent: this.onBroadcastEvent,
          console: "console"
      })
      this.channelName = this.props.args[0];
  }
  onBroadcastEvent = (event)=>{
      let events = this.state.broadcastEvents;
      events.push(event);
      this.setState({broadcastEvents:events});
  }

  updateStreamElements=(type, mediaObject, dimensions,extra)=>{
    let cstate = this.state.streamElements;
    cstate[type]=[type, mediaObject, dimensions,extra];
    
    if(mediaObject!==null && this.state.broadcasting===true){
        this.broadcastClient.addStream(mediaObject, dimensions);
        this.onBroadcastEvent("Adding stream "+type);
    }
    this.setState({streamElements:cstate});
  }

  updateAdditionalStreamElements=(type,mediaObject,dimensions)=>{
    let parts = this.state.additionalStreamParts;
    parts.push([type, mediaObject,dimensions]);
    this.setState({additionalStreamParts:parts});
    if(mediaObject!==null && this.state.broadcasting===true){
        this.broadcastClient.addStream(mediaObject, dimensions);
        this.onBroadcastEvent("Adding stream "+type);
    }else{
        // this.onBroadcastEvent("failed adding stream "+type);

    }
  }

  renderObjectives = () =>{

  }
  renderPreview = () =>{
      const parts = Object.keys(this.state.streamElements);
      return (
            <div>
            {parts.map(part=>{return (
                <MediaObject mediaObject={this.state.streamElements[part]}></MediaObject>)})
             }   
             {this.state.additionalStreamParts.map(part=>{
                 return (
                     <MediaObject mediaObject={part}></MediaObject>
                 )
             })}
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
                stream = turnOn ? await this.broadcastClient.requestUserStream(control) 
                                    : await this.broadcastClient.removeStream(existingStream);
                                    
                this.updateStreamElements(control, stream, defaultDimensions[control]);
                this.setState({webcam:turnOn});
                break;
           case "audio":
                stream = turnOn ? await this.broadcastClient.requestUserStream(control) 
                                    : await this.broadcastClient.removeStream(existingStream);

                this.updateStreamElements(control, stream, defaultDimensions[control]);
                    // player.srcObject=_stream;

                    //     var node = audioCtx.createMediaStreamSource(_stream);
                    // node.connect(audioMeter).connect(audioCtx.destination);
                    // stream = audioCtx.createMediaStreamDestination().stream;

                // this.updateAdditionalStreamElements("audioMeter", this.broadcastClient.audioMeter, defaultDimensions['audioMeter']);

                this.setState({audio:turnOn});
                break;
            case 'text':
                var text=prompt("Enter Text");
                this.updateAdditionalStreamElements("text", text, defaultDimensions[control]);
                break;
            case 'picture':
                var pictureUrl=prompt("Enter Picture URL");
                this.updateAdditionalStreamElements("text", pictureUrl, defaultDimensions[control]);
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
      if(!this.channelName){
        this.channelName=prompt("What channel name do you want?");
      }
      if(!this.channelName){
          return;
      }
     var r = window.confirm("Start broadcasting at https://www.grepawk.com/watch/"+this.channelName+" now?");

    if(r){
        this.broadcastClient.startBroadcast(this.channelName);
        Object.values(this.state.streamElements).forEach((streamElements)=>{
            if(streamElements[1]!==null){
                this.broadcastClient.addStream(streamElements[1],streamElements[2]);
            }
        })
        this.setState({broadcasting:true});
     }

  }
  stopBroadcasting = ()=>{
    this.setState({broadcasting:false});
  }

  renderControls = () => {
    return (
        <ul className="list-group controls"> 
            {
                ["screenshare","webcam","audio","picture","text"].map(control=>{
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
                            
        </ul>
    );
  };

  renderHeader=()=>{
      return(
        <div className='header'>
                {this.state.broadcasting === false
                ? <a href='javascript://' onClick={this.startBroadcasting}>Start Broadcast  </a>
                : <a href='javascript://' onClick={this.stopBroadcasting} >Stop Broadcast</a>}
           
        </div>
      )
  }
  render() {
    return (
      <Window  width={900} height={700} left={120}
        className="stream"
        title={this.props.title}
        pid={this.props.pid}
        ipc={this.props.ipc}
        draggable={false}
      >
        {this.state.flashMessage ? <div>{this.state.flashMessage}</div> : null}
        <div className="obs">
            {this.renderHeader()}
                
            {this.renderControls()}
            <div className='preview' ref={this.previewDiv}>
                {this.renderPreview()}
            </div>
            <div className="console">{this.renderConsole()}</div>
          <div className="objectives">{this.renderObjectives()}</div>
        </div>
      </Window>
    );
  }
}
export default Broadcast;
