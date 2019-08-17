const db = require("./lib/db");

var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({
   port: 9090
});

function sendTo(connection, message) {
   console.log("****sending to "+connection.user.username+": "+message.type);
   connection.send(JSON.stringify(message));
}

function sendError(connection, msg) {
   connection.send(JSON.stringify({type:"error",message:msg}));
}



var channels={};
var connections=[];
var joinChannel=function(connection,channel){
   console.log("join channel");
   if(!channels[channel]){
      channels[channel]={
         users:{},
         name:channel
      }
   }
   channels[channel]['users'][connection.user.uuid]= connection;
   return channels[channel];
}

var broadcasts = {}

wss.on('connection', function (connection){
   connections.push(connection);
   console.log(connection.headers, "connected")
   connection.on('message', function (message) {
    console.log(channels);
      console.log("on message "+message);
      var data;
      try {
         data = JSON.parse(message);
      } catch (e) {
         console.log("Invalid JSON");
         data = {};
      }
      switch (data.type) {
         case 'register_broadcast':
            broadcsts[args[0]] = connection;  
             sendTo(connection, {
                ok:true
             });
         break;
         case "login":
            db.get_user_cols(data.uuid,['uuid','username']).then(user=>{
               connection.user = user;
               connection.uuid = user.uuid;
               
               connection.channel = data.channel || "default";
               var channelJoined=joinChannel(connection, connection.channel);
               sendTo(connection, {
                  type: "login",
                  success: true,
                  channelJoined: channelJoined.name,
                  usersCount: Object.values(channelJoined.users).length
               });
            }).catch(err=>{
               console.log("error",err);
               sendError(connection,"get user failed");
            })
            break;
         case "offer":
            const offerToChannel = data.channel;
            if(!channels[offerToChannel]){
               sendError(connection,"Channel doesn't exist");
            }
            Object.keys(channels[offerToChannel].users).forEach(otherUuid=>{
               if(otherUuid!==connection.uuid){
                  const otherConn = channels[offerToChannel]['users'][otherUuid];
                  sendTo(otherConn,{
                     type:"offer",
                     offer: data.offer,
                     channel: offerToChannel,
                     caller_id: connection.uuid
                  })
               }
           
            })
            break;
         case "answer":
            console.log("Sending answer to: ", data.uuid);
            var otherConnection  = channels[data.channel]['users'][data.uuid];
            if(!otherConnection){
               sendError(connection,"Other user not found/left");
               return;
            }
            sendTo(otherConnection,{ type: "answer",answer: data.answer}) 
            break;
         case "candidate":
            console.log("candidate received");
            console.log(data.candidate);
            Object.keys(channels[data.channel].users).forEach(otherUuid=>{
               if(otherUuid!=connection.uuid){
                  const otherConn = channels[data.channel]['users'][otherUuid];
                  sendTo(otherConn, {
                     type: "candidate",
                     candidate: data.candidate,
                  });
               }
            })
            break;
         case "leave":
            console.log("Disconnecting from", data.uuid);
            var conn = users[data.uuid];
            conn.otheruuid = null;
            //notify the other user so he can disconnect his peer connection 
            if (conn != null) {
               sendTo(conn, {
                  type: "leave"
               });
            }
            break;
         default:
            sendTo(connection, {
               type: "error",
               message: "Command not found: " + data.type
            });

            break;
      }
      connection.on("close", function () {
         // if (connection.uuid) {
         //    delete users[connection.uuid];
         //    if (connection.otheruuid) {
         //       console.log("Disconnecting from ", connection.otheruuid);
         //       var conn = users[connection.otheruuid];
         //       conn.otheruuid = null;
         //       if (conn != null) {
         //          sendTo(conn, {
         //             type: "leave"
         //          });
         //       }
         //    }
         // }
      });
     // console.log("Got message from a user:", message);
   });
   //sendTo(connection,{type:"connected"});
});
