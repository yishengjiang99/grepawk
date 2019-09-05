const formidable = require('formidable')
var express = require('express');
var router = express.Router();
const db = require("../lib/db");
const xfs = require("../lib/xfs");
const path = require("path");
const request=require("request");


router.get("/azure.json", async function(req, res){
  let containerName = req.query.path || "";
  var nodes = [];
  var edges = {};
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


