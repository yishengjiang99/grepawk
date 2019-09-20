const db = require("./lib/db");

var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({
   port: 9091
});

function sendTo(connection, message) {
   console.log("send msg ",message);
   connection.send(JSON.stringify(message));
}

function sendError(connection, msg) {
   console.log("send error ",msg);
   connection.send(JSON.stringify({
      type: "error",
      message: msg
   }));
}

var broadcasts = {}
var connections = {};
var nodes = [];
var node_edge_stats = {}; //hashmap of arrays with node idx being key


function generateUUID() { // Public Domain/MIT
   return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

wss.on('connection', function (connection) {
   connection.uuid = generateUUID();
   connections[connection.uuid] = connection;
   connection.on('message', function (message) {
      const data = JSON.parse(message);
      const to_connection = data.to_uuid ? connections[data.to_uuid] : null;
      console.log(data.type);
      switch (data.type) {
         case 'offer':
         case 'answer':
         case 'candidate':
            data.client_uuid = data.client_uuid || connection.uuid;
            console.log("to uuid", data.to_uuid);
            if (to_connection) {
               sendTo(to_connection, data);
            }
            break;
         case 'register_connection':
            if(data.offer){
              var node = {id: nodes.length, sdp: offer};
              nodes.push(node);
            }
         break;
         case 'register_stream':
            if (!data.channel) {
               sendError(connection, "channel is required");
               return;
            }
            const channelName = data.channel;
            broadcasts[channelName] = {
               name: channelName,
               host_uuid: connection.uuid,
               peer_connections: []
            }
            sendTo(connection, {
               type: "registered",
               host_uuid: connection.uuid
            });
            if(nodes.length){
              sendTo(connection,{
                 type:"available_nodes",
                 nodes: nodes
              });
            }
            console.log(broadcasts);
            break;

         case 'watch_stream':
            if (!data.channel) {
               sendError(connection, "channel name not attached");
               return;
            }
            if (!broadcasts[data.channel]) {
               sendError(connection, "channel not streaming");
               return;
            }
            var host_uuid = broadcasts[data.channel].host_uuid;
            var hostConnection = connections[host_uuid];
            sendTo(hostConnection, {
               type: "user_joined",
               client_uuid: connection.uuid
            })
            broadcasts[data.channel].peer_connections.push(connection.uuid);
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
