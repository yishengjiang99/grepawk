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
var connections = {};

function generateUUID() { // Public Domain/MIT
   return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

}

wss.on('connection', function (connection){
   connection.uuid = generateUUID();
   connections[connection.uuid] = connection;
   connection.on('message', function (message) {
      const data = JSON.parse(message);
      const to_connection = data.to_uuid ? connections[data.to_uuid] : null;
      console.log(data.type);
      switch (data.type) {//
         case 'offer':
         case 'answer':
         case 'candidate':
            console.log("to uuid",data.to_uuid);
            if (to_connection){
               sendTo(to_connection, data); 
            }else{
             // sendError(connection,"to_uuid missing");   
            }
            break;
         case 'register_stream':
            if(!data.channel){
               sendError(connection, "channel is required");
               return;
            }
            const channelName = data.channel;

            broadcasts[channelName] = {
              name: channelName,
              host_uuid: connection.uuid,
              offers: [],
              receivers:[]
            }
 
            if(data.offer) broadcasts[channelName].offers.push(data.offer);
            sendTo(connection,{
               ok:true
            })
            console.log(broadcasts);
            console.log(Object.keys(connections));
         break;

         case 'watch_stream':
            if(!data.channel){
               sendError(connection, "channel name not attached");
               return;
            }
            if(!broadcasts[data.channel]){
               sendError(connection, "channel not streaming");
               return;
            }
            if(broadcasts[data.channel].offers.length==0){
               sendError(connection, "channel busy");
               return;
            }
            
            console.log(broadcasts);

            console.log(Object.keys(connections));

            sendTo(connection, {
               type:"offer",
               host_uuid: broadcasts[data.channel].host_uuid,
               offer: broadcasts[data.channel].offers.pop()
            });
            let hostConnection = connections[broadcasts[data.channel].host_uuid];
            sendTo(hostConnection, {
               type: "user_joined",
               uuid: connection.uuid
            })

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
