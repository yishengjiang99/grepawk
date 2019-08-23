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

function debug(msg, obj) {
    const t = new Date().getTime() - start;
    $("#debug").append("<br>t" + t + ": " + msg);
    if (obj) $("#debug").append((JSON.stringify(obj).replace("\r\n", "<br>")));
}

const signalServerURL = window.location.hostname == 'localhost' ?
    "ws://localhost:9091" : "wss://grepawk.com/signal";
const start = new Date().getTime();
const channelName = window.location.search

async function getApplicationScreenShare(appName) {
    try {
        return await navigator.getUserMedia({
            video: {
                mediaSource: 'application'
            }
        });
    } catch (e) {
        throw e;
    }
}

getApplicationScreenShare();