const { Pool, Client } = require('pg')
const Promise = require('promise')
const uuidv4 = require('uuid/v4');


exports.query = async function(query, args=[]){
    return new Promise((resolve,reject)=>{
      const pool = new Pool()
      pool.query(query, args, (err,res)=>{
        if (err) reject(err);
        else resolve(res.rows);
        pool.end();
        return;
      })
    })
  }

exports.new_user = async function(uuid){
  try{
    var user = await exports.query("insert into users (uuid, xp, points, cwd) values ($1, $2, $3, $4) returning *",
      [uuid,0,0,'/']);
    return user[0];
  }catch(err){
    console.log(err);
    throw err;
  }
}

exports.find_user = async function(uuid){
  try{
    var user = await exports.query("select * from users where uuid = $1", [uuid]);
    if (user && user[0]) return user[0];
    return await exports.new_user(uuid);
  }catch(err){
    console.log(err);
    throw err;
  }
}

var test = async function(){
   exports.new_user(uuidv4());
   exports.new_user(uuidv4());
   exports.new_user(uuidv4());
   exports.new_user(uuidv4());
   exports.new_user(uuidv4());
   exports.new_user(uuidv4());
   exports.new_user(uuidv4());
   var uids = await exports.query("select uuid from users limit 2");
   exports.find_user(uids[0].uuid).then(console.log);
}
test();
