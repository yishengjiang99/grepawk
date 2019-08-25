const peerRTCConfig = {
    'RTCIceServers': [{
        'url': 'stun:stun.l.google.com:19302'
    }]
}

const signalServerURL = window.location.hostname == 'localhost' ? "ws://localhost:9091" : "wss://grepawk.com/signal";

function BroadcasterClient(config) {
    config = config || {};
    const hostname = config.hostname || signalServerURL;
    let onEvent = config.onEvent || function(evt) {
        debug("event: ", event)
    }
    let signalConnection;
    let peerConnections = {};
    let _stream;
    var host_uuid;

    function sendJson(json, to_uuid) {
        if (to_uuid) json[to_uuid] = to_uuid;
        signalConnection.send(JSON.stringify(json));
    }

    function startBroadcast(channelName) {
        signalConnection = new WebSocket(hostname);
        signalConnection.onmessage = (e) => {
            const data = JSON.parse(event.data);
            onEvent({from:"signal_msg", ...event.data.type});
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
            config.onEvent({
                type: "streamStarted"
            });
        }
        signalConnection.onerror = (e) => debug("ERROR: signalconnection not connecting", e);
    }

    function user_sent_peer_ice_candidate(data) {
        if (!data.client_uuid || !data.candidate) throw new Error("unexpected request in user_sent_peer_ice_candidate");
        peerConnections[data.client_uuid].addIceCandidate(data.candidate);
        debug("add peer ice candidate from " + data.client_uuid);
    }

    function user_sent_sdp_answser(data) {
        if (!data.client_uuid || !data.answer) throw new Error("unexpected request in user_sent_peer_ice_candidate");
        peerConnections[data.client_uuid].set_sdp_anwser(data.answer);
    }

    function user_join_request(data) {
        if (!data.client_uuid) throw new Error("unexpected user_join request");
        peerConnections[data.client_uuid] = BroadcasterRTCConnection(signalConnection, data.client_uuid,host_uuid);
        peerConnections[data.client_uuid].updateTracks(_stream.getTracks());
    }

    return {
        peerConnections: peerConnections,
        startBroadcast: startBroadcast,
        setStream: function(stream) {
            _stream = stream;
        }
    }
}

function BroadcasterRTCConnection(signalConnection, client_uuid,host_uuid) {
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
        debug("creating sdp offer for " + client_uuid, evt);
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
            tracks.forEach(track=>{
                if(!!trackMap[track.id]){
                    debug("skip existing track");
                }
                trackMap[track.id]=1;
                debug("adding new track ",track);
                peerConnection.addTrack(track);
            })
        },
        set_sdp_anwser: async function(answer) {
            try {
                await peerConnection.setRemoteDescription(answer);
                debug("Remote Anwser set"); 
            } catch (e) {
                debug("ERROR: in set_dsp_anwser", e);
            }
        },
        addIceCandidate:function(candidate){
            debug("add ice candidate ",candidate);
            peerConnection.addIceCandidate(candidate);
        }
    }
}

function BroadcasterUI(config) {
    var config = config || {};
    config = Object.assign({
        rootElement: 'obs',
        previewElement: "preview",
        controlElement: "controls",
        consoleElement: "console",
        screenShareBtn: 'screenshare_button',
        camBtn: "cam_button",
        startBroadcastBtn:"start_broadcast",
        dimensions: {
            'screenShare': [0, 0, 1400, 800],
            'camera': [0, 0, 400, 400]
        }
    }, config);
    let screenShareStream;
    const rootElement = document.getElementById(config.rootElement);
    const screenVideo = document.querySelector("video#screenshare");
    const cameraVideo = document.querySelector("video#camera");
    const mixer = document.querySelector("canvas#mixer");
    let tracks = {};

    const screenShareBtn = document.getElementById(config.screenShareBtn);
    const camBtn = document.getElementById(config.camBtn);
    const startBroadcastBtn = document.getElementById(config.startBroadcastBtn);
    var broadcastClient;
    var canvasStream;
    const consoleDiv = $("#" + config.consoleElement);

    function init() {
        signalConnection = new WebSocket(signalServerURL);
        screenShareBtn.addEventListener("click", screenShareOnClick);
        camBtn.addEventListener("click", cameraButtonOnClick);
        document.getElementById("start_broadcast").addEventListener("click", start_broadcast);
    }

    var screenShareLive = false;
    var camShareLive = false;
    async function screenShareOnClick(e) {
        if (!screenShareLive) {
            try {
                screenShareStream = await navigator.mediaDevices.getDisplayMedia();
            } catch (e) {
                debug(e.message);
                return;
            }
            screenShareLive = true;
            var settings = screenShareStream.getVideoTracks()[0].getSettings();
            screenVideo.addEventListener("play", e => {
                tracks["screenShare"] = {
                    mediaSource: screenVideo,
                    zIndex: 0,
                    key: "screenShare",
                    width: settings.width,
                    height: settings.height,
                    ratio: 0.9
                }
                update_mixer();
            });
            screenVideo.srcObject = screenShareStream;
            e.target.innerHTML = "Stop screen share";
        } else {
            delete tracks['screenShare'];
            e.target.innerHTML = "Share screen";
            screenShareStream.getTracks().forEach(track => track.stop());
            screenShareLive = false;
            update_mixer();
        }
    }

    async function cameraButtonOnClick(e) {
        if (!camShareLive) {
            try {
                camStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
            } catch (e) {
                debug(e.message);
                return;
            }
            e.target.innerHTML = "Stop Camera";
            camShareLive = true;
            var settings = camStream.getVideoTracks()[0].getSettings();
            cameraVideo.addEventListener("play", e => {
                tracks["camera"] = {
                    mediaSource: cameraVideo,
                    zIndex: 1,
                    key: "camera",
                    width: settings.width,
                    height: settings.height,
                    ratio: 0.2
                }
                update_mixer();
            });
            cameraVideo.srcObject = camStream;

        } else {
            delete tracks['camera'];
            camShareLive = false;
            camStream.getTracks().forEach(track => track.stop());
            e.target.innerHTML = "Start Camera";
            update_mixer();
        }
    }


    function start_broadcast() {
        var channelName = $("#channel_name_input").val();
        channelName="yisheng";
        if (!channelName) channelName = prompt("What is the channel name?");
        if (!channelName) {
            alert("channel name cannot be empty");
            return;
        }

        broadcastClient = BroadcasterClient({
            onEvent: function(evt) {
                debug("broadcast Client: ", evt);
            }
        });
        broadcastClient.startBroadcast(channelName);
        updateStreamTracksIfBroadcasting();
    }

    function updateStreamTracksIfBroadcasting(){
        if(broadcastClient && !canvasStream){
            canvasStream = mixer.captureStream(100);
            broadcastClient.setStream(canvasStream);
        }
    }

    var mixerTimeoutID = null;

    function update_mixer() {
        if (mixerTimeoutID) {
            clearInterval(mixerTimeoutID);
            mixerTimeoutID = null;
        }
        const ctx = mixer.getContext("2d");
        const tracksOrder = Object.values(tracks).sort((a, b) => b.zIndex - a.zIndex);
        debug("tracksorder",tracksOrder);
        var maxW = 0;
        var maxH = 0;
        tracksOrder.forEach((track) => {
            if (track.width > maxW) maxW = track.width;
            if (track.height > maxH) maxH = track.height;
        })
        mixer.width = maxW * 0.8; //hack
        mixer.height = maxH * 0.8;

        function drawTracks() {
            // sctx.clear();
            ctx.globalCompositeOperation = "source-over";

            tracksOrder.forEach((track, i, arr) => {
                ctx.drawImage(track.mediaSource, 0, 0,
                    track.width, track.height,
                    0, 0, track.width * track.ratio, track.height * track.ratio);
            })
            timeoutId = setTimeout(drawTracks, 20);
        }
        debug("mixing tracks ", tracksOrder);
        drawTracks();
        updateStreamTracksIfBroadcasting();
    }

    return {
        init: init
    }
}
const start = new Date().getTime();

function debug(msg, obj) {
    const t = new Date().getTime() - start;
    $("#console").append("<br>t" + t + ": " + msg);
    if (obj) $("#console").append((JSON.stringify(obj).replace("\r\n", "<br>")));
}


function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
var broadcaster = BroadcasterUI();
broadcaster.init();