var express = require('express');
var app = express();


var fs = require('fs');
var path = require('path');




const dirname = path.resolve(__dirname);
const base_path = path.dirname(dirname);
const data_path = base_path+ "/data/";
const bin_path = base_path + "/bin/";
const storage_path = base_path + "/storage/app/";



// List all files in a directory in Node.js recursively in a synchronous fashion
var walkSync = function(dir, filelist) {
  var fs = fs || require('fs'),
      files = fs.readdirSync(dir);

  filelist = filelist || [];
  files.forEach(function(file) {
    var stat = fs.statSync(dir + file);
    if (stat.isDirectory()) {
      filelist = walkSync(dir + file + '/', filelist);
      filelist.push({'path':dir,'is_dir':true, 'stat':stat,'size':stat.size,'filename':file,'created':stat.birthtimeMs,'updated':stat.atimeMs});

    }
    else {
      filelist.push({'path':dir+file,'is_dir':false, 'stat':stat,'size':stat.size,'filename':file,'created':stat.birthtimeMs,'updated':stat.atimeMs});
    }
  });
  return filelist;
}

var fs_cache=[];
fs_cache=walkSync(data_path,fs_cache);
fs_cache=walkSync(storage_path,fs_cache);
fs_cache=walkSync(bin_path,fs_cache);

var filename_to_path_map={};

fs_cache.forEach(function(file){
  filename= file.filename in filename_to_path_map ? file.filename+".2" : file.filename;
  filename_to_path_map[filename]=file;
});


console.log(fs_cache);
console.log(filename_to_path_map);

var ls=function(filename){

  var file_list = Object.keys(filename_to_path_map).filter(function(file_name,index){
    return file_name.toLowerCase().indexOf(filename)>-1;
  });
  console.log("matched file");
  console.log(file_list);
  return file_list;

}

var ls_output=function(file_list){
  var retstr="";
  file_list.forEach(function(file_name,index){
    var fileobj = filename_to_path_map[file_name];
    if(fileobj['is_dir']){
      retstr+="<span style='color:blue;margin-right:20px'><b>"+file_name+"</b></span>";
    }else{
      retstr+="<span style='color:white'>"+file_name+"</span><br>";
    }
  });
  return retstr;
}

var send_jsonp_output = function(outputstr,req,res){
  var obj={
	output:outputstr
 }
  res.send(req.query.callback || 'callback' + '('+ JSON.stringify(obj) + ');');
}

app.get('/cat',function(req,res){
  filename=req.query.msg || "";
  if(!filename) res.end("usage: cat {filename}");
  if(!filename_to_path_map[filename]) res.end(filename+" not found");

	var os_path = filename_to_path_map[filename].path.
	  
  res.writeHead(200,{
    	'Content-Type':mime.contentType(filename),
    	'Content-Length':stat.size,
  	});
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
  res.writeHead(200,{
    'Content-Type':mime.contentType(filename),
    'Content-Length':stat.size,
  });
//  res.append("Starting file read");
});
app.get('/ls', function(req, res){
  filename=req.query.msg || "";
  console.log("/ls?msg="+filename);
 
  res.header('Content-type','application/json');
  res.header('Charset','utf8');

//  send_jsonp_output('start',req,res); 

  var ls_list = ls(filename);
  var ls_outputstr = ls_output(ls_list);
  //send_jsonp_output('found '+ls_list.length,req,res);

  var obj={
    output:ls_outputstr, 
    hints:Object.keys(filename_to_path_map)  
  };
  res.send(req.query.callback + '('+ JSON.stringify(obj) + ');');
});


// app.get('/stream/',function(req,res){
  
// })

app.listen(3000);
