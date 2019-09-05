require('dotenv').config()
const youtube_api_key = process.env.GOOGLE_SEARCH_KEY;
console.log(youtube_api_key);
const {exec} = require("child_process");
function curl_GET(url, data_str){
  return new Promise(function(resolve,reject){
    var cmd=`curl -G -d "${data_str}" ${url} --referer "https://grepawk.com"`;
    console.log("requestings "+cmd);
    exec(cmd, function (error, stdout, stderr) {
    //  console.log(stdout);
      if(error) reject(error);
      else resolve(stdout);
    });
  });
}


function parse_youtube_results(data){
  //console.log(data);
  data = JSON.parse(data);
  return new Promise(function(resolve,reject){
    if(!data || !data.pageInfo || !data.items){
      reject("Unexpected data");
    }else{
      var rows=[];
      data.items.forEach((row)=>{
        if(!row || !row['id']){
          console.error("wtf");
        }else{        
          rows.push({
            'thumbnail':row.snippet.thumbnails && row.snippet.thumbnails.default ? row.snippet.thumbnails.default['url'] : "",
            'title': row.snippet.title,
            'description':row.snippet.description,
            'opts':[{cmd:`watch ${row['id']['videoId']}`, desc:"watch"}, {cmd:`audio ${row['id']['videoId']}`, desc:"Download Audio"}]
          })
        }
      })
      var headers=['thumbnail','title','description','opts'];

      resolve({'headers':headers,'rows':rows, 'nextPage': data.nextPageToken});
    }
  })
}

module.exports = {
  find_youtube: function(keyword,perPage,pageToken){
    perPage=perPage||25;
    pageToken=pageToken||"";
    var url = "https://www.googleapis.com/youtube/v3/search";
    var data_string = `type=video&part=snippet&maxResults=${perPage}&q=${keyword}&key=`+youtube_api_key;
    if(pageToken){
      data_string+=`&pageToken=${pageToken}`;
    }
    return curl_GET(url,data_string).then(parse_youtube_results);
  }
};


