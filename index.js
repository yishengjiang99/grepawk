require("dotenv").config();
require("./server.js").startServer(process.env.PORT || 3000);
