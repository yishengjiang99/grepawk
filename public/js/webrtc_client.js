var WebRTC_Client = function (options) {
   const opts = Object.assign({
      signal_url: "ws://localhost:9090",
      stun_url: "stun:stun2.1.google.com:1930",
      my_video: "my_video",
      their_video: "their_video",
      video: true,
      audio: true
   }, options);
   const constraints = {
      video: opts.video,
      audio: opts.audio
   }


   var stun_url = stun_url || "stun:stun2.1.google.com:1930";
   var _uuid, channel, mystream, theirstream, myconnection;
   var their_video_div = document.getElementById(opts.their_video);
   var my_video_div = document.getElementById(opts.my_video);
   const peerRTCConfig = {
      "iceServers": [{
         "url": opts.stun_url
      }]
   }

   var send_message = function(msg){
      signalConn.send(JSON.stringify(msg));
   }

   var signalConn;
   var connect = function (uuid) {
      _uuid = uuid;
      signalConn = new WebSocket(opts.signal_url);
      return new Promise((resolve, reject) => {
         signalConn.onopen = function (event) {
            channel = channel || 'default';
            signalConn.send(JSON.stringify({
               type: 'login',
               uuid: uuid,
               channel: channel
            }));
         }
         signalConn.onerror = (e) => reject(e);
         signalConn.onmessage = async  (msg) => {
            var data = JSON.parse(msg.data);
            if (data.type == 'login') {
               if (!data.success) {
                  reject(new Error("server reject"));
               }
               mystream = await navigator.mediaDevices.getUserMedia(constraints);
               my_video_div = document.getElementById(opts.my_video);
               my_video_div.srcObject = mystream;
               resolve();
            }
         }
      })
   }


   var join =function (channel) {
      return new Promise(async (resolve, reject) => {
         try {
            myconnection = new RTCPeerConnection(peerRTCConfig);
            myconnection.onicecandidate = function (event) {
               alert('k');
               if (event.candidate) {
                  send_message({
                     type: "candidate",
                     uuid: uuid
                  })
               }
            }
            var offer = await myconnection.createOffer();
            await myconnection.setLocalDescription(offer);
            send_message({
               type: 'join',
               offer: offer,
               channel: channel
            });
            signalConn.onmessage = handler_messages;
            resolve();
         } catch (e) {
            reject(e);
         }
      })
   }

   var handler_messages = async function (msg) {
      var data = JSON.parse(msg.data);
      switch (data.type) {
         case "offer": //receiving call
            try {
               await myconnection.setRemoteDescription(data.offer);
               const answer = await myconnection.createAnswer();
               await myconnection.setLocalDescription(answer);
               send_message({
                  type: "answer",
                  answer: answer
               })
            } catch (e) {
               throw e;
            }
            break;
         case "answer":
            await myconnection.setRemoteDescription(data.answer);
            break;
         case "candidate":
            debugger;
            await yourConn.addIceCandidate(new RTCIceCandidate(candidate));
            break;
         default:
            break;
      }
   }

   return {
      login: connect,
      join: join,
      signal_socket: signalConn,

   }
}