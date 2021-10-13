const { Client } = require("pg");
require("dotenv").config();
console.log(process.env.DATA_URL);
const client = new Client({
  connectionString: process.env.DATA_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
function query(sql,arr,)
client.connect();
client.query(`\dt+`, (err, res) => {
  console.log(err, res);
  client.end();
});
