const net = require('net');
const fs = require('fs');
var path = require('path');
const dirname = path.resolve(__dirname);
const base_path = path.dirname(dirname)+"/";


const appDirectory = fs.realpathSync(process.cwd());

//post csv

var userProfiles={};
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
var g_filename_to_path_map=false;

var init=function(){//
  if(g_filename_to_path_map) return g_filename_to_path_map;
  g_filename_to_path_map={};
  //fs_cache=walkSync(data_path,fs_cache);
  fs_cache=walkSync(base_path,fs_cache);
  fs_cache.forEach(function(file){
    filename= file.filename in g_filename_to_path_map ? file.filename+".2" : file.filename;
    console.log("adding "+filename);
    g_filename_to_path_map[filename]=file;
  });
  return g_filename_to_path_map;
}

var ls=function(filename,max_level){
  filename=filename||"";
  max_level=max_level||10;

  filename_to_path_map=init();

  filename=filename.toLowerCase();

  var file_list=[];
  var max_level=max_level;
  Object.keys(filename_to_path_map).map(function(file_name,index){   

    var _file=filename_to_path_map[file_name];
    if(!_file) return;
    if(_file.filename.indexOf(filename)>-1 || _file.path.indexOf(filename)>-1){

      if(_file.level < max_level+1){
        file_list.push(file_name);
      }
    }
  })
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



init();
console.log("wrirting ls");
ls();

const server = net.createServer((socket) => {
  socket.write("Hello to file server!\n");
  socket.setEncoding("utf-8");

  var remote_address=socket.address().host;
  console.log("connection from "+remote_address);
  userProfiles[remote_address]={
    'profile':"aa"
  };

  socket.on("data",function(data){
    data = data.trim();
    if(!data) return;
    if(data.charAt(0)=='#') return; 
    if(data==="ls"){
      var file_list =ls();
      var fileout=ls_output(file_list);
      socket.write(fileout);

    }


    //stream.on("data",(chunk)=>socket.write(chunk.toString('ascii')));
   // stream.pipe(socket);
   // data.pipe(fs);
  });
}).on('error', (err) => {
  throw err;
});

// grab an arbitrary unused port.
server.listen(4010);

//