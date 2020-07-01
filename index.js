const express = require("express");
const bodyParser = require("body-parser");
const Pusher = require("pusher");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io").listen(server);
const port = 4000;

const pusherConfig = require("./pusher.json"); // (1)
const pusherClient = new Pusher(pusherConfig);

app.use(bodyParser.json());

io.on("connection", socket => {
  console.log("a user connected :D");
  socket.on("chat message", msg => {
    console.log(msg);
    socket.emit("chat message", msg);
  });
});

app.get('/',function(req,res){
  res.send("HELLO WORLD")
})

app.put("/users/:name", function (req, res) {
  // (3)
  console.log("User joined: " + req.params.name);
  pusherClient.trigger("chat_channel", "join", {
    name: req.params.name,
  });
  res.sendStatus(204);
});

app.delete("/users/:name", function (req, res) {
  // (4)
  console.log("User left: " + req.params.name);
  pusherClient.trigger("chat_channel", "part", {
    name: req.params.name,
  });
  res.sendStatus(204);
});

app.post("/users/:name/messages", function (req, res) {
  // (5)
  console.log("User " + req.params.name + " sent message: " + req.body.message);
  pusherClient.trigger("chat_channel", "message", {
    name: req.params.name,
    message: req.body.message,
  });
  res.sendStatus(204);
});

// app.listen(4000, function () {
//   // (6)
//   console.log("App listening on port 4000");
// });

server.listen(process.env.PORT || 5000, () => console.log("server running on port:" + port));
