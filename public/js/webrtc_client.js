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
   var channel, mystream;
   var their_video_div = document.getElementById(opts.their_video);
   var my_video_div = document.getElementById(opts.my_video);


   const peerRTCConfig = {
      'iceServers': [{
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
      optional: [{ 'DtlsSrtpKeyAgreement': true }]

   }

   function gatheringStateChange() {
      debug("\n"+myconnection.iceGatheringState);
    }


   function init_connection(){
      var conn = new RTCPeerConnection(peerRTCConfig);
      conn.onicegatheringstatechange = gatheringStateChange;
      conn.onicecandidateerror = console.log;
      conn.ontrack = (e) => {
         console.log("theircoon on add track "+e.streams.length);
         their_video_div = document.getElementById(opts.their_video);
         if (e.streams[0] && their_video_div.srcObject !== e.streams[0]) {
            their_video_div.srcObject = e.streams[0];
            console.log('pc2 received remote stream');
            their_video_div.play();
          }
      }
      return conn;
   }
   var myconnection = init_connection();
   const theirConn = init_connection();



   var debug = function (msg) {
      document.getElementById("logger").append("<p>" + msg + "</p>");
   }

   var send_message = function (msg) {
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
         signalConn.onmessage = async (msg) => {
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


   var join = function (channel) {
      var _channel = channel;
      return new Promise(async (resolve, reject) => {
         try {
            console.log(myconnection.iceConnectionState);
            const offerOptions = {
               offerToReceiveAudio: 1,
               offerToReceiveVideo: 1
            };

            myconnection.onicecandidate = function (event) {
               console.log("mycall on on ice ");

               if (event.candidates) {
                  send_message({
                     type: "candidate",
                     uuid: uuid,
                     candate: event.dadidates[0]
                  })
               }
            }
            myconnection.onnegotiationneeded= async () => {
               try {
                  myconnection.createOffer(offerOptions).then(desc=>{
                     candidates = [];
                     myconnection.setLocalDescription(desc);
                     send_message({
                        type: 'join',
                        offer: desc,
                        channel: _channel
                     });
                  })
               } catch (err) {
                 console.error(err);
               }
             };
        
            mystream.getTracks().forEach(function(track) {
               myconnection.addTrack(track, mystream);
             });

            myconnection.onaddstream = (e) => {
               console.log("mycionn on add track");
            }

    
            
            signalConn.onmessage = handler_messages;        
            resolve();
         } catch (e) {
            reject(e);
         }
      })
   }

   var handler_messages = async function (msg) {
      console.log(myconnection.iceConnectionState);

      var data = JSON.parse(msg.data);
      switch (data.type) {
         case "offer": //receiving call
            try {
               myconnection = init_connection();
               //myconnection = new RTCPeerConnection();
               await myconnection.setRemoteDescription(new RTCSessionDescription(data.offer))
               var answer = await myconnection.createAnswer();
               myconnection.setLocalDescription(answer); 
               send_message({
                  type: "answer",
                  answer: answer,
                  uuid: data.caller_id
               })
            } catch (e) {
               throw e;
            }
            break;
         case "answer":
             await myconnection.setLocalDescription(data.answer);
            break;
         case "candidate":
            await myconnection.addIceCandidate(new RTCIceCandidate(candidate));
           // await myconnection.addIceCandidate(new RTCIceCandidate(candidate));
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