require('dotenv').config()
const fs = require('fs');
const Promise = require("promise");
const readline = require('readline');
var azure = require('azure-storage');
const path = require("path");
var formidable = require('formidable');
var containerName = "data";
var blobClient = azure.createBlobService();
const vfs_root = path.resolve(__dirname + "/../world/");
var mime = require('mime-types')
const db = require("./db");

function get_container_name(pwd) {
    var str = pwd.replace(vfs_root, "");
    str = str.replace(/\//g, "");
    str = str || 'root';
    return str;
}

function init_pwd_container_if_neccessary(pwd) {
    return new Promise((resolve, reject) => {
        const containerName = get_container_name(pwd);
        const option = {
            publicAccessLevel: 'container'
        };
        blobClient.createContainerIfNotExists(containerName, option, function (error) {
            if (error) {
                console.log("create copntainer", error);
                reject(new Error(containerName + " create failed"));
            } else resolve(containerName)
        })
    })
}
const xfs = {
    get_container_name:get_container_name,
    stream_blob: function (pwd, blobName, ws) {
        const containerName = get_container_name(pwd);
        const fh = blobClient.createReadStream(containerName, blobName, (err, fileInfo) => {
            console.log(Object.getOwnPropertyNames(fh));
            if (err) {
                ws.send("stderr: " + err.message);
            }
            console.log(fileInfo);
        })
        ws.send("binary_mode_on");
        fh.on("data", data => {
            console.log("stream d", data);
            ws.send("binary_mode_on");
            ws.send(data);
        });
        fh.on("end", () => {
            ws.send("binary_mode_off");
        })
    },
    get_blob_stream: function (pwd, blobName) {
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
                    contentSettings: {
                        contentType: mime.lookup(files.file.name),
                    },
                    metadata: {
                        fileName: files.file.name
                    }
                };
                if (fields.uuid) {
                    user = await db.get_user(fields.uuid);
                    console.log(user);
                    containerName = get_container_name(user.cwd);
                    console.log("container name changed to " + containerName);
                }
                console.log(containerName);
                var update = JSON.stringify({
                    output: "Uploading " + files.file.name + " to " + containerName
                });
                res.write(`<script>parent.iframe_interface('${update}')</script>`);
                try {
                    await xfs.upload_sync(containerName, files.file.name, files.file.path, options);
                    res.end(`<script>parent.iframe_interface('uploaded')</script>`);
                } catch (e) {
                    update = JSON.stringify({
                        output: "upload failed " + e.message
                    });
                    res.end(`<script>parent.iframe_interface('${update}')</script>`);
                }
            });
        } catch (e) {
            res.status(500);
            res.end(e.message);
        }
    },
    upload_sync: (containerName, blobName, path, options) => {
        return new Promise((resolve, reject) => {
            blobClient.createBlockBlobFromLocalFile(containerName, blobName, path, options, function (err, result) {
                if (err) reject(err);
                else resolve(result);
            })
        })
    },
    edit_file: (containerName, blobName, text) => {
        return new Promise((resolve, reject) => {
            console.log("saving file ", text);
            blobClient.createBlockBlobFromText(containerName, blobName, text, function (err, result, response) {
                if (err) reject(err);
                else resolve(result);
            });
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
        items = [];
        xfs.list_files(pwd).then(data => {
            data.entries.forEach((file) => {
                items.push(file.name)
            })
            fs.readdir(pwd, (err, files) => {
                if (err) {
                    ws.send(items);
                    ws.send("stderr: error reading fs");
                    return;
                }
                items = items.concat(files);
                ws.send(items);
            });
        });

    },
    tabular_list_view: function (entries) {
        return "stdout: " + entries.join("\t");
    },
    list_files: function (containerName) {
        return new Promise((resolve, reject) => {
            var files = [];
            var _page_through = function (containerName, nextPage) {
                blobClient.listBlobsSegmented(containerName, nextPage, (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    result.entries.forEach(entry => {
                        files.push(entry);
                    })
                    if (result.continuationToken) {
                        _page_through(containerName, result.continuationToken);
                    } else {
                        resolve(files);
                        return;
                    }
                })

            }
            _page_through(containerName, null);
        });
    },
    update_content_type: function (containerName, blobName, contentType) {
        return new Promise((resolve, reject) => {
            console.log("setting " + blobName + " to " + contentType);
            var options = {
                contentSettings: {
                    contentType: contentType
                }
            }

            blobClient.setBlobMetadata(containerName, blobName, options, (err, res, r2) => {
                console.log(res, r2);
                if (err) reject(err);
                else resolve();
            })
        })
    },
    list_containers2: function () {
        return new Promise((resolve, reject) => {
            var results = [];
            var _page_through = function (nextPage) {
                blobClient.listContainersSegmented(nextPage, (error, result) => {
                    result.entries.forEach(entry => {
                        results.push(entry.name);
                    })
                    if (result.continuationToken) {
                        _page_through(ws, result.continuationToken);
                    } else {
                        resolve(results);
                    }
                })
            }

            _page_through(null);
        })
    },


    list_containers: function (ws) {
        var _page_through = function (ws, nextPage) {
            blobClient.listContainersSegmented(nextPage, (error, result) => {
                result.entries.forEach(entry => {
                    ws.send(xfs.tabular_list_view([entry.lastModified, entry.name]));
                })
                if (result.continuationToken) {
                    _page_through(ws, result.continuationToken);
                }
            })
        }
        _page_through(ws, null);
    },

    list_files_table: (pwd, ws, next) => {
        let containerName = get_container_name(pwd);
        if (containerName == 'root') {
            // xfs.list_containers(ws);
            return;
        }
        console.log("listing files for " + containerName);
        xfs.list_files(containerName).then(entries => {
            console.log("got data "+entries.length);

            if (entries.length == 0) return;
            var rows = [];
            var headers = ['title', 'size', 'type', 'last_modified', 'edit_link'];
            entries.forEach((file) => {
                const desc = file.lastModified + "<br>" +
                    file.contentLength + " bytes <br>" +
                    file.contentSettings.contentType;
                var url = blobClient.getUrl(containerName, file.name);
                rows.push({
                    'title': file.name,
                    'size': file.contentLength,
                    'type': file.contentSettings.contentType,
                    'last_modified': file.lastModified,
                    'edit_link': {
                        url: url,
                        context: containerName + "/" + file.name
                    }
                })
            })
            var json = {
                'headers': headers,
                'rows': rows,
                'nextPage': data.continuationToken
            };

            ws.send(JSON.stringify({
                table: json
            }));
        }).catch(err => {
            console.log(err);
            ws.send("stderr: " + err.message);
        })
    },
    ext_mime_lookup: function (filename) {

        var ext = filename.split('.').pop();
        var exts = ['js', 'java', 'php', 'html', 'css', 'cpp', 'py'];
        if (exts.indexOf(ext)) {
            return "text/" + ext;
        }
        return false;

    },
    get_fs_graph: async function () {
        db.list_table("fs_graph", "type", "dir").then(res => {
            res.rows.forEach(async row => {
                try {
                    console.log("try creating ", row.uri);
                    var res=await xfs.init_pwd_container_if_neccessary(row.uri);
                } catch (e ) {
                    console.log("create container err", e);
                }
            })
        });
    },
    init_fs_graph: async function (_path) {
        let columns = {
            name: path.basename(_path),
            meta: JSON.stringify({
                type: 'root'
            }),
            description: "Grepawk",
            uri: _path.replace(vfs_root, "")
        }
        var _init_fs_children = async function (c_path, parent_id) {
            try {
                fs.readdir(c_path, function (err, items) {
                    if (!items) {
                        console.log("reached leaf at " + c_path);
                        return;
                    }
                    items.forEach(async function (item) {
                        const stat = fs.statSync(c_path + "/" + item);
                        let columns = {
                            name: item,
                            parent_node: parent_id,
                            type: stat.isDirectory() ? "dir" : "file",
                            uri: (c_path + "/" + item).replace(vfs_root, "")
                        };
                        db.insertTable("fs_graph", columns).then(parent => {
                            console.log("inserted ", parent);
                            if (stat.isDirectory()) {
                                _init_fs_children(c_path + "/" + item, parent.id);
                            }
                        }).catch(e => {
                            console.log(e);
                        });
                    });
                });
            } catch (e) {
                console.log(e);
            }
        }

        db.insertTable("fs_graph", columns).then(parent => {
            _init_fs_children(_path, parent.id);
        }).catch(e => {
            console.log(e);
        });

    }
}

function autoImplementedMode(filename) {
    var ext = filename.split('.').pop();
    var prefix = "ace/mode/";

    if (!ext) {
        return prefix + "text";
    }

    /**
     *  Functional, but inefficient if you want to write it by yourself ....
     */
    switch (ext) {
        case "js":
            return prefix + "javascript";
        case "cs":
            return prefix + "csharp";
        case "php":
            return prefix + "php";
        case "rb":
            return prefix + "ruby";
        default:
            return prefix + ext;
    }
}

xfs.autoImplementedMode = autoImplementedMode;
//xfs.init_fs_graph(vfs_root);
module.exports = xfs;