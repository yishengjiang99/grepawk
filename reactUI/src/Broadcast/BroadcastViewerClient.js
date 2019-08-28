const signalServerURL = window.location.hostname == 'localhost' ? "ws://localhost:9091" : "wss://grepawk.com/signal";
const peerRTCConfig = {
    'RTCIceServers': [{
        'url': 'stun:stun.l.google.com:19302'
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