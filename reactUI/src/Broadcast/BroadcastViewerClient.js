const signalServerURL = window.location.hostname == 'localhost' ? "ws://localhost:9091" : "wss://grepawk.com/signal";
const peerRTCConfig = {
    'RTCIceServers': [{url:'stun:stun01.sipphone.com'},
    {url:'stun:stun.ekiga.net'},
    {url:'stun:stun.fwdnet.net'},
    {url:'stun:stun.ideasip.com'},
    {url:'stun:stun.iptel.org'},
    {url:'stun:stun.rixtelecom.se'},
    {url:'stun:stun.schlund.de'},
    {url:'stun:stun.l.google.com:19302'},
    {url:'stun:stun1.l.google.com:19302'},
    {url:'stun:stun2.l.google.com:19302'},
    {url:'stun:stun3.l.google.com:19302'},
    {url:'stun:stun4.l.google.com:19302'},
    {url:'stun:stunserver.org'},
    {url:'stun:stun.softjoys.com'},
    {url:'stun:stun.voiparound.com'},
    {url:'stun:stun.voipbuster.com'},
    {url:'stun:stun.voipstunt.com'},
    {url:'stun:stun.voxgratia.org'},
    {url:'stun:stun.xten.com'},
    {
        url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
        }]
}


function BroadcastViewerClient(config){
    const hostname = config.hostname || signalServerURL;
    let onEvent = config.onEvent || console.log;
    let mediaObjectReady = config.mediaObjectReady;
    let mediaObjectOffline = config.mediaObjectOffline;
    let signalConnection;
    let clientConnection;
    let remoteTracks={};
    let remoteTrackMetaData={};
    let metadataChannel;
    let host_uuid;
    function watchChannel(channelName){
        signalConnection = new WebSocket(hostname);
        signalConnection.onopen = function (e) {
            signalConnection.send(JSON.stringify({
                type: "watch_stream",
                channel: channelName
            }))

            signalConnection.onmessage = function (event) {
                let data = JSON.parse(event.data);
                onEvent("Signal Server msg type "+data.type);
                switch (data.type) {
                    case 'offer':
                        onEvent("got offer: host_uuid=", data.host_uuid);
                        gotSDP(data.offer, data.host_uuid);
                        break;
                    case 'candidate':
                        onEvent("got candidate");
                        clientConnection.addIceCandidate(data.candidate);
                        break;

                    case 'error':
                        onEvent("Error: "+data.message);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    
    async function gotSDP(offer, hostId) {
        host_uuid = hostId;
        clientConnection = new RTCPeerConnection(peerRTCConfig);
        clientConnection.ondatachannel=function(evt){
            evt.channel.onopen=()=>onEvent("metadata channel on client open");
            evt.channel.onmessage=(e)=>{
                onEvent("got metadata "+e.data);
                let data = JSON.parse(e.data);
                if(data.type=='mediaMetadata'){
                    let mediaDescriptors = data.data;
                    mediaDescriptors.forEach(trackMetaData=>{
                      let trackId =   trackMetaData.trackId;
                      remoteTrackMetaData[trackId]=trackMetaData;
                    });
                }
                showRemoteTracks();
            }
        }

        function showRemoteTracks(){
            onEvent("showing remote tracks: "+Object.keys(remoteTrackMetaData).length);
            for(let trackId in remoteTrackMetaData){
                let metadata = remoteTrackMetaData[trackId];
                if(remoteTracks[trackId]){
                    let stream = new MediaStream();
                    stream.addTrack(remoteTracks[trackId]);
                    mediaObjectReady(trackId, stream,remoteTracks[trackId].kind, metadata.dimensions);
                    onEvent("showing tracking ");
                }else{
                    debugger;
                    // let stream = new MediaStream();
                    // stream.addTrack(remoteTracks[trackId]);
                    // mediaObjectReady(trackId, stream,remoteTracks[trackId].kind, metadata.dimensions);
                    // onEvent("showing tracking ");

                    onEvent("Got meta data but not track")
                }

            }
        }
        
        clientConnection.onicecandidate = (e) => {
            onEvent("client on ice candidate ", e);
            if (e.candidate) {
                signalConnection.send(JSON.stringify({
                    type: "candidate",
                    to_uuid: host_uuid,
                    candidate: e.candidate
                }))
            }
        }

        clientConnection.ontrack = (e) => {
            if(e.track){
                remoteTracks[e.track.id]=e.track;
            }
            showRemoteTracks();
        }

        await clientConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await clientConnection.createAnswer();
        clientConnection.setLocalDescription(answer);
        signalConnection.send(JSON.stringify({
            type: "answer",
            to_uuid: host_uuid,
            answer: answer
        }))
    }
    return {
        watchChannel: watchChannel
    }
}

export default BroadcastViewerClient;