const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4000;

const app = express();

const server = http.createServer(app);

const io = socketIo(server);

let interval;

io.on("connection", (socket) => {
  //Client Connected
  console.log("New client connected");

  //Client Disconnected
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  //Recieved Message From Client
  socket.on("chat_message", msg => {
    console.log(msg);

    //Send Message To Cient
    socket.emit("FromAPI", msg);
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));