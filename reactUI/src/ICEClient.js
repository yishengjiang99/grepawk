var ICEClient = function (options) {
  const opts = Object.assign(
    {
      signal_url:
        window.location.hostname === "localhost"
          ? "ws://localhost:9090"
          : window.location.hostname == "dev.grepawk.com"
          ? "ws://dev.grepawk.com/ice"
          : "wss://" + window.location.hostname + "/ice",
      stun_url: "stun:stun2.1.google.com:1930",
      my_video: "my_video",
      their_video: "their_video",
      video: true,
      audio: true,
    },
    options
  );

  const constraints = {
    video: opts.video,
    audio: opts.audio,
  };

  var channel, mystream;
  var their_video_div = document.getElementById(opts.their_video);
  var my_video_div = document.getElementById(opts.my_video);

  const peerRTCConfig = {
    iceServers: [
      {
        url: "stun:stun.l.google.com:19302",
      },
      {
        url: "turn:192.158.29.39:3478?transport=udp",
        credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
        username: "28224511:1379330808",
      },
      {
        url: "turn:192.158.29.39:3478?transport=tcp",
        credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
        username: "28224511:1379330808",
      },
    ],
    optional: [
      {
        DtlsSrtpKeyAgreement: true,
      },
    ],
  };

  const offerOptions = {
    offerToReceiveAudio: 0,
    offerToReceiveVideo: 1,
  };

  function init_connection(isCaller) {
    var conn = new RTCPeerConnection(peerRTCConfig);
    conn.onicecandidateerror = console.log;

    mystream.getTracks().forEach(function (track) {
      console.log("dating track to stream");
      conn.addTrack(track, mystream);
    });

    conn.ontrack = (e) => {
      their_video_div = document.getElementById(opts.their_video);
      if (e.streams[0] && their_video_div.srcObject !== e.streams[0]) {
        their_video_div.srcObject = e.streams[0];
      }
    };
    conn.onicecandidate = function (event) {
      if (event.candidate != null) {
        send_message({
          type: "candidate",
          candidate: event.candidate,
        });
      }
    };
    if (isCaller) {
      conn.createOffer(offerOptions).then((desc) => {
        candidates = [];
        conn.setLocalDescription(desc);
        send_message({
          type: "join",
          offer: desc,
          channel: channel,
        });
      });
    }
    return conn;
  }
  var myconnection;

  var send_message = function (msg) {
    signalConn.send(JSON.stringify(msg));
  };

  var signalConn;

  var connect = function (uuid) {
    _uuid = uuid;
    signalConn = new WebSocket(opts.signal_url);
    return new Promise((resolve, reject) => {
      signalConn.onopen = function (event) {
        channel = channel || "default";
        signalConn.send(
          JSON.stringify({
            type: "login",
            uuid: uuid,
            channel: channel,
          })
        );
      };
      signalConn.onerror = (e) => reject(e);
      signalConn.onmessage = async (msg) => {
        var data = JSON.parse(msg.data);
        if (data.type == "login") {
          if (!data.success) {
            reject(new Error("server reject"));
          }

          resolve();
        }
      };
    });
  };

  var join = function (channel) {
    channel = channel;
    return new Promise(async (resolve, reject) => {
      try {
        mystream = await navigator.mediaDevices.getUserMedia(constraints);
        my_video_div = document.getElementById(opts.my_video);
        my_video_div.srcObject = mystream;
        myconnection = init_connection(true);
        signalConn.onmessage = handler_messages;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  };

  var handler_messages = async function (msg) {
    console.log(myconnection.iceConnectionState);

    var data = JSON.parse(msg.data);
    switch (data.type) {
      case "offer": //receiving call
        try {
          myconnection = init_connection(false);
          await myconnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          var answer = await myconnection.createAnswer();
          myconnection.setLocalDescription(answer);
          if (data.offer.type == "offer") {
            send_message({
              type: "answer",
              answer: answer,
              uuid: data.caller_id,
            });
          }
        } catch (e) {
          throw e;
        }
        break;
      case "answer":
        if (data.answer.sdp) {
          await myconnection.setRemoteDescription(data.answer);
        }
        break;
      case "candidate":
        await myconnection.addIceCandidate(data.candidate).catch((e) => {
          console.log("Failure during addIceCandidate(): " + e.name);
        });
        // await myconnection.addIceCandidate(new RTCIceCandidate(candidate));
        break;
      default:
        break;
    }
  };

  return {
    login: connect,
    join: join,
    signal_socket: signalConn,
  };
};

export default ICEClient;
