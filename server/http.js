require('dotenv').config();
const express = require('express')
const app = express()
const httpport = 8080
const db = require("./lib/db");
const xfs = require("./lib/xfs");
const path = require("path");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
  next();
});


const request = require('request');
const formidable = require('formidable')



const admin = require("./routes/admin");
const bt = require("./routes/bt");
const queue = require("./routes/queue");
const bodyParser = require('body-parser');
const file = require("./routes/file");
const api = require("./routes/api");
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.use("/admin", admin);
app.use("/bt", bt);
app.use("/lib", express.static("lib"));
app.use("/rct", express.static("reactUI/build/"));
app.use("/queue", queue);
app.use("/file", file);
app.use("/api/files", file);
app.use("/api/", api);

const video = require("./routes/video");
app.use("/video",video); 

const draw = require("./routes/draw");
app.use("/draw",draw);



app.post("/data", async (req, res) => {
  try {
    const data = req.body;
    const type = req.header("x-data-type");
    switch (type) {
      case 'pageInfo':
        await db.insertTable("node", {
          xpath: data.url,
          data: data
        });
        break;
      case 'link':
        const meta = {
          text: data.text
        };
        await db.insertTable("link", {
          from_node: data.from,
          to_node: data.to,
          meta: meta
        });
        break;
      default:
        break;

    }
    res.end("ok");

  } catch (e) {
    res.end("..");
  }
});

app.get("/", async function (req, res) {
  var user = null;
  if (req.query.uuid) { //access token
    user = await db.get_user(req.query.uuid);
  }
  res.render("index", {
    user: user
  });
})


app.get("/oauth/reddit", function (req, res) {
  var url = "https://www.reddit.com/api/v1/authorize";
  url += "?client_id=" + process.env.REDDIT_CLIENT_ID;
  url += "&redirect_uri=" + process.env.HOSTNAME + "/cb/reddit";
  url += "&response_type=code&duration=permanent";
  url += "&scope=" + (req.query.scope || "read");
  url += "&state=" + req.query.uuid;
  res.redirect(url);
});

app.get("/cb/reddit", function (req, res) {
  if (!req.query.code) {
    res.status(400).end("no code");
    return;
  }
  var body = {
    code: req.query.code,
    redirect_uri: process.env.HOSTNAME + "/cb/reddit",
    grant_type: 'authorization_code'
  }
  var auth_str = Buffer.from(process.env.REDDIT_CLIENT_ID + ":" + process.env.REDDIT_CLIENT_SECRET).toString("base64");
  const options = {
    url: "https://www.reddit.com/api/v1/access_token",
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth_str,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    formData: body
  };

  request(options, (err, result, ret) => {
    if (err) {

      res.end("ret:" + err.message);
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

app.get("/cb", function (req, res) {
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
    if (response.access_token) {
      const url = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + response.access_token;
      console.log(url);

      request.get(url, async (err, resp, result) => {
        if (err) {
          res.redirect("/500.html");
        } else {
          const userInfo = JSON.parse(result);
          const user = await db.get_oauth_user(userInfo);
          res.redirect("/?uuid=" + user.uuid);
        }

      })
    } else {

      res.end("failed");
    }
  })
})



app.use('/', express.static('public'))




app.listen(httpport, () => console.log(`Example app listening on port ${httpport}!`))
