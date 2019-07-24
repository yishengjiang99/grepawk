require('dotenv').config()
const fs = require('fs');
const Promise = require("promise");
const readline = require('readline');
var azure = require('azure-storage');
const path =require("path");
var formidable = require('formidable');
var containerName = "data";
var blobClient = azure.createBlobService();
const vfs_root = path.resolve(__dirname+"/../world/");
var mime = require('mime-types')
const db= require("./db");
console.log(get_container_name('/usr/local/var/www/blog/world/data/cvs'));

function get_container_name(pwd){
    var str = pwd.replace(vfs_root,"").replace(/\//g,"");
    str = str || 'root';
    console.log("get container name "+str);

    return str;
}
function init_pwd_container_if_neccessary(pwd){
    return new Promise((resolve,reject)=>{
        const containerName = get_container_name(pwd);
        blobClient.createContainerIfNotExists(containerName,function(error){
            if(error) reject(error);
            else resolve(containerName)
        })
    })
}
const xfs = {
    list_files: function (pwd) {
        return new Promise(async (resolve, reject) => {
            const containerName = get_container_name(pwd);
            blobClient.listBlobsSegmented(containerName, null, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            })
        })
    },
    stream_blob: function(pwd,blobName,ws){
        ws.send("stdout: "+ws);
        const containerName=get_container_name(pwd);

        const fh = blobClient.createReadStream(containerName,blobName,(err,fileInfo)=>{
            console.log(Object.getOwnPropertyNames(fh));
            if(err){
                ws.send("stderr: "+err.message);
            }
            console.log(fh);
        })
        fh.on("data",data=>{
            ws.send("stdout: "+data.toString());
        });

    },
    get_blob_stream: function(pwd, blobName){
        const containerName = get_container_name(pwd);
        
        return blobClient.createWriteStreamToBlockBlob(containerName, blobName);
    },
    blobClient: blobClient,
    init_pwd_container_if_neccessary: init_pwd_container_if_neccessary,
    upload_handler: function (req, res) {
        try {
            var form = new formidable.IncomingForm();
            form.parse(req, async function (err, fields, files) {


                if (!files || !files.file || !files.file.name) {
                    throw new Error("No file uploaded");
                }

                if (err) throw err;
                var options = {
                    contentType: mime.lookup(files.file.name),
                    metadata: {
                        fileName: files.file.name
                    }
                };
                if(fields.uuid){
                    user = await db.get_user(fields.uuid);
                    console.log(user);
                    containerName = get_container_name(user.cwd);
                    console.log("container name changed to "+containerName);
                }
                console.log(containerName);
                var update = JSON.stringify({output:"Uploading "+files.file.name+" to "+containerName});
                res.write(`<script>parent.iframe_interface('${update}')</script>`);
                try{
                    await xfs.upload_sync(containerName,files.file.name, files.file.path, options);
                    res.end(`<script>parent.iframe_interface('uploaded')</script>`);
                }catch(e){
                    update = JSON.stringify({output:"upload failed "+e.message});
                    res.end(`<script>parent.iframe_interface('${update}')</script>`);
                }   
            });
        } catch (e) {
            res.status(500);
            res.end(e.message);
        }
    },
    upload_sync:(containerName,blobName,path,options)=>{
        return new Promise((resolve,reject)=>{
            blobClient.createBlockBlobFromLocalFile(containerName, blobName, path, options, function (err) {
                console.log(err);
                if(err) reject(err);
                else resolve();

            })
        })
    },
    send_description: (pwd, ws) => {
        xfs.describe(pwd).then(desc => {
            desc.split("\n").forEach(line => {
                if (line.trim().startsWith("img: ")) {
                    ws.send(JSON.stringify({
                        "img": line.replace("img: ", "")
                    }));
                    ws.send("stdout: <br>");
                } else {
                    ws.send("stdout: " + line);
                }
            })
        }).catch(err => {
            ws.send("stderr: " + err.message);
        });
    },
    describe: function (pwd) {
        return new Promise((resolve, reject) => {
            fs.access(pwd + "/.description", fs.constants.F_OK, (err) => {
                if (err) resolve("");
                else {
                    fs.readFile(pwd + "/.description", (err, data) => {
                        if (err) reject(err);
                        else resolve(data.toString());
                    })
                }
            })
        });
    },
    auto_complete_hints: (pwd, ws) => {
        fs.readdir(pwd, (err, items) => {
            if (err) {
                ws.send("stderr: error reading fs");
                return;
            }
            ws.send(JSON.stringify({
                hints: items
            }));
        });
    },
    tabular_list_view: function(entries){
        return "stdout: "+entries.join("\t");
    },
    list_containers: function(ws){
        var _page_through = function(ws, nextPage){
            blobClient.listContainersSegmented(nextPage,(error,result)=>{
                result.entries.forEach(entry=>{
                    ws.send(xfs.tabular_list_view([entry.lastModified,entry.name]));
                })
                if(result.continuationToken){
                    _page_through(ws, result.continuationToken);
                }
             })
        }
        _page_through(ws, null);
    },
    
    list_files_table: (pwd, ws,next) => {
        if(get_container_name(pwd)=='root'){
            xfs.list_containers(ws);
            return;
        }
        console.log("listing files for "+pwd);
        xfs.list_files(pwd).then(data => {   
            console.log("got data");         
            entries = data.entries;
            if(entries.length==0) return;
            var rows = [];
            var headers=['thumbnail','title','description','links'];
            entries.forEach((file) => {
                const desc = file.lastModified + "<br>" +
                    file.contentLength + " bytes <br>" +
                    file.contentSettings.contentType;
                rows.push({
                        'title': file.name,
                        'size': file.contentLength,
                        'type': file.contentSettings.contentType,
                        'last_modified': file.lastModified,
                        'links': [
                            'onclick: vcat ' + file.name
                        ]
                    })
            })
            var headers=['title','size','type', 'last_modified','links'];
            var json = {'headers':headers,'rows':rows, 'nextPage':data.continuationToken};

            ws.send(JSON.stringify({table:json}));
        }).catch(err => {
            ws.send("stderr: " + err.message);
        })
    }
}

module.exports = xfs;

// var ws={
//  send: console.log
// }
// xfs.list_files("/usr/local/var/www/blog/world/data").then(console.log)
