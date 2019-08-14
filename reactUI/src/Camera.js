import React from 'react'
import Window from './components/Window'
import Video from "./Video";

const divStyle={

}

const signal_url="ws://localhost:9090";
var signal_connection;

const peerRTCConfig = {
    'iceServers': [{
          'url': 'stun:stun.l.google.com:19302'
       },
       {
          'url': 'turn:192.158.29.39:3478?transport=udp',
          'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          'username': '28224511:1379330808'
       },
       {
          'url': 'turn:192.158.29.39:3478?transport=tcp',
          'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          'username': '28224511:1379330808'
       }
    ],
    optional: [{
       'DtlsSrtpKeyAgreement': true
    }]

 }



class Camera extends React.Component{

    constructor(props){
        super(props);
        this.videoRef = React.createRef()
        
    
    }

    state={
        enteredRoom: false,
        signalConnected:false,
        videoOn:true,
        audioOn: true,
        error:null,
        myStream: null,
        room: this.props.room || "default"
    }

    componentDidMount(){
        signal_connection = new WebSocket(signal_url);
        signal_connection.onopen=(e)=>{
            this.setState({signalConnected:true});
        };
        navigator.getUserMedia({video:this.state.videoOn, audio:this.state.audioOn},(stream)=>{this.setState({myStream:stream})}, (err)=>{
            this.setState({error:err.message});
        });
    }
    componentWillUnmount(){
        this.onClosed();
    }
    video = null;

    joinRoom=async()=>{

    }
    chatRoomChanged=(e)=>{
        const value = e.target.value;
        this.setState({'room':value});
    }
    audioCheckBoxChanged=(e)=>{
        this.setState({'audioOn':e.target.value});
    }
    videoCheckBoxChanged=(e)=>{
        this.setState({'videoOn':e.target.value});
    }

    gotMyStream=(stream)=>{
        this.setState({'myStream':stream});
    }
    renderLobby=()=>{      
        return (
            <div className='cam-lobby'>
                <Video media={this.state.myStream}></Video>
                <p>Join Room: <input   id='join_room_name' onChange={this.chatRoomChanged} value={this.state.room} type='text' size='50'></input></p>
                <p>Audio: <input id='join_room_audio' onChange={this.audioCheckBoxChanged} type='checkbox' checked /></p>
                <p>Video: <input id='join_room_video'  onChange={this.videoCheckBoxChanged} type='checkbox' checked /></p>
                <p><button onClick={this.joinRoom}>Go</button> </p>
            </div>
        )
    }
    renderRoom=()=>{
        return (<div className='cam-room'></div>)
    }
    render(){
        return (<Window className="camera" title={this.props.title} pid={this.props.pid} ipc={this.props.ipc}>
            {this.state.error!==null ? <div>Error: {this.state.error}</div>: 
                this.state.signalConnected==false || this.state.myStream ==null ? <div>Connecting..</div> : 
                   this.state.enteredRoom==false ? this.renderLobby() : this.renderRoom()}
        </Window>)
    }
    onClosed=()=>{
        //this.state.myStream.stop();
    }

}
export default Camera;