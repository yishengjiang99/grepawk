const formidable = require('formidable')
var express = require('express');
var router = express.Router();
const db = require("../lib/db");
const xfs = require("../lib/xfs");
const path = require("path");
const request = require("request");
const mime = require("mime-types");
const { PassThrough } = require('stream')



router.get("/azure", async function (req, res) {
  const path = req.query.path || "data/file.txt";
  var parts = path.split("/");
  xfs.blob_get_content(parts[0], parts[1], function (err) {
    res.status(500).send(err.message);
  }, function (content) {
    res.end(content);
  });
});


router.get("/market/list", async function (req, res) {
  const tagQuery = req.query.tag;
  const titleQuery = req.query.title;
  const page = req.query.page || 0;
  const perPage = req.query.perPage || 10;
  const offset = page * perPage;
  const limit = perPage;
  const orderBy = req.query.orderBy || "created_at";
  const order = req.query.order || "desc";
  var rows = [];
  try {
    if (tagQuery) {
      rows = await db.query(
        "select content_listing.* \
         from content_listing join content_list_tags on content_listing.id=list_id \
         where tag = $1 order by $2 " + order + " limit $3 offset $4", [tagQuery, orderBy, limit, offset])
    } else if (titleQuery) {
      rows = await db.query(
        "select content_listing.* \
         from content_listing \
         where title ilike $1 order by $2 " + order + " limit $3 offset $4",
        ["%" + titleQuery + "%", orderBy, limit, offset]);
    } else {
      rows = await db.query(
        "select content_listing.* \
         from content_listing \
         order by $1 " + order + "  limit $2 offset $3",
        [orderBy, limit, offset]);
    }
    var nodes = [];
    var edges = {};
    nodes.push({
      id: 0,
      name: 'root'
    });
    edges[0] = [];
    rows.forEach((row, idx) => {
      nodes.push({
        id: nodes.length,
        name: row.title,
        modificationTime: row.updated_at || row.created_at,
        pricing: row.pricing
      });
      edges[0].push(idx);
    })
    res.json([nodes, edges]);
  } catch (e) {
    res.status(500).end(e.message);
  }
});
router.post("/azure/upload", function (req, res) {
  try{
    console.log("5");
    var path = req.query.basepath;
    const parts = path.split("/");
    if (parts.length < 2) {
      throw new Error("..");
    }
    console.log("6");

    const containerName = parts[1] || "data";
    const fileName = parts[2] || req.headers['x-file-name'] || "file.txt";
    const size = req.headers['x-file-size'];
    console.log("file", fileName, containerName,size);
    var pass = new PassThrough();
    res.write("upload started  for "+fileName);
    console.log('1');
    var speedsummary = xfs.blobClient.createBlockBlobFromStream(containerName, fileName, 
        pass,
        size,
        (err, result)=>{
          if(err) res.end(err.message);
          else res.write("sending "+fileName);
        }
   );
  
  
   speedsummary.on("progress", (e)=>{
     console.log(speedsummary);
     var prog = speedsummary.getCompletePercent();
     res.write(prog+"");
     if(prog>99) res.end();
   }) 
   req.pipe(pass);
   console.log('2');
  }catch(e){
    console.log("EERROR",e);
  }
});

router.get("/azure/list", async function (req, res) {
  let containerName = req.query.path || "";
  var nodes = [];
  var edges = {};
  nodes.push({
    id: 0,
    name: 'root'
  });
  edges[0] = [];
  let containers = await xfs.list_containers2();
  let idx;
  for (idx in containers) {
    let container = containers[idx];
    let parent = {
      name: container,
      id: nodes.length,
      fullPath: "az/" + container,
      isDirectory: true,
      type: "dir"
    }
    nodes.push(parent);
    edges[0].push(parent.id);
    edges[parent.id] = [];
    let files = await xfs.list_files(container);
    for (j in files) {
      let file = files[j];
      let node = {
        id: nodes.length,
        name: file.name,
        type: file.contentSettings.contentType,
        isDirectory: false,
        fullPath: "azure/" + parent.name + "/" + file.name
      }
      nodes.push(node);
      edges[parent.id].push(node.id);
    }
  }
  res.json([nodes, edges]);
});

router.post("/publish", function (req, res) {
  res.json({
    'status': 'ok'
  });
});

router.get("/", async function (req, res) {
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

module.exports = router;