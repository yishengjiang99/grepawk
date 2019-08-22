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
            socket.onopen=()=>{resolve()};
            socket.onmessage=socketOnMessage;
            socket.onerror=()=>{reject()};
        })
    }
  
    function sendSocketJson(jsonObj){
        socket.send(JSON.stringify(jsonObj));
    }
    let _channelName; 
    let _localStream;
    let _rtcConn;
    let _remoteConnection;

    return{    
        watchStream: function(channelName, userInfo){
            return new Promise(async (resolve,reject)=>{
                await init();
                _remoteConnection = new RTCPeerConnection(peerRTCConfig);
                _remoteConnection.onicecandidate=(e)=>{
                    console.log("on ice cand");
                }
                _remoteConnection.onnegotiationneeded=(e)=>{
                    console.log("remote conn neg needed",e);
                }
                sendSocketJson({"type":"watch_stream","channelName":channelName, userInfo:userInfo});
                onMessageHandlers['watch_request_'+userInfo.uuid] = async function(response){
                    if(response.ok && response.offer){             
                        try{
                            const remoteDescription = new RTCSessionDescription(response.offer);
                            await _remoteConnection.setRemoteDescription(remoteDescription);
                            const answer = await _remoteConnection.createAnswer();
                            await _remoteConnection.setLocalDescription(answer);
                            _remoteConnection.ontrack=(e)=>{
                                debugger;
                                if(e.stream && e.stream[0]){
                                    resolve(e.stream);
                                }
                            }
                            delete onMessageHandlers['watch_request_'+userInfo.uuid];
                        }catch(e){
                            reject(e);
                        }
                    }else{
                        reject(new Error("Unexpected response from server "+JSON.stringify(response)));
                    }
                }
                setTimeout(function(){
                   // reject(new Error("Connection timed out"));
                },15000);


            });

        },
        startStream:  function(streamSource, channelName){
            return new Promise(async (resolve,reject)=>{
                await init();
                _channelName = channelName;
                _rtcConn = new RTCPeerConnection(peerRTCConfig);

                _rtcConn.onicecandidate=(e)=>{
                    console.log("host conn on ice",e);
                    if(e.candidate){
                        sendSocketJson({type:"candidate",candidate:e.candidate});
                    }
                }
                _rtcConn.onnegotiationneeded=(e)=>{
                    console.log("Host Connection on negotiation needed",e);
                }
                if(streamSource=='desktop'){
                    navigator.mediaDevices.getDisplayMedia().then(stream=>{
                        document.querySelector('broadcast_preview');
                        this.setState({screenCaptureStream: stream});
                    });  
                   
                }

               
              try{
                _localStream.getTracks().forEach(track=>{_rtcConn.addTrack(track, _localStream)});
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
              }catch(e){
                  reject(e);
              }
            })
        }
    }
}

export default SignalClient;