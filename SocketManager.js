const io = require("./index.js").io;


module.exports = function (socket) {

  console.log("Socket Id:" + socket.id);

  //Client Disconnected
  socket.on("disconnect", () => {
    console.log("Client disconnected",socket.id);
  });

  //Subscribe To Company
  socket.on("subscribe",(roomName) =>{
      console.log(roomName)
      socket.join(roomName)
  })

  //Send Message Listener 
  socket.on('send-message',(messageData)=>{
      console.log(messageData)
      io.sockets.in(messageData.reciever).emit('universal-message', messageData.message[0].text)
  })

  //If user is typing
  socket.on("user-typing", (data) => {
    console.log("USER TYPING", data);
    if (data.isTyping) {
      socket.emit("FromAPI", `${data.userName} is typing`);
    }
  });
};