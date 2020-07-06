const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const port = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const Api = require("./routes/api");

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use("/api", Api);

app.get("/", function (req, res) {
  res.send("HELLO WORLD");
});

//SOCKET IO CONFIGURATION
io.on("connection", (socket) => {
  console.log("Socket Id:" + socket.id);

  //Client Disconnected
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });

  //Subscribe To Company
  socket.on("subscribe", (roomName) => {
    console.log(roomName);
    socket.join(roomName);
    socket.emit('socket-id', socket.id)
  });

  //Send Message Listener
  socket.on("send-message", (messageData) => {
    console.log(messageData);
    io.sockets
      .in(messageData.reciever)
      .emit("universal-message", messageData);
  });

  //If user is typing
  socket.on("user-typing", (data) => {
    console.log("USER TYPING", data);
    if (data.isTyping) {
      socket.emit("FromAPI", `${data.userName} is typing`);
    }
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
