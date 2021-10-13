import { api_get_json } from "../APICalls";

var api_fs = function (mntType) {
  var fileMap = {};
  var mntType = mntType || "azure";

  return {
    file_get_stream: async function (path) {
      return new Promise((resolve, reject) => {
        var ws = new WebSocket("/" + path);
        ws.onopen = (e) => {
          resolve(ws);
        };
        ws.onerror = reject;
      });
    },
    get_files: async function () {
      let fileList = await api_get_json(`/file/${mntType}/list`);
      fileList[0].forEach((node) => {
        fileMap[node.fullPath] = node;
      });
      return fileList;
    },
    file_get_meta: function (fullPath, stdout) {
      if (fileMap[fullPath]) {
        stdout({
          size: fileMap[fullPath].size || 0,
          type: fileMap[fullPath].type || "file",
          modificationTime:
            (fileMap[fullPath].updated_at &&
              new Date(fileMap[fullPath].updated_at)) ||
            null,
        });
      } else {
        stdout(null);
        throw new Error("File not registered");
      }
    },
    file_get_content: function (path) {
      return new Promise((resolve, reject) => {
        fetch(path)
          .then((response) => {
            resolve({
              type: "text",
              payload: response.body(),
            });
          })
          .catch(reject);
      });
    },
    upload_files: async function (files, basePath, onMessage) {
      for (let i = 0; i < files.length; i++) {
        const _file = files[0];
        let url = "/upload?basepath=" + basePath;
        fetch(url, {
          body: _file,
          method: "POST",
          headers: {
            contentType: _file.type,
            "x-file-name": _file.name,
            "x-file-size": _file.size,
          },
        })
          .then(async function readResponse(response) {
            let update = await response.text();
            console.log(update);
            if (onMessage) onMessage(update);
          })
          .catch((e) => {
            alert(e.message);
          });
      }
    },
  };
};

export default api_fs;
