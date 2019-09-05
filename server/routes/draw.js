var express = require('express');
var router = express.Router();

router.get("/", function(req,res){
  res.render("canvas", {data:req.query.data});
});

module.exports = router;
