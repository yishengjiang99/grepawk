const peerRTCConfig = {
    'RTCIceServers': [{
        'url': 'stun:stun.l.google.com:19302'
    }]
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
const signalServerURL = window.location.hostname == 'localhost' ?
    "ws://localhost:9091" : "wss://grepawk.com/signal";

var broadcaster = function(config){
    var config = config||{};
    config = Object.assign({
        rootElement:'obs',
        previewElement:"preview",
        
        controlElement:"controls",
        consoleElement:"console",
        screenShareBtn:'screenshare_button',
        camBtn:"cam_button",
        dimensions:{
            'screenShare':[0,0, 1400, 800],
            'camera':[0,0, 400, 400]
        }
    },config);


    let screenShareStream;
    var signalConnection;
    let p2pConnections=[];
    let start;
    const rootElement = document.getElementById(config.rootElement);
    const screenVideo = document.querySelector("video#screenshare");
    const cameraVideo = document.querySelector("video#camera");
    const mixer = document.querySelector("canvas#mixer");
    let tracks = {};

    const screenShareBtn = document.getElementById(config.screenShareBtn);
    const camBtn         = document.getElementById(config.camBtn);

    const consoleDiv = $("#"+config.consoleElement);

    function init(){
        start = new Date().getTime();
        signalConnection= new WebSocket(signalServerURL);
        screenShareBtn.addEventListener("click",screenShareOnClick);
        camBtn.addEventListener("click",cameraButtonOnClick);
    }

    var screenShareLive = false;
    var camShareLive = false;
    async function screenShareOnClick(e){
        if(!screenShareLive){
            try{                
                screenShareStream= await navigator.mediaDevices.getDisplayMedia();
            }catch(e){
                debug(e.message);
                return;
            }
            screenShareLive=true;
            var settings = screenShareStream.getVideoTracks()[0].getSettings();

            screenVideo.addEventListener("play",e=>{
                tracks["screenShare"]={
                    mediaSource: screenVideo,
                    zIndex:0,
                    key:"screenShare",
                    width:settings.width,
                    height:settings.height,
                    ratio:0.9
                }
                update_mixer();
            });
            screenVideo.srcObject=screenShareStream;
            e.target.innerHTML="Stop screen share";
        }else{
            delete tracks['screenShare'];
            e.target.innerHTML="Share screen";
            screenShareStream.getTracks().forEach(track=>track.stop());
            screenShareLive=false;
            update_mixer();
        }
    }

    async function cameraButtonOnClick(e){
        if(!camShareLive){
            try{                
                camStream= await navigator.mediaDevices.getUserMedia({video:true, audio:false});
            }catch(e){
                debug(e.message);
                return;
            }
            e.target.innerHTML = "Stop Camera";
            camShareLive=true;
            var settings = camStream.getVideoTracks()[0].getSettings();
            cameraVideo.addEventListener("play",e=>{
                tracks["camera"]={
                    mediaSource: cameraVideo,
                    zIndex:0,
                    key:"camera",
                    width:settings.width,
                    height: settings.height,
                    ratio: 0.2
                }
                update_mixer();
            });
            cameraVideo.srcObject = camStream;
            
        }else{
            delete tracks['camera'];
            camShareLive=false;
            camStream.getTracks().forEach(track=>track.stop());
            e.target.innerHTML="Start Camera";
            update_mixer();
        }
    }

    var mixerTimeoutID=null;
    function update_mixer(){
        if(mixerTimeoutID){
            clearInterval(mixerTimeoutID);
            mixerTimeoutID=null;
        }


        const ctx = mixer.getContext("2d");
        const tracksOrder =Object.values(tracks).sort((a,b)=>b.zIndex-a.zIndex);
       
        var maxW=0;
        var maxH=0;
        tracksOrder.forEach((track)=>{
            if(track.width>maxW) maxW=track.width;
            if(track.height>maxH) maxH = track.height;
        })
        mixer.width=maxW*0.8; //hack
        mixer.height=maxH*0.8;
        function drawTracks(){
            tracksOrder.forEach((track,i,arr)=>{

                debug("drawing tracks: ",track);
                if(i<1) ctx.globalCompositeOperation="destination-over";
                else ctx.globalCompositeOperation="source-over";
                ctx.drawImage(track.mediaSource, 0, 0, 
                    track.width, track.height,
                    0,0,track.width*track.ratio, track.height*track.ratio);
                debug("destination dimension",[track.width*track.ratio, track.height*track.ratio]);

            })
            timeoutId=setTimeout(drawTracks, 20);
        }
        debug("mixing tracks ",tracksOrder);
        drawTracks();
    }

    function debug(msg, obj) {
        const t = new Date().getTime()-start;
        consoleDiv.append("<br>t" + t + ": " + msg);
        if (obj) consoleDiv.append((JSON.stringify(obj).replace("\r\n", "<br>")));
    }

    async function getCamera(){
        try {
            return await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        } catch (e) {
            debug("error",e);
        }
    }

    return {
        init: init
    }
}


var broadcaster = broadcaster();
broadcaster.init(); 
