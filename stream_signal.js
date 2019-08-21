const db = require("./lib/db");

var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({
   port: 9091
});

function sendTo(connection, message) {
   console.log("****sending to connection");
   connection.send(JSON.stringify(message));
}

function sendError(connection, msg) {
   connection.send(JSON.stringify({type:"error",message:msg}));
}

var broadcasts = {}
wss.on('connection', function (connection){
   connection.on('message', function (message) {
      const data = JSON.parse(message);
      switch (data.type) {
         case 'register_stream':
            if(!data.offer || !data.channel){
               sendError(connection, "offer and channel are required parameters");
               return;
            }
            console.log(data.offer);
            if(!data.offer.sdp){
               sendError(connection, "offer does not contain session descriptor");
               return;
            }
            const channelName = data.channel;
            broadcasts[channelName]={
              name: channelName,
              sdp: data.offer.sdp
            }
            sendTo(connection,{
               ok:true
            })
            console.log(broadcasts);
         break;
         case 'watch_stream':
            if(!data.channelName){
               sendError(connection, "channel name not attached");
               return;
            }
            
            if(!broadcasts[data.channelName]){
               sendError(connection, "channel not streaming");
            }

         break;
         case "candidate":
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

console.log("stream signal running on 9091");