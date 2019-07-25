const db = require("./lib/db");

var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({
   port: 9090
});

function sendTo(connection, message) {
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
               user.channel ='default';
               users[user.uuid]=user;
               connection.uuid = user.uuid;
               sendTo(connection, {
                  type: "login",
                  success: true
               });
               channels['default'][user.uuid]=user;
            })
            break;
         case "join":
            const uuid = connection.uuid;
            user = users[uuid];
            if(channels[user.channel] && channels[user.channel][user.uuid]) {
               delete channels[user.channel][user.uuid];
             }
            user.channel = data.channel;
            if(!channels[data.channel]){
               channels[data.channel]={};
            }
            channels[data.channel][user.uuid] = user;
            console.log("data channels");
            console.log(channels[data.channel]);
            Object.keys(channels[data.channel]).forEach(otherUuid=>{
               console.log("other uuid ", otherUuid);
               if(otherUuid!==user.uuid){
                  const otherConn = channels[data.channel][otherUuid].connection;
                  console.log("othercdonn",otherConn);
                  sendTo(otherConn, {
                     type: "offer",
                     offer: data.offer,
                     uuid: uuid,
                     username: user.username
                  });
               }
            })
            break;
         case "answer":
            console.log("Sending answer to: ", data.uuid);
            //for ex. UserB answers UserA 
            var conn = users[data.uuid];
            if (conn != null) {
               sendTo(conn, {
                  type: "answer",
                  answer: data.answer
               });
            }
            break;
         case "candidate":
            console.log("Sending candidate to:", data.uuid);
            var conn = users[data.uuid];
            if (conn != null) {
               sendTo(conn, {
                  type: "candidate",
                  candidate: data.candidate
               });
            }
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
      console.log("Got message from a user:", message);
   });
   //sendTo(connection,{type:"connected"});
});
