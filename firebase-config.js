var admin = require("firebase-admin");

var serviceAccount = require("./calimaticlmsapp-firebase-adminsdk-jkp58-76fac6b59d.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://calimaticlmsapp.firebaseio.com"
})

module.exports.admin = admin