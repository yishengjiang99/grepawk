const xfs = require("../lib/xfs");
const mime = require("mime-types");
async function run(){

   xfs.get_fs_graph();
/*

    var containers = await xfs.list_containers2();
    console.log(containers);
    containers.forEach(async function(containerName){
        var files= await xfs.list_files(containerName);
        files.forEach(async function(file){
            console.log(containerName+"/"+file.name);
            var mimeType = xfs.ext_mime_lookup(file.name) ||  mime.lookup(file.name);
            try{
                await xfs.update_content_type(containerName, file.name, mimeType);

            }catch(e){
                console.log(e);
            }
            process.exit();
        });
    })
*/
}

var type=mime.lookup("sssdd.txt");
run();
console.log(type);



