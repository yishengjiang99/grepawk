async function startServer(port) {
  const app = require("./server/http.js");
  const server = require("http").createServer(app);
  const webSocketService = require("./server/ws.js");
  const iceServer = require("./server/ice.js").iceServer;
  const upgradeRoutes = {
    "/": webSocketService,
    "/ice": iceServer,
  };
  server.on("upgrade", function upgrade(request, sock, head) {
    if (!upgradeRoutes[request.url]) return;
    webSocketService.handleUpgrade(
      request,
      sock,
      head,
      function done(wsclient) {
        upgradeRoutes[request.url].emit("connection", wsclient, request);
      }
    );
  });
  return new Promise((resolve, reject) => {
    server.on("listening", () => resolve(server));
    server.on("error", reject);
    server.listen(port);
  });
}
module.exports = { startServer };
