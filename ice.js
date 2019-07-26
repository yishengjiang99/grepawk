const db = require("./lib/db");

var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({
   port: 9090
});

function sendTo(connection, message) {
   console.log("****sending to "+connection.uuid+": "+message.type);
   connection.send(JSON.stringify(message));
}


var users={};
var channels={
   'default': {}
};

wss.on('connection', function (connection) {
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
            db.get_user(data.uuid).then(user=>{
               user.connection = connection;
               user.channel = data.channel;
               users[user.uuid]=user;
               connection.uuid = user.uuid;
               connection.channel = data.channel
               sendTo(connection, {
                  type: "login",
                  success: true
               });
               channels[data.channel][user.uuid]=user;
            })
            break;
         case "join":
            var uuid = connection.uuid;
            var channel = connection.channel;
            user = users[uuid];
            if(channels[channel] && channels[channel][user.uuid]) {
               delete channels[user.channel][user.uuid];
             }
            channel = data.channel;
            user.channel = data.channel;
            if(!channels[channel]){
               channels[channel]={};
            }
            channels[channel][uuid] = user;
            Object.keys(channels[channel]).forEach(otherUuid=>{
               console.log("other uuid ", otherUuid, " vs ",user.uuid);
               if(otherUuid!=user.uuid){
                  const otherConn = channels[data.channel][otherUuid].connection;
                  sendTo(otherConn, {
                     type: "offer",
                     offer: data.offer,
                     caller_id: uuid,
                     username: user.username
                  });
               }
            })
            break;
         case "answer":
            console.log("Sending answer to: ", data.uuid);
            //for ex. UserB answers UserA 
            var conn = users[data.uuid].connection;
            if (conn != null) {
               sendTo(conn, {
                  type: "answer",
                  answer: data.answer
               });
            }
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
