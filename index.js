const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const port = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const sql = require("mssql")

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
      BroadcastMessage(messageData.UserObj,messageData.familyCode)
  });

  //If user is typing
  socket.on("user-typing", (data) => {
    console.log("USER TYPING", data);
    if (data.isTyping) {
      socket.emit("FromAPI", `${data.userName} is typing`);
    }
  });
});

function BroadcastMessage(UserObj,familyCode){
  let buff = new Buffer.from(req.body.familyCode, "base64");
  let text = buff.toString("utf8");
  let splitColons = text.split(";");
  let username = splitColons[1].split("=");
  let password = splitColons[2].split("=");
  let database = splitColons[3].split(" = ");
  var dbConfig = {
    user: username[1],
    password: password[1],
    server: "58.65.129.101",
    database: database[1],
  };
  console.log(database[1])
  var today = new Date();
  today = today.toISOString().replace('T',' ').replace('Z','')
    console.log(today)
  var Query =
    "insert into cmatrix_received_sms (crsms_cmp_key,crsms_is_sms,crsms_to_user_name,crsms_is_read, crsms_body, crsms_text_body, crsms_from_user_key, crsms_from_user_name, crsms_to_user_key,crsms_created_date) values(@CompanyID,@isSMS,@ToUserName,@isRead,@Message,@Message,@FromID,@FromUserName,@ToUserID,@ConnectionTime)";
  var connection = new sql.ConnectionPool(dbConfig, function (err) {
    var r = new sql.Request(connection);
    r.input("CompanyID", sql.VarChar, req.body.UserObj.CompanyID),
      r.input("isSMS", sql.VarChar, false),
      r.input("ToUserName", sql.VarChar, req.body.UserObj.ToUsername),
      r.input("ToUserID", sql.VarChar, req.body.UserObj.ToId),
      r.input("FromUserName", sql.VarChar, req.body.UserObj.FromUserName),
      r.input("FromID", sql.VarChar, req.body.UserObj.FromId),
      r.input("isRead", sql.VarChar, req.body.UserObj.isRead),
      r.input("Message", sql.VarChar, req.body.UserObj.Message),
      r.input("ConnectionTime", sql.VarChar, today);
    r.multiple = true;
    r.query(Query, function (err, recordsets) {
      connection.close();
      if (err) console.error(err);
      else console.dir("SUCCESS", recordsets);
    });
  });
}


server.listen(port, () => console.log(`Listening on port ${port}`));
