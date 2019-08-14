import React from 'react'
import Window from './components/Window'
import Video from "./Video";

const divStyle={

}

const signal_url="ws://localhost:9090";
var signal_connection, rtcConn;


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
        this.videoRef = React.createRef();
    }

    state={
        enteredRoom: false,
        signalConnected:false,
        videoOn:true,
        audioOn: true,
        flashMessage:"",
        error:null,
        myStream: null,
        room: this.props.room || "default",
        isHost:null,
        remoteStreams:[]
    }

    componentDidMount(){
        signal_connection = new WebSocket(signal_url);
        signal_connection.onopen=(e)=>{
            this.setState({signalConnected:true});
        };
        signal_connection.onmessage=(msg)=>{
            var data = JSON.parse(msg.data);
            if (data.type == 'login') {
                this.onLoggedInWithSignalServer(data);
            }
            else if (data.type == 'offer') {
                this.onReceivedRemoteConnectionOffer(data);
            }
            else if (data.type == 'answer') {
                this.onReceivedConnectionRequestResponse(data);
            }
            else if(data.type=='candidate'){
                this.onReceivedICECandidate(data);
            }

        }

        navigator.getUserMedia({video:this.state.videoOn, audio:this.state.audioOn},(stream)=>{this.setState({myStream:stream})}, (err)=>{
            this.setState({error:err.message});
        });
    }
    componentWillUnmount(){
        this.onClosed();
    }
    video = null;

    joinRoom=async()=>{
        signal_connection.send(JSON.stringify({ type: 'login', channel: this.state.room, uuid: this.props.userInfo.username }));
        signal_connection.onmessage=(msg)=>{
            var data = JSON.parse(msg.data);
            if (data.type == 'login' && data.success) {
                this.onLoggedInWithSignalServer(data);
            }
        }
    }

    initiateRTCPeerConnection=(asCaller)=>{
        let rtcConn = new RTCPeerConnection(peerRTCConfig);
        this.state.myStream.getTracks().forEach(track=>{
            rtcConn.addTrack(track,this.state.myStream);
        })
        rtcConn.ontrack=(e)=>{
            const tracklist = this.state.remoteStreams.concat(e.streams);
            this.setState({remoteStreams:tracklist});
        }
        rtcConn.onicecandidateerror=(e)=>{
            this.setState({flashMessage:e.message});
        }
        rtcConn.onicecandidate = function (event) {
            if (event.candidate!=null) {
                signal_connection.send(JSON.stringify({
                    type: "candidate",
                  candidate: event.candidate,
                  channel:this.state.channel
               }))
            }
         }
         if(asCaller){
            rtcConn.createOffer({
                offerToReceiveAudio: this.state.audioOn ? 1 : 0,
                offerToReceiveVideo: this.state.videoOn ? 1 : 0
            }).then(desc => {
                rtcConn.setLocalDescription(desc);
                signal_connection.send(JSON.stringify({
                    type: 'offer',
                   offer: desc,
                   channel: this.state.channel
                }));
             })
         }
         return rtcConn;
    }
    onLoggedInWithSignalServer=(data)=>{
        this.setState({signalConnected:true});
        if(data.users.length==1){
            this.setState({flashMessage:"Joined channel "+data.channelJoined+". Only you here."});
            return;
        }
        rtcConn=this.initiateRTCPeerConnection(true);
    }

    onReceivedRemoteConnectionOffer=async(data)=>{
        rtcConn= this.initiateRTCPeerConnection(false);
        await rtcConn.setRemoteDescription(new RTCSessionDescription(data.offer))
        var answer = await rtcConn.createAnswer();
        signal_connection.send(JSON.stringify({
                type: 'answser',
                answer: answer,
                channel: data.channel,
                uuid: data.caller_id
            }));
    }

    onReceivedConnectionRequestResponse=(data)=>{
        if(data.answer.sdp){
            rtcConn.setRemoteDescription(data.answer);    
         }
    }
    onReceivedICECandidate=(data)=>{
        rtcConn.addIceCandidate(data.candidate).catch(e => {
            console.log("Failure during addIceCandidate(): " + e.name);
        });
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
                <Video width={300} media={this.state.myStream}></Video>
                <p>Join Room: <input   id='join_room_name' onChange={this.chatRoomChanged} value={this.state.room} type='text' size='50'></input></p>
                <p>Audio: <input id='join_room_audio' onChange={this.audioCheckBoxChanged} type='checkbox' checked /></p>
                <p>Video: <input id='join_room_video'  onChange={this.videoCheckBoxChanged} type='checkbox' checked /></p>
                <p><button onClick={this.joinRoom}>Go</button> </p>
            </div>
        )
    }
    renderRoom=()=>{
        return (<div className='cam-room'>
                <Video width={300}  media={this.state.myStream}></Video>
                {this.state.remoteStreams.map(remoteStream=>{
                    return ( <Video width={200} media={remoteStream}></Video>)
                })}            
        </div>)
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