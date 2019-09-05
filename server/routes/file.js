const formidable = require('formidable')
var express = require('express');
var router = express.Router();
const db = require("../lib/db");
const xfs = require("../lib/xfs");
const path = require("path");
const request=require("request");


router.get("/azure/list", async function(req, res){
  let containerName = req.query.path || "";
  var nodes = [];
  var edges = [];
  let containers = await xfs.list_containers2();
  let idx;
  for(idx in containers){
    let container = containers[idx];
    let parent  = {
      name: container,
      id: nodes.length,
      fullPath: container,
      isDirectory: true,
      type: "dir"
    }
    nodes.push(parent);
    edges[parent.id] = [];
    let files = await xfs.list_files(container);
    for(j in files){
      let file = files[j];
      let node = {
        id: nodes.length,
        name: file.name,
        type: file.contentSettings.contentType,
        isDirectory: false,
        fullPath: parent.name+"/"+file.name
      }
      nodes.push(node);
      edges[parent.id].push(node.id);
    }
  }
  res.json([nodes, edges]);
});

router.post("/publish", function(req,res){
  res.json({'status':'ok'});
});

router.get("/", async function(req, res){
  res.json(await db.query("select * from fs_graph where type='dir'"));
})

router.get("/edit", function (req, res, next) {
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
  
  router.post("/edit", function (req, res, next) {
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
  
  router.post('/upload', xfs.upload_handler);
  
  module.exports=router;
  



