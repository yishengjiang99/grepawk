const express = require('express');
const app = express();
const key= process.env.apiKey || "5387ffaf015e40f6a12d782172f88fa9";
const Promise = require("promise");

const httpport = 8080;
const AI_URL = 'https://api.clarifai.com/v2/models/bd367be194cf45149e75f01d59f77ba7/outputs';
const {
  exec
} = require("child_process");

var dp = {};


function isPie(imgUrl) {
  return new Promise((resolve, reject) => {
    if (typeof dp[imgUrl] !== 'undefined') resolve(dp[imgUrl]);
    
    const input = {
      inputs: [{
        data: {
          image: {
            url: imgUrl
          }
        }
      }]
    };

    exec(`curl -X POST -H 'Authorization: Key ${key}' \
    -H 'Content-Type: application/json' -d '${JSON.stringify(input)}' ${AI_URL}`,
      (err, stdout, stderr) => {
        if (err) throw err;
        const json = JSON.parse(stdout);
        const data = json.outputs[0].data.concepts;
        for (let i = 0; i < data.length; i++) {
          const d = data[i];
          console.log(d.name);
          if (d.name === 'pie') {
            dp[imgUrl] = true;
            console.log("IS PIE");
            resolve(true);
            return;
          }
        }
        dp[imgUrl] = false;
        resolve(false);
      }); 
    }) 
  }


  app.get("/", (req, res) => {
    const imgUrl = req.query.img;
    isPie(imgUrl).then(result=>{
      res.json({isPie:result})
    })
  });

  app.get("/ui", (req, res) => {
    res.sendFile(__dirname + "/test.html");
  });

  app.listen(httpport, () => console.log('server up'));