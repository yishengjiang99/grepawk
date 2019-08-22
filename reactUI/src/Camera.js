import React from 'react'
import Window from './components/Window'
import Video from "./Video";

const lobbyStyle={

}

const signal_url="ws://localhost:9090";
var signal_connection, rtcConn;


const peerRTCConfig = {
    'RTCIceServers': [{
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

    async componentDidMount(){
        signal_connection = new WebSocket(signal_url);
        signal_connection.onopen=(e)=>{
            this.setState({signalConnected:true});
        };
        signal_connection.onmessage=(msg)=>{
            try{
                var data = JSON.parse(msg.data);
                console.log("signal on msg ", msg);
                if (data.type === 'login') {
                    this.onLoggedInWithSignalServer(data);
                }
                else if (data.type === 'offer') {
                    debugger;
                    if(data.offer.sdp){
                        this.onReceivedRemoteConnectionOffer(data);

                    }else{
                        console.log("signal ret offer not contrain sdp", data);
                    }
                }
                else if (data.type === 'answer') {
                    this.onReceivedConnectionRequestResponse(data);
                }
                else if(data.type==='candidate'){
                    this.onReceivedICECandidate(data);
                }else if(data.type==='error'){
                    debugger;
                    this.setState({flashMessage:data.message});
                }
    

            }catch(e){
                console.log("signal onmsg failed", e);
            }
          
        }
       try{
        var myStream = await navigator.mediaDevices.getDisplayMedia();
        this.setState({myStream:myStream});
       }catch(e){
           this.setState({error:e.message});
       }
 

    }
    componentWillUnmount(){
        this.onClosed();
    }

    joinRoom=async()=>{
        this.setState({enteredRoom:true});
        signal_connection.send(JSON.stringify({ type: 'login', channel: this.state.room, uuid: this.props.userInfo.uuid }));
    }

    initiateRTCPeerConnection=()=>{
        rtcConn = new RTCPeerConnection(peerRTCConfig);

        rtcConn.ontrack=(e)=>{
            if(e.streams && e.streams[0]){
                const tracklist = this.state.remoteStreams.concat(e.streams[0]);
                this.setState({remoteStreams:tracklist});
            }
        }
        rtcConn.onicecandidateerror=(e)=>{
            this.setState({flashMessage:e.message});
        }
        rtcConn.onicecandidate = (event)=>{
            if (event.candidate!=null) {
                signal_connection.send(JSON.stringify({
                  type: "candidate",
                  candidate: event.candidate,
                  channel:this.state.room
               }))
            }
         }
         return  rtcConn;
    }

    onLoggedInWithSignalServer=(data)=>{
        this.setState({signalConnected:true});
        if(data.usersCount==1){
            this.setState({flashMessage:"Joined channel "+data.channelJoined+". Only you here."});
            return;
        }
        this.initiateRTCPeerConnection();

        rtcConn.onnegotiationneeded = (e)=>{
            rtcConn.createOffer().then(desc=>{
                rtcConn.setLocalDescription(desc);
                signal_connection.send(JSON.stringify({
                    type: 'offer',
                    offer: desc,
                    channel: this.state.room
                 }));
            }).catch(e=>{
                debugger;
                alert(e.message);
            })
           
        }
        this.state.myStream.getTracks(track=>{
            rtcConn.addTrack(track,this.state.myStream);
        })

        rtcConn.createOffer().then(desc=>{
            rtcConn.setLocalDescription(desc);
            signal_connection.send(JSON.stringify({
                type: 'offer',
                offer: desc,
                channel: this.state.room
             }));
        }).catch(e=>{
            alert(e.message);
        })
    }

    onReceivedRemoteConnectionOffer=(data)=>{
         this.initiateRTCPeerConnection();
        rtcConn.setRemoteDescription(new RTCSessionDescription(data.offer)).then(() => {
                this.state.myStream.getTracks().forEach(track=>{
                    rtcConn.addTrack(track,this.state.myStream);
                })
            }).then(()=>{
                return rtcConn.createAnswer();
            }).then((answer)=>{
                rtcConn.setLocalDescription(answer);
                return answer;
            }).then((answer)=>{
                signal_connection.send(JSON.stringify({
                    type: 'answer',
                    answer: answer,
                    channel: data.channel,
                    uuid: data.caller_id
                }));
            }).catch(e=>{
                console.log(e);
                this.setState({flashMessage:e.message+" on receive remote errored"});
            })
    }

    onReceivedConnectionRequestResponse=(data)=>{
        if(data.answer.sdp){

            rtcConn.setRemoteDescription(data.answer).then(function(){
                return navigator.mediaDevices.getDisplayMedia();
            }).then((stream)=>{
                stream.getTracks().forEach(track=>rtcConn.addTrack(track,stream));
            })    
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
                <p>{this.state.flashMessage}</p>
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
            <h3>Room {this.state.room}</h3> 
                <p>{this.state.flashMessage}</p>
                <Video key="mstream" width={200} height={100}  media={this.state.myStream}></Video>
                {this.state.remoteStreams.map((remoteStream,i)=>{
                    console.log(remoteStream);
                    return ( <Video key={"remote-stream-"+i} width={100} height={100} media={remoteStream}></Video>)
                })}            
        </div>)
    }
    render(){
        return (<Window className="camera" title={this.props.title} pid={this.props.pid} ipc={this.props.ipc}>
            {this.state.error!==null ? <div>Error: {this.state.error}</div>: 
                (this.state.signalConnected==false || this.state.myStream ==null) ? <div>Connecting..</div> : 
                   this.state.enteredRoom==false ? this.renderLobby() : this.renderRoom()}
        </Window>)
    }
    onClosed=()=>{
        //this.state.myStream.stop();
    }

}
export default Camera;