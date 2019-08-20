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

 const signalServerURL = window.location.hostname == 'localhost' ?
 "ws://localhost:9091" : "wss://grepawk.com/signal";

const SignalClient=function(){
    var localStreamTracks=[];
    var remoteStreams=[];
    var socket;
    var onMessageHandlers={}; //key-value pair so we can remove..

    var socketOnMessage=(event)=>{
        const response = JSON.parse(event.data);
        Object.keys(onMessageHandlers).forEach((key)=>{
            onMessageHandlers[key](response);
        })
    }


    var init = function(){
        return new Promise((resolve,reject)=>{
            if(socket && socket.readyState===WebSocket.OPEN){
                resolve();
            }
            socket = new WebSocket(signalServerURL);
            socket.onopen=(event)=>{resolve()};
            socket.onmessage=socketOnMessage;
            socket.onerror=(event)=>{reject()};
        })
    }
  
    function sendSocketJson(jsonObj){
        socket.send(JSON.stringify(jsonObj));
    }
    let _channelName; 
    let _localStream;
    let _rtcConn;

    return{    
        startStream:  function(stream, channelName){
            return new Promise(async (resolve,reject)=>{
                await init();
                _channelName = channelName;
                _localStream = stream;
                _rtcConn = new RTCPeerConnection(peerRTCConfig);
                _rtcConn.onicecandidate=(e)=>{
                    if(e.candidate){
                        sendSocketJson({type:"candidate",candidate:e.candidate});
                    }
                }
                _localStream.getTracks(track=>{_rtcConn.addTrack(track, _localStream)});
                const offer= await _rtcConn.createOffer()
                await _rtcConn.setLocalDescription(offer);
                sendSocketJson({type:"register_stream",channel:_channelName, offer: offer});
                onMessageHandlers["register_offer_"+_channelName]=function(response){
                    if(response.ok){
                        delete onMessageHandlers["register_offer_"+_channelName];
                        resolve();
                    }else{
                        reject(new Error(response.error));
                    }
                }
                setTimeout(()=>{
                    delete onMessageHandlers["register_offer_"+_channelName];
                    reject(new Error("Broadcast request timed out"));
                },30000);
            })
        }
    }
}

export default SignalClient;