function errorHandler(e){}
    window.debug = function (msg) {
    if (typeof msg === 'object') {
      var msg = "<pre>"+JSON.stringify(msg)+"</pre>";
    }
    document.getElementById("debug").innerHTML += "<br>" + msg;
  }

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
window.directoryEntry = window.directoryEntry || window.webkitDirectoryEntry;

function dirname(path) {
     return path.match(/.*\//);
}

function basename(path) {
     return path.match(/\/.*/);
}

var Vfs = function(props){
  var mnt_points=[
        ['/',                 'root',                   ['chrome','local_hd','cloud_hd', 'social_media','email']],
        ['/chrome',           'Local File System',      ['drafts', 'shared','public','neighbors']],
        ['/local_hd',         'My Computer',            ["C:","D:","/User"]],
        ['/cloud hd',         'Remote Disk',            ['Drop Box', 'Google Docs', 'MS Azure']],
        ['/social_media',     'My Social Meida',        ['Facebook', 'Instagram', 'PayPal', 'Bank of America', 'LinkedIn']],
        ['/email',            'IMAP',                   ['gmail']]
  ];
  var cwd = props.cwd || "/";

  var get_folders = function(start=0){
    folders = folders || {};
    var i;
    for(i=start; i<mnt_points.length; i++){
        if(i % 3 === 0) folders[mnt_points[i]]   = {index: i, 'path':mnt_points[i]};
        if(i % 3 === 1) folders[mnt_points[i-1]].name = mnt_points[i];
        if(i % 3 === 2) folders[mnt_points[i-2]].children = mnt_points[i] || [];
    }
    return folders;
  } 

  var folders = get_folders();

  var mkdir = (full_path, name="")=>{
    mnt_points.push(full_path);
    mnt_points.push(name);
    mnt_points.push([]);
  }

  var props = props ||{};
  var rootDir="grepawk";
  var localFS;
  var errorHandler=function(e){};
  var onInitFs = (fileSystem)=>{
    localFS=fileSystem;
    localFS.root.getDirectory(rootDir,{create:true},function(dir){
      rootDir=dir;
    },errorHandler);
  }

  window.requestFileSystem(window.PERSISTENT, 1024*1024,onInitFs,errorHandler);

  return{
    mkdir: mkdir,
    file_get_content: (path)=>{
      if(localFS===null) throw new Error("localFS is null");
      return new Promise(function(resolve,reject){
        localFS.root.get_file(path,resolve,reject);
      })
    },

    list_files:(path)=>{
      if(!localFS) throw new Error("localFS is null");
      return new Promise(function(resolve,reject){
        localFS.root.get_file(path,resolve,reject);
      })
    },
    getFolders: function(start=0){
        folders = folders || {};
        var i;
        for(i=start; i<mnt_points.length; i++){
            if(i % 3 === 0) folders[mnt_points[i]]   = {index: i, 'path':mnt_points[i]};
            if(i % 3 === 1) folders[mnt_points[i-1]].name = mnt_points[i];
            if(i % 3 === 2) folders[mnt_points[i-2]].children = mnt_points[i] || [];
        }
        return folders;
      } ,

    toString: function(){
      return JSON.stringify(get_folders());
    }
  }
}

var vfs = Vfs();
vfs.mkdir("/Notes/javascript");
vfs.mkdir("/Notes/php");


var ff=vfs.get_fs_sources();

debug(ff);


export default Vfs;