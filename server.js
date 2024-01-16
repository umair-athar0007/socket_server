const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");

var cors = require("cors");
app.use(cors());
const io = socket(server, {
  path: "/webrtc",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// app.get('/', (req, res) => res.send('Hello World!!!!!'))

//https://expressjs.com/en/guide/writing-middleware.html
// app.use(express.static(__dirname + "/build"));

// app.get("/", (req, res, next) => {
//   res.sendFile(__dirname + "/build/index.html");
// });

// keep a reference of all socket connections
let connectedPeers = new Map();
app.get("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.send("This is WebRtc Server");
});

io.on("connection", (socket) => {
  console.log(socket.id);
  socket.emit("connection-success", { success: socket.id });

  connectedPeers.set(socket.id, socket);

  socket.on("disconnect", () => {
    console.log("disconnected");
    connectedPeers.delete(socket.id);
  });

  socket.on("offerOrAnswer", (data) => {
    // send to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload.type);
        socket.emit("offerOrAnswer", data.payload);
      }
    }
  });

  socket.on("candidate", (data) => {
    // send candidate to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload);
        socket.emit("candidate", data.payload);
      }
    }
  });
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Example app listening on port 8080!`));
