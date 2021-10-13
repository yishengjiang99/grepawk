const NODE_API_HOSTNAME = process.env.API_HOST || window.location.href;
var API = {};

export function api_post_json(uri, data) {
  return new Promise((resolve, reject) => {
    var url = NODE_API_HOSTNAME + uri;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
      body: JSON.stringify(data),
    })
      .then((resp) => resp.json())
      .then(resolve)
      .catch(reject);
  });
}

export function api_get_json(uri) {
  return fetch(NODE_API_HOSTNAME + uri, {
    method: "GET",
    headers: { accept: "application/json" },
  }).then((resp) => resp.json());
}
export function generateUUID() {
  // Public Domain/MIT
  var d = new Date().getTime();
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    d += performance.now(); //use high-precision timer if available
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
export function getUUID() {
  var uuid = localStorage.getItem("uuid");
  if (uuid && uuid !== "undefined") return uuid;
  uuid = generateUUID();
  localStorage.setItem("uuid", uuid);
}
