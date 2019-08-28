import React from "react";
import Window from "../components/Window";
import MediaObject from "./MediaObject";
import BroadcastViewerClient from "./BroadcastViewerClient";
import "./Watch.css";

class Watch extends React.Component {
    state={
        broadcastEvents:[],
        media:{}
    }

    constructor(props){
        super(props);
        this.broadcastViewerClient = BroadcastViewerClient({
            channelName:        this.props.channelName,
            onEvent:            this.onBroadcastEvent,
            mediaObjectReady:   this.mediaObjectReady,
            mediaObjectOffline: this.mediaObjectReady
        });
    }

    mediaObjectReady=(trackId, stream, type, dimensions)=>{
       let _objs = this.state.media;
       _objs[trackId] = [type, stream, dimensions];   
       this.setState({media: _objs});
    }

    mediaObjectOffline=(trackId)=>{
        let _objs = this.state.media;
        delete _objs[trackId];
        this.setState({media: _objs});
    }

  onBroadcastEvent = (event)=>{
      let events = this.state.broadcastEvents;
      events.push(event);
      this.setState({broadcastEvents:events});
  }

  componentDidMount() {
      this.broadcastViewerClient.watchChannel(this.props.channelName);
  }

  renderStream = () =>{
      const parts = Object.keys(this.state.media);
     console.log("Rendering "+parts.length+" stream parts");
      return (
            <div className='stream-content'>
                {
                   parts.map((part,idx)=>{ 
                        return (<MediaObject key={idx} notDraggable={true} 
                                mediaObject={this.state.media[part]}></MediaObject>)
                    })
                }   
            </div>         
      )
  }


  renderConsole = () =>{
      return (
          <div className='console-watcher'>
              {this.state.broadcastEvents.map((event,idx)=>{
                  let msg;
                  if(typeof event==="object"){
                      msg=JSON.stringify(event);
                  }else{
                     msg = event;
                  }
                  return (<p key={idx}>{msg}</p>)
              })}
          </div>
      )

  }
  render() {
    return (
      <Window
        className="watch-stream"
        title={this.props.title}
        pid={this.props.pid}
        ipc={this.props.ipc}
        draggable={false}   
      >
      <div key='rr' className='stream-wrapper'>
        {this.renderStream()}
        {this.renderConsole()}
      </div>
      </Window>
    );
  }
}
export default Watch;
