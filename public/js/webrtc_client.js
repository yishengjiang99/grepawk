"use strict";


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
   var their_video_div=document.getElementById(opts.their_video);
   var my_video_div = document.getElementById(opts.my_video);



   var conn;
   var login_cb;

   var connect = function (uuid) {
      _uuid = uuid;
      return new Promise((resolve, reject) => {
         conn = new WebSocket(opts.signal_url);
         
         login_cb = function(success,err){
            if(success) resolve();
            else reject(err);
         };
         init_callbacks(login_cb);

         conn.onopen = function (event) {
            channel = channel || 'default';
            conn.send(JSON.stringify({
               type: 'login',
               uuid: uuid,
               channel: channel
            }));
         
         }
         conn.onerror = function (e) 
         {
            debugger;
            console.log(e);
            alert(e.message);
            reject();
         }
      })
   }

   var send_message = function (msgJSON, callback) {
      if (!conn) alert("no connection");

      conn.send(JSON.stringify(msgJSON));
   }
   var init_callbacks = function (login_cb) {
      conn.onmessage = async function (msg) {
         var data = JSON.parse(msg.data);
         switch (data.type) {
            case "login":
               if (!data.success) {
                  if (login_cb) login_cb(false, new Error("server reject"));
               }
               mystream = await navigator.mediaDevices.getUserMedia(constraints);
               my_video_div = document.getElementById(opts.my_video);
               const videoTracks = mystream.getVideoTracks();
               console.log(videoTracks);

               my_video_div.srcObject=mystream;  
                             myconnection = new RTCPeerConnection({
                  "iceServers": [{
                     "url": opts.stun_url
                  }]
               })
               
               myconnection.onaddstream = function (e) {
                  if ('srcObj' in their_video_div) {
                     their_video_div.srcObj = e.stream;
                  } else {
                     their_video_div.src = URL.createObjectURL(e.stream);;
                  }
               };
               myconnection.onicecandidate = function (event) {
                  if (event.candidate) {
                     send_message({
                        type: "candidate",
                        uuid: uuid
                     })
                  }
               }           
               login_cb(true);
               break;
            case "offer":
               myconnection.setRemoteDescription(new RTCSessionDescription(data.offer));
               myconnection.createAnswer().then(answer => {
                  myconnection.setLocalDescription(answer);
                  send({
                     type: "answer",
                     answer: answer,
                     uuid: data.uuid
                  })
               }).catch(err => alert(err.message));
               break;
            case "answer":
               myconnection.setRemoteDescription(new RTCSessionDescription(data.answer));
               break;
            case "candidate":
               myconnection.addIceCandidate(new RTCIceCandidate(data.candidate));
               break;
            case "leave":
               handleLeave();
               break;
            default:
               break;
         }
      }
   }



   return {
      login: async function (uuid) {
         return new Promise(async (resolve,reject)=>{
            try {
               await connect(uuid);    
               resolve();        
            } catch (e) {
               console.log(e);
               console.log();
               reject(e);
            }
         })
      },
      join: function (uuid, channel) {
         channel = channel || 'default';
         myconnection = new RTCPeerConnection({
            "iceServers": [{
               "url": opts.stun_url
            }]
         })
         
         myconnection.onaddstream = function (e) {
            if ('srcObj' in their_video_div) {
               their_video_div.srcObj = e.stream;
            } else {
               their_video_div.src = URL.createObjectURL(e.stream);;
            }
         };
         myconnection.onicecandidate = function (event) {
            if (event.candidate) {
               send_message({
                  type: "candidate",
                  uuid: uuid
               })
            }
         }
         myconnection.createOffer().then(offer => {
            send_message({
               type: 'join',
               uuid: uuid,
               offer: offer,
               channel: channel
            });
            myconnection.setLocalDescription(offer);
         })
      },

   }

}
