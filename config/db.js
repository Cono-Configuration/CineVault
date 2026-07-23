let mysql = require("mysql2")

let connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})
connection.connect(function (err) {
    if (err) {
        console.error("Not connected");
        console.error(err);
        return;
    }
    console.log("Connected");
})
module.exports = connection;