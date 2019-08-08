const express = require('express')
const app = express()
const httpport = 8080
const db = require("./lib/db");
const xfs = require("./lib/xfs");
const path = require("path");
const request = require('request');
const formidable = require('formidable')

var admin = require("./routes/admin");
var bt = require("./routes/bt");
var queue = require("./routes/queue");
var bodyParser = require('body-parser');
app.use(bodyParser.json());



app.set('view engine', 'ejs');

app.use("/admin", admin);
app.use("/bt", bt);
app.use("/lib", express.static("lib"));
app.use("/queue", queue);




app.post("/data",(req,res)=>{
  res.end("ok");
});
app.get("/", async function(req,res){
  var user = null;
  if(req.query.uuid){ //access token
    user = await db.get_user(req.query.uuid);
  }
  res.render("index",{user:user});
})


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/file/edit", function (req, res, next) {

  if (req.query.mode == 'new') {
    var filename = req.query.filename;
    var fileMode = xfs.autoImplementedMode(filename);

    var containerName = xfs.get_container_name(req.query.cwp);

    context = containerName + "/" + filename;
    data = {
      text: "",
      mode: fileMode,
      context: context
    }
    res.render("editor", data);
  } else {
    if (!req.query.url) {
      res.status(400).send("...");
      res.end();
      return;
    }
    var filename = path.basename(decodeURIComponent(req.query.url));
    var mode = xfs.autoImplementedMode(filename);
    request(req.query.url, (err, resp, body) => {
      if (err) {
        res.status(500).send(err.message);
      }
      data = {
        url: req.query.url,
        text: body,
        mode: mode,
        context: req.query.context
      }
      res.render("editor", data);

    })
  }

});

app.post("/file/edit", function (req, res, next) {
  var context = req.headers['x-context'];
  var t = context.split("/");
  if (t.length < 2) {
    res.status(400).send("invalid context header");
    res.end();
  }
  var containerName = t[0];
  var blobName = t[1];
  new formidable.IncomingForm().parse(req, (err, fields) => {
    if (err) {
      console.log(err);
      res.status(400).send("invalid body");
      res.end();
    }
    console.log(fields.text);
    xfs.edit_file(containerName, blobName, fields.text).then(function (result) {
      console.log(result);
      res.end("ok");
    }).catch(err => {
      console.log(error);
      res.status(400).send(err.message);
      res.end("bad");
    })
  });

});

app.post('/files/upload', xfs.upload_handler);



app.get("/oauth/reddit", function (req,res){
  var url ="https://www.reddit.com/api/v1/authorize";
  url += "?client_id=" + process.env.REDDIT_CLIENT_ID;
  url += "&redirect_uri=" + process.env.HOSTNAME + "/cb/reddit";
  url += "&response_type=code&duration=permanent";
  url += "&scope=" + (req.query.scope || "read");
  url +="&state=" + req.query.uuid;
  res.redirect(url);
});

app.get("/cb/reddit", function(req,res){
  if(!req.query.code){
    res.status(400).end("no code");
    return;
  }
  var body = {
    code: req.query.code,
    redirect_uri: process.env.HOSTNAME + "/cb/reddit",
    grant_type: 'authorization_code'
  }
  var auth_str = Buffer.from(process.env.REDDIT_CLIENT_ID+":"+process.env.REDDIT_CLIENT_SECRET).toString("base64");
  const options = {
    url: "https://www.reddit.com/api/v1/access_token",
    method: 'POST',
    headers: {
      'Authorization': 'Basic '+auth_str,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    formData: body
  };

  request(options, (err, result,ret)=>{
	if(err) {

		res.end("ret:"+err.message);    
	}
	res.end(ret);
  });
});

app.get("/google_login", function (req, res) {
  var url = 'https://accounts.google.com/o/oauth2/v2/auth';
  url += "?client_id=" + process.env.GOOGLE_CLIENT_ID;
  url += "&redirect_uri=" + process.env.HOSTNAME + "/stdin";
  url += "&response_type=code";
  url += "&scope=" + (req.query.scope || "email profile openid");
  // url+="&state=" + req.cookies.uuid;
  url += "&login_hint=" + encodeURIComponent("twich prime");
  console.log(url);

  res.redirect(url);
});
const url = require('url')

app.get("/cb", function(req,res){
  res.status(200).end("welcome");
});
app.get("/stdin", function (req, res) {
  var body = {
    code: req.query.code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.HOSTNAME + "/stdin",
    grant_type: 'authorization_code'
  }

  const options = {
    url: "https://www.googleapis.com//oauth2/v4/token",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    formData: body
  };

  request.post(options, (err, httpResponse, body) => {
    const response = JSON.parse(body);
    if(response.access_token){
      const url = "https://www.googleapis.com/oauth2/v1/userinfo?access_token="+response.access_token;
     console.log(url);

      request.get(url, async (err,resp,result)=>{
        if(err){
          res.redirect("/500.html");
        }else{
          const userInfo = JSON.parse(result);
          const user = await db.get_oauth_user(userInfo);
          res.redirect("/?uuid="+user.uuid);
        }

      })
    }else{
		
	res.end("failed");
    }
  })
})



app.use('/', express.static('public'))




app.listen(httpport, () => console.log(`Example app listening on port ${httpport}!`))
