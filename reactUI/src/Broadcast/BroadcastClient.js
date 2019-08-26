const peerRTCConfig = {
    'RTCIceServers': [{
        'url': 'stun:stun.l.google.com:19302'
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
    let tracks=[];
    var host_uuid;
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
            onEvent("Stream registered");
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
        peerConnections[data.client_uuid].updateTracks(tracks);
    }
    function updateTrackForPeers(){
        Object.values(peerConnections).forEach(client=>{
            client.updateTracks(tracks);
        })
    }

    function addStream(stream,dimensions){
        stream.getTracks().forEach(async track=>{
            let existing=false;
            tracks.forEach((_track,idx)=>{
                if(_track.id===track.id) {
                    onEvent("existing track "+_track.id);
                    existing=true;
                }
            })
            if(existing===false) tracks.push(track);
        })       
        updateTrackForPeers();
    }

    function removeStream(stream){
        stream.getTracks().forEach((track)=>{
            track.stop();
            tracks.forEach((_track,idx)=>{
                if(_track.id===track.id) tracks.splice(idx,1);
            })
        })
        updateTrackForPeers();
        return null;
    }

    function requestStream(type){
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
        requestStream: requestStream,
        addStream: addStream,
        removeStream:removeStream,
        peerConnections: peerConnections,
        startBroadcast: startBroadcast
    }
}

function BroadcasterRTCConnection(signalConnection, client_uuid,host_uuid,onEvent) {
    var signalConnection = signalConnection;
    var client_uuid = client_uuid;
    var host_uuid;
    var peerConnection = new RTCPeerConnection(peerRTCConfig);
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
    var trackMap={};
    return {
        updateTracks: function(tracks){
            debugger;
            tracks.forEach(track=>{
                if(!!trackMap[track.id]){
                    onEvent("skip existing track");
                    return;
                }
                trackMap[track.id]=1;
                onEvent("adding new track ",track);
                peerConnection.addTrack(track);
            })
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

const start = new Date().getTime();

// 
export default BroadcasterClient;