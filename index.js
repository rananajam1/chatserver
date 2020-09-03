const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const port = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const sql = require("mssql");
const { admin } = require("./firebase-config");

const Api = require("./routes/api");
const { use } = require("./routes/api");

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

const notification_options = {
  priority: "high",
  timeToLive: 60 * 60 * 24,
};

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
    socket.emit("socket-id", socket.id);
  });

  //Send Message Listener
  socket.on("send-message", (messageData) => {
    console.log(messageData);
    io.sockets.in(messageData.reciever).emit("universal-message", messageData);
    io.sockets
      .in(messageData.reciever)
      .emit("new-message", messageData.message);
    BroadcastMessage(messageData.UserObj, messageData.familyCode, messageData);
    // getFirebaseTokens(guid,messageData.licenseCode)
  });

  //Update Read Status
  socket.on("update-messages", (data) => {
    console.log(data)
    UpdateMessages(data.From, data.To, data.familyCode);
  });

  //If user is typing
  socket.on("user-typing", (data) => {
    console.log("USER TYPING", data);
    if (data.isTyping) {
      socket.emit("FromAPI", `${data.userName} is typing`);
    }
  });
});

let configObject = {
  "data source": "",
  "user id": "",
  "password": "",
  "initial catalog": "",
  "port":""
};

function mapConnectionString(familyCode){
  let buff = new Buffer.from(familyCode, "base64");
  let text = buff.toString("utf8");
  console.log(text)
  let splitColons = text.split(";");
  Object.keys(configObject).map((keys) => {
    splitColons.filter((key) => {
      let splitted = key.split("=");
      splitted[0]=splitted[0].trim();
      if (keys.toLowerCase() === splitted[0].toLowerCase()) {
        let val;
        if(key.includes(',')){
          val=splitted[1];
          val=val.trim();
          let furtherSplit = val.split(",")
          val=furtherSplit[0]
          configObject["port"] = furtherSplit[1]
          configObject[keys] = val
        }
        else{
          val=splitted[1];
          val=val.trim();
          configObject[keys] = val
        }
      }
    });
  });
}

function BroadcastMessage(UserObj, familyCode, messageData) {
  mapConnectionString(familyCode)
  var dbConfig = {
    user: configObject["user id"],
    password: configObject["password"],
    server: configObject["data source"],
    database: configObject["initial catalog"],
    port:parseInt(configObject['port'])
  };
  console.log(dbConfig)
  var today = new Date();
  today = today.toISOString().replace("T", " ").replace("Z", "");
  console.log(today);
  var Query =
    "insert into cmatrix_received_sms (crsms_cmp_key,crsms_is_sms,crsms_to_user_name,crsms_is_read, crsms_body, crsms_text_body, crsms_from_user_key, crsms_from_user_name, crsms_to_user_key,crsms_created_date) values(@CompanyID,@isSMS,@ToUserName,@isRead,@Message,@Message,@FromID,@FromUserName,@ToUserID,@ConnectionTime)";
  var connection = new sql.ConnectionPool(dbConfig, function (err) {
    var r = new sql.Request(connection);
    r.input("CompanyID", sql.VarChar, UserObj.CompanyID),
      r.input("isSMS", sql.VarChar, false),
      r.input("ToUserName", sql.VarChar, UserObj.ToUsername),
      r.input("ToUserID", sql.VarChar, UserObj.ToId),
      r.input("FromUserName", sql.VarChar, UserObj.FromUserName),
      r.input("FromID", sql.VarChar, UserObj.FromId),
      r.input("isRead", sql.VarChar, UserObj.isRead),
      r.input("Message", sql.VarChar, UserObj.Message),
      r.input("ConnectionTime", sql.VarChar, today);
    r.multiple = true;
    r.query(Query, function (err, recordsets) {
      connection.close();
      if (err) console.error(err);
      else{
        console.log("Message Sent", recordsets);
        getUserGuID(messageData);
      }
    });
  });
}

function UpdateMessages(From, To, familyCode) {
  mapConnectionString(familyCode)
  var dbConfig = {
    user: configObject["user id"],
    password: configObject["password"],
    server: configObject["data source"],
    database: configObject["initial catalog"],
    port:parseInt(configObject['port'])
  };
  var today = new Date();
  today = today.toISOString().replace("T", " ").replace("Z", "");
  console.log(today);
  var Query =
    "update cmatrix_received_sms set crsms_is_read = 1 where crsms_is_read = 0 and crsms_from_user_key = @FromUser and crsms_to_user_key = @ToUser";
  var connection = new sql.ConnectionPool(dbConfig, function (err) {
    var r = new sql.Request(connection);
    r.input("ToUser", sql.VarChar, To),
      r.input("FromUser", sql.VarChar, From),
      (r.multiple = true);
    r.query(Query, function (err, recordsets) {
      connection.close();
      if (err) console.error(err);
      else console.log("Update read status", recordsets);
    });
  });
}

function getUserGuID(data) {
  mapConnectionString(data.familyCode)
  var dbConfig = {
    user: configObject["user id"],
    password: configObject["password"],
    server: configObject["data source"],
    database: configObject["initial catalog"],
    port:parseInt(configObject['port']),
  };
  console.log(dbConfig)
  var Query = "select [usr_guid] from cmatrix_user where [usr_key] = @userId";
  var connection = new sql.ConnectionPool(dbConfig, function (err) {
    var r = new sql.Request(connection);
    r.input("userId", sql.VarChar, data.UserObj.ToId), (r.multiple = true);
    r.query(Query, function (err, recordsets) {
      connection.close();
      if (err) console.error(err);
      else {
        console.log("Guid found",recordsets.recordset);
        if(recordsets.recordset.length > 0)
        getFirebaseTokens(recordsets.recordset[0].usr_guid, data);
      }
    });
  });
}

function getFirebaseTokens(guid, data) {
  mapConnectionString(data.licenseCode)
  var dbConfig = {
    user: configObject["user id"],
    password: configObject["password"],
    server: configObject["data source"],
    database: configObject["initial catalog"],
    port:parseInt(configObject['port'])
  };
  console.log(dbConfig)
  var Query =
    "select [clmsft_firebase_token] from clmssecure_firebase_token where [clmsft_user_guid] = @guid";
  var connection = new sql.ConnectionPool(dbConfig, function (err) {
    var r = new sql.Request(connection);
    r.input("guid", sql.VarChar, guid), (r.multiple = true);
    r.query(Query, function (err, recordsets) {
      connection.close();
      if (err) console.error(err);
      else {
        console.log("Firebase tokens found", recordsets);
        sendNotification(recordsets.recordset, data);
        // return recordsets.recordset[0].usr_guid;
      }
    });
  });
}

function sendNotification(devices, data) {
  const options = notification_options;
  Object.entries(devices).map(([keys, values]) => {
    const registrationToken = values.clmsft_firebase_token;
    const message = {
      data: {
        title: "New Message Received",
        senderRole: data.UserObj.FromRoleName,
      },
      notification: {
        title: "New Message Received",
        body: data.message[0].text,
      },
    };
    admin
      .messaging()
      .sendToDevice(registrationToken, message, options)
      .then((response) => {
        console.log("Notification Sent");
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

server.listen(port, () => console.log(`Listening on port ${port}`));
