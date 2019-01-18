var express = require('express');
var app = express();



var fs = require('fs');
var path = require('path');


const dirname = path.resolve(__dirname);
const base_path = path.dirname(dirname)+"/";
const data_path = base_path+ "/data/";
const bin_path = base_path + "/bin/";
const storage_path = base_path + "/storage/app/";
const logs_path = base_path + "/storage/logs/";


// List all files in a directory in Node.js recursively in a synchronous fashion
var walkSync = function(dir,filelist,level) {
  var fs = fs || require('fs'),
      files = fs.readdirSync(dir);
       
  level = level || 0;
  filelist = filelist || [];
  filename = path.basename(dir);
  filelist.push({'level':level,'is_dir':1, 'filename':filename,'path':dir});
  files.forEach(function(file) {
    var stat = fs.statSync(dir + file);
    if (stat.isDirectory()) {
      filelist = walkSync(dir + file + '/', filelist,level+1);
    //  filelist.push({'path':dir,'is_dir':true, 'size':stat.size,'filename':file,'created':stat.birthtimeMs,'updated':stat.atimeMs});
      filelist.push({'level':level+1,'filename':file,'path':dir+file,'is_dir':1,'size':stat.size,'created':new Date(stat.birthtimeMs),'updated':new Date(stat.atimeMs)});
    }
    else {
      filelist.push({'level':level+1,'filename':file,'path':dir+file,'is_dir':0,'size':stat.size,'created':new Date(stat.birthtimeMs),'updated':new Date(stat.atimeMs)});
    }
  });
  return filelist;
}

var fs_cache=[];
var g_filename_to_path_map;

var init=function(){
  if(g_filename_to_path_map) return g_filename_to_path_map;
  g_filename_to_path_map={};
  fs_cache=walkSync(base_path,fs_cache);

  fs_cache.forEach(function(file){
    filename= file.filename in g_filename_to_path_map ? file.filename+".2" : file.filename;
    console.log("adding "+filename);
    g_filename_to_path_map[filename]=file;
  });
  return g_filename_to_path_map;
}



// console.log(fs_cache);
// console.log(filename_to_path_map);

var ls=function(filename,max_level,res){

    
  filename=filename||"";
  max_level=max_level||10;
  filename_to_path_map=init();
  filename=filename.toLowerCase();
  var file_list=[];
  var max_level=max_level;

  Object.keys(filename_to_path_map).map(function(file_name,index){
    //res.write("\nchecking "+file_name+" against "+filename);
   // if(file_name.toLowerCase().indexOf(filename)>-1) res.write(file_name+" vs "+filename+"<br>\n");
    var _file=filename_to_path_map[file_name];
    if(!_file) return;
    if(_file.filename.indexOf(filename)>-1 || _file.path.indexOf(filename)>-1){
      // res.write("\n checkedd "+file_name+" against "+filename);
      // res.write("\n checkedd "+filename_to_path_map[file_name].level+" against "+max_level);
     // res.json(_file.level);
      //file_list.push(_file);
       //res.write("\n checking "+(max_level-_file.level)+" vs "+max_level);
       
      if(_file.level < max_level+1){
        file_list.push(file_name);
      }
    }

  });
  //res.end("..");
  //res.json(file_list);
  var file_list_objects=[];
  file_list.forEach(function(filename){
    var _file=filename_to_path_map[filename];
    _file['filename']=filename;
    _file['cmd']="download "+filename;
  
    file_list_objects.push(_file);
  })
  return file_list_objects;
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


const mime = require('mime-types');


app.get('/cat',function(req,res){
  filename_to_path_map=init();
  var format = req.query.format || 'jsonp';

  filename=req.query.msg || "";

  if(!filename) res.end("usage: cat {filename}");


  var _file = filename_to_path_map[filename];

  if (_file.is_dir) res.end("usage: cd {dirname");

  var os_path = _file.path;
  var spawn = require('child_process').spawn,
  cat = spawn("cat "+os_path,[]).on('error', function( err ){console.log(err) })
;
  res.send("data: starting "+os_path);

  cat.stdout.on("data", function (data) {
    res.send("data: ".data.toString());
  });
 res.send("data:");
});

app.get('/download',function(req,res){
  filename_to_path_map=init();
  var format = req.query.format || 'jsonp';



  filename=req.query.msg || "";


  if(!filename) res.end("usage: cat {filename}");


  var _file = filename_to_path_map[filename.toLowerCase()];

  if (_file.is_dir) res.end("usage: cd {dirname");
  
  var os_path = _file.path;
	
  //res.end(os_path)
  var readStream = fs.createReadStream(os_path);

  if(format=='cat'){

  }
  var mimeType = mime.lookup(os_path);
  res.writeHead(200,{
    'Content-Type':mimeType,
    'Content-Length':_file.size,
    'Content-Disposition':'attachment; filename="'+_file.filename+'"'
  });


  // This will wait until we know the readable stream is actually valid before piping
  readStream.on('open', function () {
    // This just pipes the read stream to the response object (which goes to the client)
   readStream.pipe(res);
  });

  // This catches any errors that happen while creating the readable stream (usually invalid names)
  readStream.on('error', function(err) {
    res.end(err);
  });
//  res.append("Starting file read");
});

app.get('/ls', function(req, res){
  filename=req.query.msg || "";
  
  console.log("/ls?msg="+filename);

 if(filename==""){
  ls_list= ls("",1,res);
 }else{
  ls_list=ls(filename,10,res);
 }
 // var ls_outputstr = ls_output(ls_list);
  var format = req.query.format || 'jsonp';

  var obj={
    table:{rows:ls_list,headers:['filename','cmd','level','is_dir','created','updated','path']}, 
    hints:Object.keys(filename_to_path_map)  
  };

  if(format=='json'){
      res.json(ls_list);
  }else if(format==='jsonp'){
    res.header('Content-type','application/json');
    res.header('Charset','utf8');
    
    res.send((req.query.callback || 'callback') + '('+ JSON.stringify(obj) + ');');
  }
});



app.listen(3000);

