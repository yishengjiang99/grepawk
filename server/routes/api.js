var express = require('express');
var router = express.Router();
const db = require("../lib/db");

router.get("/checkin", async function(req, res){
  const uuid = req.headers['uuid'] || req.query.uuid;
  if(!uuid){
    res.status(400).end("uuid in header or query is required");
    return;
  }
  db.get_user(uuid,'123').then(user=>{
    res.json(user);
  })
} )

router.post("/listing", async function(req, res){
  const uuid = req.headers['uuid'] || req.body.uuid || "1234";
  const title = req.body.title; 
   if(!title) {
      res.status(400).end("title required");
      return;
   }
   const price = req.body.price && parseInt(req.body.price);
   if(!price || isNaN(price)) {
      res.status(400).end("price required and must be integer");
   }
   const tags = req.body.tags || [];
   const description = req.body.description || "";
  
  try{
   var rows = await db.query(
     "insert into content_listing \
      (title, description, pricing, author_uuid) \
      values ($1, $2, $3, $4) returning id", [title, description, price, uuid]);
   if(!rows || !rows[0]) throw new Error("insert failed to return ID");
   const listId = rows[0].id;
   tags.forEach(async (tag)=>{
     await db.query("insert into content_list_tags (list_id, tag) values ($1, $2)", [listId, tag]);
   })
   res.json({"status":"OK"});
  }catch(e){
    handleError(e,res);  
  }
});
router.get("/listing",async function(req,res){
  const tagQuery = req.query.tag;
  const titleQuery = req.query.title;
  const page = req.query.page || 0;
  const perPage = req.query.perPage || 100;
  const offset = page * perPage;
  const limit = perPage;
  const orderBy = req.query.orderBy || "created_at";
  const order = req.query.order || "desc";
  var rows=[];
  try{
    if(tagQuery){
      rows = await db.query(
        "select content_listing.* \
         from content_listing join content_list_tags on content_listing.id=list_id \
         where tag = $1 order by $2 "+order+" limit $3 offset $4", [tagQuery, orderBy, limit, offset])
    }else if(titleQuery){
      rows = await db.query(
        "select content_listing.* \
         from content_listing \
         where title ilike $1 order by $2 "+order+" limit $3 offset $4",  
         ["%"+titleQuery+"%", orderBy, limit, offset]);
    }else{
      rows = await db.query(
        "select content_listing.* \
         from content_listing \
         order by $2 "+order+"  limit $3 offset $4",  
         ["%"+titleQuery+"%", orderBy, limit,offset]);
    }
    res.json(rows);
  }catch(e){
    handleError(e, res);
  }
});

function handleError(e, response){
  response.status(500).end(e.message);
}

  
  module.exports=router;
  



