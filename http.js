const express = require('express')
const app = express()
const httpport = 8080
const db = require("./lib/db");
const xfs = require("./lib/xfs");
const path = require("path");
const request = require('request');
const formidable = require('formidable')

var admin = require("./routes/admin");



app.set('view engine', 'ejs');
var bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/file/edit", function (req, res, next) {
  if(!req.query.url){
    res.status(400).send("...");
    res.end();
  }
  filename = path.basename(decodeURIComponent(req.query.url));
  mode = xfs.autoImplementedMode(filename);
 console.log(filename, mode);
  request(req.query.url, (err,resp,body)=>{
    if(err){
      res.status(500).send(err.message);
    }
    data={
      url: req.query.url,
      text: body,
      mode:mode,
      context: req.query.context
    }
    res.render("editor",data);

  })
});


app.post("/file/edit", function (req, res, next) {
  var context= req.headers['x-context'];
  var t = context.split("/");
  if(t.length<2){
    res.status(400).send("invalid context header");
    res.end();
  }
  var containerName = t[0];
  var blobName = t[1];

  console.log("ddd");
  new formidable.IncomingForm().parse(req, (err, fields) => {
    if(err){
      console.log(err);
      res.status(400).send("invalid body");
      res.end();
    }
    console.log(fields.text);
    xfs.edit_file(containerName,blobName,fields.text).then(function(result){
      console.log(result);
      res.end("ok");
    }).catch(err=>{
      console.log(error);
      res.status(400).send(err.message);
      res.end("bad");
    })
  });

});

app.post('/files/upload', xfs.upload_handler);

app.use("/admin", admin);
app.use('/', express.static('public'))







app.listen(httpport, () => console.log(`Example app listening on port ${httpport}!`))
