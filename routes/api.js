const express = require("express");
const bodyParser = require("body-parser");
const api = express.Router();
const sql = require("mssql");

api.post("/MakeConnection", (req, res) => {
  console.log(req.body);
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
    database: "LMSLicenseStore",
  };
  var today = new Date();
  var time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  console.log(dbConfig);
  var Query =
    "if not exists(select * from[cmatrix_connections] where[ccon_connection_id] = @ConnectionID)";
  Query += " begin ";
  Query +=
    "insert into cmatrix_connections (ccon_cmp_key, ccon_usr_key, ccon_connection_id, conn_time, con_grp_name) values(@CompanyID,@UserID,@ConnectionID,@ConnectionTime,@GroupName)";
  Query += " end ";
  console.log(Query);
  var connection = new sql.ConnectionPool(dbConfig, function (err) {
    var r = new sql.Request(connection);
    r.input("UserID", sql.VarChar, req.body.UserID),
      r.input("CompanyID", sql.VarChar, req.body.CompanyID),
      r.input("ConnectionTime", sql.VarChar, time),
      r.input("ConnectionID", sql.VarChar, req.body.ConnectionID),
      r.input("GroupName", sql.VarChar, req.body.GroupName);
    r.multiple = true;
    r.query(Query, function (err, recordsets) {
      connection.close();
      if (err) console.error(err);
      else console.dir("SUCCESS", recordsets);
    });
  });
});

function CreateDbConnection(sqlConfig, callback) {
  let connectionFunc = null;
  if (sql.ConnectionPool) connectionFunc = sql.ConnectionPool;
  else connectionFunc = sql.Connection;
  let connection = new connectionFunc(sqlConfig, function (err) {
    if (err) {
      console.error("Error connecting to database: " + (err.message || err));
    } else {
      console.dir("Success", connection);
      callback(null, connection);
    }
  });
}
module.exports = api;
