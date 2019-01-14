const fs = require('fs');
var path = require("path");
const dirname = path.resolve(__dirname);
const base_path = path.dirname(dirname);
const data_path = base_path+ "/data";
console.log("base path is %s",base_path);



var rd=fs.createReadStream(data_path+"/wow_sample.csv")
var http = require('http');

http.createServer(function(req, res) {
  // The filename is simple the local directory and tacks on the requested url
  var filename = __dirname+req.url;

  // This line opens the file as a readable stream
  var readStream = fs.createReadStream(filename);

  // This will wait until we know the readable stream is actually valid before piping
  readStream.on('open', function () {
    // This just pipes the read stream to the response object (which goes to the client)
    readStream.pipe(res);
  });

  // This catches any errors that happen while creating the readable stream (usually invalid names)
  readStream.on('error', function(err) {
    res.end(err);
  });
}).listen(8080);




/*
fs.readdir(data_path,{withFileTypes:true},(err,files)=>{
  console.log(files);
  files.forEach(function(file,index){
    console.log("%s, %s, %s,%s",index,file.isBlockDevice(),file.name,file.isDirectory())
  })
})

 
fs.open(data_path+"/wow_sample.csv",'r',(err,fd)=>{
  if(err) throw err;
  fs.fstat(fd,(err,stat)=>{
    console.log(`stats: ${JSON.stringify(stat)}`);
    if(err) throw err;
    fs.close(fd,(err)=>{
      if(err) throw err;
    });
  });
});
fs.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  fs.stat('/tmp/world', (err, stats) => {
    if (err) throw err;
    console.log(`stats: ${JSON.stringify(stats)}`);
  });

  console.log('renamed complete');
});
*/
