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


const signalServerURL = window.location.hostname == 'localhost' ? "ws://localhost:9091" : "wss://grepawk.com/signal";

function BroadcasterClient(config) {
    config = config || {};
    config.console = config.console || "console";
    const hostname = config.hostname || signalServerURL;
    let onEvent = config.onEvent || console.log;
    let signalConnection;
    let peerConnections = {};
    let localTracks=[];
    var host_uuid;
    var audioCtx = new AudioContext();
    var audioMeter = audioCtx.createAnalyser();

    var audioMeterBuffer = new Uint8Array(256);
    


    function trackDescriptor(id, track,dimensions){
        return{
            id:id, track:track, dimensions:dimensions, live:true
        }
    }
    function addTrack(track, dimensions){
        for(var idx in localTracks){
            if(localTracks[idx].id===track.id){
                localTracks[idx]=trackDescriptor(track.id, track, dimensions);
            }
        }
        localTracks.push(trackDescriptor(track.id, track, dimensions));
    }
    function removeTrack(track){
        for(var idx in localTracks){
            if(localTracks[idx].id===track.id){
                localTracks[idx].live=false;
            }
        }
    }
    function sendJson(json, to_uuid) {
        if (to_uuid) json[to_uuid] = to_uuid;
        signalConnection.send(JSON.stringify(json));
    }

    function startBroadcast(channelName) {
        signalConnection = new WebSocket(hostname);
        signalConnection.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onEvent(event.data.type ||"");
            switch (data.type) {
                case 'registered':
                    host_uuid = data.host_uuid;
                break;
                case 'user_joined':
                    user_join_request(data);
                    break;
                case 'answer':
                    user_sent_sdp_answser(data);
                    break;
                case 'candidate':
                    user_sent_peer_ice_candidate(data);
                    break;
                case 'user_left':
                    break;
                default:
                    break;
            }
        }
        signalConnection.onopen = (e) => {
            sendJson({
                type: "register_stream",
                channel: channelName
            });
            onEvent("Stream registered "+channelName);
        }
        signalConnection.onerror = (e) => onEvent("ERROR: signalconnection not connecting", e);
    }

    function user_sent_peer_ice_candidate(data) {
        if (!data.client_uuid || !data.candidate) throw new Error("unexpected request in user_sent_peer_ice_candidate");
        peerConnections[data.client_uuid].addIceCandidate(data.candidate);
        onEvent("add peer ice candidate from " + data.client_uuid);
    }

    function user_sent_sdp_answser(data) {
        if (!data.client_uuid || !data.answer) throw new Error("unexpected request in user_sent_peer_ice_candidate");
        peerConnections[data.client_uuid].set_sdp_anwser(data.answer);
    }

    function user_join_request(data) {
        if (!data.client_uuid) throw new Error("unexpected user_join request");
        peerConnections[data.client_uuid] = BroadcasterRTCConnection(signalConnection, data.client_uuid,host_uuid,onEvent);
        peerConnections[data.client_uuid].updateTracks(localTracks);
        
    }
    function updateTrackForPeers(){
        Object.values(peerConnections).forEach(client=>{
            client.updateTracks(localTracks);
        })
    }

    function addStream(stream,dimensions){
        stream.getTracks().forEach(track=>{
            addTrack(track, dimensions);
        })       
        updateTrackForPeers();
    }

    function removeStream(stream){
        stream.getTracks().forEach((track)=>{
            removeTrack(track);
            track.stop();
        })
        updateTrackForPeers();
        return null;
    }

    function requestUserStream(type){
        return new Promise(async (resolve,reject)=>{
            try {
                let stream;
                if(type=="screenshare"){
                    stream =  await navigator.mediaDevices.getDisplayMedia();
                }else if(type=="webcam"){
                    stream = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
                }else if(type=="audio"){
                    stream = await navigator.mediaDevices.getUserMedia({video:false, audio:true});
                }else{
                    reject(new Error("Unkown type"))
                }
                if(stream) resolve(stream);
                else resolve(null);
            } catch (e) {
               reject(e);
            }
        })
    }

    return {
        requestUserStream: requestUserStream,
        addStream: addStream,
        removeStream:removeStream,
        peerConnections: peerConnections,
        startBroadcast: startBroadcast,
        audioMeter: audioMeter,
        audioCtx: audioCtx
    }
}
function BroadcasterRTCConnection(signalConnection, client_uuid,host_uuid,onEvent) {
    var signalConnection = signalConnection;
    var client_uuid = client_uuid;
    var host_uuid;
    var peerConnection = new RTCPeerConnection(peerRTCConfig);
    var metadataChannel = peerConnection.createDataChannel("metadata");

    var trackMap={};

    metadataChannel.onopen = function(){
        onEvent("Meta channel open with "+client_uuid);
        sendMetaData();
    }
    peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
            signalConnection.send(JSON.stringify({
                type: "candidate",
                candidate: e.candidate,
                to_uuid: client_uuid,
                host_uuid: host_uuid
            }));
        }
    }
    peerConnection.onnegotiationneeded = async (evt) => {
        onEvent("creating sdp offer for " + client_uuid);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        signalConnection.send(JSON.stringify({
            type: "offer",
            to_uuid: client_uuid,
            offer: offer,
            host_uuid:host_uuid
       }))
    }
    function sendMetaData(){
        if(!metadataChannel || metadataChannel.readyState!=='open'){
            onEvent("metadata channel not yet o0pen");
            setTimeout(sendMetaData, 1000);
            return;
        }
        
        let metadata=[];
        let trackIds = Object.keys(trackMap);
        trackIds.forEach(trackId=>{
            let track = trackMap[trackId];
            metadata.push({
                trackId: track.id,
                dimensions: track.dimensions,
                live: track.active
            })
        })          
        let payload = {
            type:"mediaMetadata",
            data: metadata
        }
        onEvent("sending metadata ", payload);
        metadataChannel.send(JSON.stringify(payload));
    }

    return {
        updateTracks: function(tracks){
            for(var idx in tracks){
               let trackId = tracks[idx].id;
               if(typeof trackMap[trackId]!=='undefined'){
                   continue;
               }
               trackMap[trackId] = tracks[idx];
               if(tracks[idx].live) peerConnection.addTrack(tracks[idx].track);
            }     
            sendMetaData();
        },

        set_sdp_anwser: async function(answer) {
            try {
                await peerConnection.setRemoteDescription(answer);
                onEvent("Remote Anwser set"); 
            } catch (e) {
                onEvent("ERROR: in set_dsp_anwser");
            }
        },
        addIceCandidate:function(candidate){
            onEvent("add ice candidate ");
            peerConnection.addIceCandidate(candidate);
        }
    }
}

// 
export default BroadcasterClient;