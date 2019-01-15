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
    return file_name.startsWith(filename);
  });

  
  var output="";
  file_list.forEach(function(file_name,index){
    var fileobj = filename_to_path_map[file_name];
    if(fileobj['is_dir']){
      output+="<span style='color:blue'><b>"+file_name+"</b></span><br>";
    }else{
      output+="<span style='color:white'>"+file_name+"</span><br>";
    }
  });
  return output;
}

app.get('/ls', function(req, res){
  filename=req.query.msg;
  res.header('Content-type','application/json');
  res.header('Charset','utf8');
  var ls_output = ls(filename);
  var obj={
    output:ls_output,
    hints:Object.keys(filename_to_path_map)  
  };
  res.send(req.query.callback + '('+ JSON.stringify(obj) + ');');
});


// app.get('/stream/',function(req,res){
  
// })

app.listen(3000);
