const db = require("./lib/db");

var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({
   port: 9090
});

function sendTo(connection, message) {
   console.log("****sending to "+connection.uuid+": "+message.type);
   connection.send(JSON.stringify(message));
}

function sendError(connection, msg) {
   connection.send(JSON.stringify({type:"error",message:msg}));
}



var channels={
   'default': []
};
var joinChannel=function(connection,channel){
   if(!channels[channel]){
      channels[channel]={
         users:{},
         name:channel
      }
   }
   channels[channel][users][connection.user.uuid]= user;
   return channels[channel];
}
wss.on('connection', function (connection){
   connections.push(connection);
   connection.on('message', function (message) {
      console.log("on message "+message);
      var data;
      try {
         data = JSON.parse(message);
      } catch (e) {
         console.log("Invalid JSON");
         data = {};
      }
      switch (data.type) {
         case "login":
            db.get_user_cols(data.uuid,['uuid','username']).then(user=>{
               connection.user = user;
               connection.channel = data.channel || "default";
               var channelJoined=joinChannel(connection, connection.channel);
               sendTo(connection, {
                  type: "login",
                  success: true,
                  channelJoined: channelJoined.name,
                  users: Object.values(channelJoined.users)
               });
            }).catch(err=>{
               sendError(connection,"get user failed");
            })
            break;
         case "offer":
            const offerToChannel = data.channel;
            if(!channels[offerToChannel]){
               sendError(connection,"Channel doesn't exist");
            }
            channels[offerToChannel].users.forEach((userConn)=>{
               sendTo(userConn,{
                  type:"offer",
                  offer: data.offer,
                  channel: offerToChannel,
                  caller_id: connection.uuid
               })
            })
            break;
         case "answer":
            console.log("Sending answer to: ", data.uuid);
            var otherConnection  = channels[data.channel][data.uuid];
            if(!otherConnection){
               sendError(connection,"Other user not found/left.l");
               return;
            }
            sendTo(otherConnection,{ type: "answer",answer: data.answer}) 
            break;
         case "candidate":
            console.log("candidate received");
            console.log(data.candidate);
            channel = connection.channel;
            Object.keys(channels[channel]).forEach(otherUuid=>{
               if(otherUuid!=connection.uuid){
                  const otherConn = channels[channel][otherUuid].connection;
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
               message: "Command no found: " + data.type
            });

            break;
      }
      connection.on("close", function () {
         if (connection.uuid) {
            delete users[connection.uuid];
            if (connection.otheruuid) {
               console.log("Disconnecting from ", connection.otheruuid);
               var conn = users[connection.otheruuid];
               conn.otheruuid = null;
               if (conn != null) {
                  sendTo(conn, {
                     type: "leave"
                  });
               }
            }
         }
      });
     // console.log("Got message from a user:", message);
   });
   //sendTo(connection,{type:"connected"});
});
