require('dotenv').config()

const youtube_api_key = process.env.GOOGLE_API_KEY;
const {exec} = require("child_process");


function curl_GET(url, data_str){
  return new Promise(function(resolve,reject){
    var cmd=`curl -G -d "${data_str}" ${url}`;
    console.log("requestings "+cmd);
    exec(cmd, function (error, stdout, stderr) {
      if(error) reject(error);
      else resolve(stdout);
    });
  });
}

function parse_youtube_results(data){
  //console.log(data);

  data = JSON.parse(data);
  // console.log(data);
  return new Promise(function(resolve,reject){
    if(!data || !data.pageInfo || !data.items){
      reject("Unexpected data");
    }else{
      var rows=[];
      data.items.forEach((row)=>{
        console.log(row);
        if(!row || !row['id']){
          console.error(row);
         // return;
        }else{        
          rows.push({
            'thumbnail':row.snippet.thumbnails && row.snippet.thumbnails.default ? row.snippet.thumbnails.default['url'] : "",
            'title': row.snippet.title,
            'description':row.snippet.description,
            'links':[
              'onclick:watch '+row['id']['videoId']
            ]
          })
        }
      })
      var headers=['thumbnail','title','description','links'];
      resolve({'headers':headers,'rows':rows});
    }
  })
}

var exports = module.exports = {
  find_youtube: function(keyword,socket,perPage,pageToken){
    perPage=perPage||25;
    pageToken=pageToken||"";
    var url = "https://www.googleapis.com/youtube/v3/search";
    var data_string = `type=video&part=snippet&maxResults=${perPage}&q=${keyword}&key=`+youtube_api_key;
//    socket.emit("update", `curl -G -d ${data_string} ${url}`);
    if(pageToken){
      data_string+=`&pageToken=${pageToken}`;
    }
    console.log(data_string);
    return curl_GET(url,data_string).then(parse_youtube_results);
  }
};


