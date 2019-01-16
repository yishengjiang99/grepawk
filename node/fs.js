const fs = require('fs');
var path = require("path");
var mime = require('mime-types');



const dirname = path.resolve(__dirname);
const base_path = path.dirname(dirname);
const data_path = base_path+ "/data";
console.log("base path is %s",base_path);



var rd=fs.createReadStream(data_path+"/wow_sample.csv")
var http = require('http');

http.createServer(function(req, res) {
  // The filename is simple the local directory and tacks on the requested url
  var filename = __dirname+req.url;


  var stat = fileSystem.statSync(req.url);
  res.append("getting file meta");



  res.writeHead(200,{
    'Content-Type':mime.contentType(filename),
    'Content-Length':stat.size,
    'Content-Disposition':'attachment; filename="'+filename+'"',
  });
  res.append("Starting file read");

  // This line opens the file as a readable stream
  var readStream = fs.createReadStream(filename);
  // This will wait until we know the readable stream is actually valid before piping
  readStream.on('open', function () {
    // This just pipes the read stream to the response object (which goes to the client)
    res.append("File stream open read");
    res.append('hello') 
   readStream.pipe(res);
  });

  // This catches any errors that happen while creating the readable stream (usually invalid names)
  readStream.on('error', function(err) {
    res.end(err);
  });
}).listen(8080);


