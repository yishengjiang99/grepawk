require('dotenv').config()

const youtube_api_key = process.env.GOOGLE_API_KEY;
const {exec} = require("child_process");


function curl_GET(url, data_str){
  return new Promise(function(resolve,reject){
    var cmd=`curl -G -d "${data_str}" ${url}`;
    console.log("requestings "+cmd);
    exec(cmd, function (error, stdout, stderr) {
      console.log(stdout);

      if(error) reject(error);
      else resolve(stdout);
    });
  });
}

var exports = module.exports = {
  find_youtube: function(keyword,socket,perPage,pageToken){
    perPage=perPage||25;
    pageToken=pageToken||"";

    var url = "https://www.googleapis.com/youtube/v3/search";
    var data_string = `part=snippet&maxResults=${perPage}&q=${keyword}&key=`+youtube_api_key;
    socket.emit("update", `curl -G -d ${data_string} ${url}`);

    if(pageToken){
      data_string+=`&pageToken=${pageToken}`;
    }
    console.log(data_string);
    return curl_GET(url,data_string);
  }
};


