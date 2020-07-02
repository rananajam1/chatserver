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
  console.log(socket)
  //Client Connected
  console.log("New client connected");

  //Client Disconnected
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  //Recieved Message From Client
  socket.on("private-chat", data => {
    console.log(data);
    let response = [{_id: Math.random(323), createdAt: data.createdAt, text: `Reply from server ${data.message[0].text}`, user: {_id: 200}}]
    //Send Message To Cient
    socket.emit("FromAPI", {type:"Message", message:response});
  });

  //If user is typing
  socket.on('user-typing', data =>{
    console.log("USER TYPING",data)
    if(data.isTyping){
      socket.emit("FromAPI", `${data.userName} is typing`)
    }
  })
});

server.listen(port, () => console.log(`Listening on port ${port}`));