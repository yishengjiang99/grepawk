import { apiRoot } from "./constants";
var API = {};

export function api_post_json(uri, data) {
  return fetch(`${apiRoot}${uri}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-cache",
    body: JSON.stringify(data),
  }).then((resp) => resp.json());
}

export function api_get_json(uri) {
  return fetch(`${apiRoot}${uri}`, {
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
