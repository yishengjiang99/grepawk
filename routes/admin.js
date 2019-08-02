var express = require('express'),
bodyParser = require('body-parser');
var router = express.Router()
var db = require("../lib/db");
const { Client } = require('pg')



router.get('/', function (req, res) {
  res.render("admin");
})

router.get('/quests', async function (req, res) {
  const client = new Client()
  await client.connect();
  const dbres = await client.query("select * from quests");
 
  let headers = dbres.fields.map(f=>f.name);
  res.render("table",{headers: headers, rows:dbres.rows});
  client.end();
});

router.use(bodyParser.json());
router.post("/quests", async function(req, res){
  const id = req.body.id;
  if(!id){
    res.status(400);
    res.statusMessage="bad request";
    res.end();
    return;
  }
  db.updateTable("quests", id,req.body).then(result=>{
    res.status(200).send("update good");
  }).catch(err=>{
    res.status(500).send(err.message);
  })
})

router.put("/quests", async function(req, res){
  db.insertTable("quests",req.body).then(result=>{
    res.status(200).send("update good");
  }).catch(err=>{
    res.status(500).send(err.message);
  })
})
module.exports = router

