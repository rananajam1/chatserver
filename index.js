const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4000;

const app = express();

const server = http.createServer(app);

const io = socketIo(server);


app.get('/',function(req,res){
  res.send("HELLO WORLD")
})

io.on("connection", (socket) => {
  //Client Connected
  console.log("New client connected");

  //Client Disconnected
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  //Recieved Message From Client
  socket.on("private-chat", data => {
    console.log(data);
    //Send Message To Cient
    socket.emit("FromAPI", "You have succesfully sent message to the API");
  });
  
  //Recieved Message From Client
  socket.on("typing", userName, IsTyping => {
    console.log(msg);
    //Send Message To Cient
    if(IsTyping){
      socket.emit("FromAPI", `${userName} is typing....`);
    }
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));