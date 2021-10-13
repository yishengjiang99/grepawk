require("dotenv").config();
const fs = require("fs");
const Promise = require("promise");
const readline = require("readline");
var azure = require("azure-storage");
const path = require("path");
var formidable = require("formidable");
var containerName = "data";
var blobClient = azure.createBlobService();

const vfs_root = path.resolve(__dirname + "/../world/");
var mime = require("mime-types");
const db = require("./db");
const url = require("url");

function get_container_name(pwd) {
  var str = pwd.replace(vfs_root, "");
  str = str.replace(/\//g, "");
  str = str || "root";
  console.log(strcd);
  return str;
}
function init_pwd_container_if_neccessary(pwd) {
  return new Promise((resolve, reject) => {
    const containerName = get_container_name(pwd);
    const option = {
      publicAccessLevel: "container",
    };
    blobClient.createContainerIfNotExists(
      containerName,
      option,
      function (error) {
        if (error) {
          console.log("create copntainer", error);
          reject(new Error(containerName + " create failed"));
        } else resolve(containerName);
      }
    );
  });
}
const xfs = {
  blobClient: blobClient,
  get_container_name: get_container_name,
  blob_get_content: function (containerName, blobName, onError, onSuccess) {
    const fh = blobClient.createReadStream(
      containerName,
      blobName,
      (err, fileInfo) => {
        if (err) onError(err);
      }
    );
    var bufs = [];
    fh.on("data", (data) => {
      bufs.push(data);
    });
    fh.on("end", function () {
      onSuccess(Buffer.concat(bufs).toString("UTF-8"));
    });
  },
  stream_blob: function (pwd, blobName, ws) {
    const containerName = get_container_name(pwd);
    const fh = blobClient.createReadStream(
      containerName,
      blobName,
      (err, fileInfo) => {
        console.log(Object.getOwnPropertyNames(fh));
        if (err) {
          ws.send("stderr: " + err.message);
        }
        console.log(fileInfo);
      }
    );
    ws.send("binary_mode_on");
    fh.on("data", (data) => {
      console.log("stream d", data);
      ws.send("binary_mode_on");
      ws.send(data);
    });
    fh.on("end", () => {
      ws.send("binary_mode_off");
    });
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
            fileName: files.file.name,
          },
        };
        if (fields.uuid) {
          user = await db.get_user(fields.uuid);
          console.log(user);
          containerName = get_container_name(user.cwd);
          console.log("container name changed to " + containerName);
        }

        console.log(containerName);
        var update = JSON.stringify({
          output: "Uploading " + files.file.name + " to " + containerName,
        });
        res.write(`<script>parent.iframe_interface('${update}')</script>`);
        try {
          await xfs.upload_sync(
            containerName,
            files.file.name,
            files.file.path,
            options
          );
          res.end(`<script>parent.iframe_interface('uploaded')</script>`);
        } catch (e) {
          update = JSON.stringify({
            output: "upload failed " + e.message,
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
      blobClient.createBlockBlobFromLocalFile(
        containerName,
        blobName,
        path,
        options,
        function (err, result) {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },
  edit_file: (containerName, blobName, text) => {
    return new Promise((resolve, reject) => {
      console.log("saving file ", text);
      blobClient.createBlockBlobFromText(
        containerName,
        blobName,
        text,
        function (err, result, response) {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },
  send_description: (pwd, ws) => {
    xfs
      .describe(pwd)
      .then((desc) => {
        desc.split("\n").forEach((line) => {
          if (line.trim().startsWith("img: ")) {
            ws.send(
              JSON.stringify({
                img: line.replace("img: ", ""),
              })
            );
            ws.send("stdout: <br>");
          } else {
            ws.send("stdout: " + line);
          }
        });
      })
      .catch((err) => {
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
          });
        }
      });
    });
  },

  auto_complete_hints: (pwd, ws) => {
    // items = [];
    // containerName = xfs.get_container_name(pwd);
    // xfs.list_files(containerName).then(data => {
    //     data.forEach((file) => {
    //         items.push(file.name)
    //     })
    //     fs.readdir(pwd, (err, files) => {
    //         if (err) {
    //             ws.send(items);
    //             ws.send("stderr: error reading fs");
    //             return;
    //         }
    //         items = items.concat(files);
    //         ws.send(JSON.stringify({
    //             hints: items
    //         }));
    //     });
    // }).catch(err => {
    //     ws.send("stderr: " + err.message);
    // })
  },
  tabular_list_view: function (entries) {
    return "stdout: " + entries.join("\t");
  },
  list_files: function (containerName) {
    return new Promise((resolve, reject) => {
      var files = [];
      var _page_through = function (containerName, nextPage) {
        blobClient.listBlobsSegmented(
          containerName,
          nextPage,
          (err, result) => {
            if (err) {
              console.log(err);
              resolve([]); //handle it here.
              return;
            }
            result.entries.forEach((entry) => {
              files.push(entry);
            });
            if (result.continuationToken) {
              _page_through(containerName, result.continuationToken);
            } else {
              resolve(files);
              return;
            }
          }
        );
      };
      _page_through(containerName, null);
    });
  },
  update_content_type: function (containerName, blobName, contentType) {
    return new Promise((resolve, reject) => {
      console.log("setting " + blobName + " to " + contentType);
      var options = {
        contentSettings: {
          contentType: contentType,
        },
      };

      blobClient.setBlobMetadata(
        containerName,
        blobName,
        options,
        (err, res, r2) => {
          console.log(res, r2);
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },
  list_containers2: function () {
    return new Promise((resolve, reject) => {
      var results = [];
      var _page_through = function (nextPage) {
        blobClient.listContainersSegmented(nextPage, (error, result) => {
          result.entries &&
            result.entries.forEach((entry) => {
              results.push(entry.name);
            });
          if (result.continuationToken) {
            _page_through(ws, result.continuationToken);
          } else {
            resolve(results);
          }
        });
      };

      _page_through(null);
    });
  },

  list_containers: function (ws) {
    var _page_through = function (nextPage) {
      blobClient.listContainersSegmented(nextPage, (error, result) => {
        result.entries.forEach(
          (entry) =>
            ws &&
            ws.send(xfs.tabular_list_view([entry.lastModified, entry.name]))
        );
        if (result.continuationToken) {
          _page_through(result.continuationToken);
        }
      });
    };
    _page_through(null);
  },
  list_virtual_folders: (pwd) => {
    return new Promise((resolve, reject) => {
      fs.access(pwd + "/.vlinks", fs.constants.F_OK, (err) => {
        if (err) resolve([]);
        else {
          fs.readFile(pwd + "/.vlinks", (err, data) => {
            if (err) reject(err);
            var lines = data.toString().split("\n");
            var rows = [];
            lines.forEach((line) => {
              var parts = line.split("---");
              if (parts.length < 2) return;
              switch (parts[0]) {
                case "http":
                  var myurl = url.parse(parts[1]);
                  rows.push({
                    title: myurl.pathname,
                    desc: myurl.hostname,
                    size: "-",
                    type: "webpage",
                    last_modified: "",
                    opts: [
                      {
                        cmd: `parse ${parts[1]}`,
                        desc: "crawl page",
                      },
                    ],
                  });
                  break;
                case "psql":
                  break;
                default:
                  break;
              }
            });
            resolve(rows);
          });
        }
      });
    });
  },

  list_fs_graph_table: async function (parent_node, ws = null) {
    let retRows = [];
    var dbrows = await db.query(
      "select * from fs_graph where parent_node = $1",
      [parent_node || 0]
    );
    var headers = ["name", "type", "opts"];
    return {
      headers,
      rows: dbrows.map((row) => ({
        name: row.name,
        type: row.type,
        opts: [row.type == "dir" ? "open" : "read"],
      })),
    };
  },
  list_files_table: async (pwd, ws) => {
    try {
      let containerName = get_container_name(pwd);
      xfs.list_fs_graph_table(pwd, ws);
      if (containerName == "root") return;
      var rows = await xfs.list_virtual_folders(pwd);
      var azfiles = await xfs.list_files(containerName);
      var headers = [
        "title",
        "parent",
        "size",
        "type",
        "last_modified",
        "opts",
      ];
      azfiles.forEach((file) => {
        var url = blobClient.getUrl(containerName, file.name);
        console.log(file);
        if (file.contentSettings.contentType.includes("image")) {
          var _cmd = "openimage";
        } else if (file.contentSettings.contentType.includes("text")) {
          var _cmd = "edit";
        } else {
          var _cmd = "view";
        }
        rows.push({
          title: file.name,
          parent: "file",
          size: file.contentLength,
          type: file.contentSettings.contentType,
          last_modified: file.lastModified,
          opts: [
            {
              cmd: `${_cmd} ${url} ${containerName + "/" + file.name}`,
              desc: `${_cmd}`,
            },
          ],
        });
      });
      var json = {
        headers: headers,
        rows: rows,
      };

      ws.send(
        JSON.stringify({
          table: json,
        })
      );
    } catch (err) {
      ws.send("stderr: " + err.message);
    }
  },
  ext_mime_lookup: function (filename) {
    var ext = filename.split(".").pop();
    var exts = ["js", "java", "php", "html", "css", "cpp", "py"];
    if (exts.indexOf(ext)) {
      return "text/" + ext;
    }
    return false;
  },
  get_fs_graph: async function () {
    db.list_table("fs_graph", "type", "dir").then((res) => {
      res.rows.forEach(async (row) => {
        try {
          console.log("try creating ", row.uri);
          var res = await xfs.init_pwd_container_if_neccessary(row.uri);
        } catch (e) {
          console.log("create container err", e);
        }
      });
    });
  },
  init_fs_graph: async function () {
    async function _init_fs_children(c_path, level) {
      try {
        const items = fs.readdirSync(path.resolve(vfs_root, c_path));

        while (items.length) {
          const item = items.shift();
          const itemPath = path.join(c_path, item);
          const stat = fs.statSync(path.join(vfs_root, itemPath)); //, { cwd: vfs_root });
          let columns = {
            name: item,
            parent_node: c_path,
            type: stat.isDirectory() ? "dir" : "file",
            uri: itemPath,
            level: level,
          };
          console.log(columns);
          await db.insertTable("fs_graph", columns);
          if (stat.isDirectory()) {
            _init_fs_children(itemPath, level + 1);
          }
        }
      } catch (e) {
        console.log(e);
      }
    }

    let root = {
      name: "",
      type: "root",
      description: "root dir",
      uri: "",
      level: 0,
    };

    db.insertTable("fs_graph", root)
      .then((parent) => _init_fs_children("", 1))
      .catch(console.trace);
  },
};

function autoImplementedMode(filename) {
  var ext = filename.split(".").pop();
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
module.exports = xfs;
