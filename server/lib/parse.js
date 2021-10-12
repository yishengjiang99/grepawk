var Parse = function (opts) {
  var opts = Object.assign(
    {
      containerId: "preview",
    },
    opts
  );
  var domparser = new DOMParser();

  function getFromQueue() {
    fetch("/queue/receive")
      .then((resp) => resp.json())
      .then((messages) => {
        if (cb) {
          cb(messages);
        }
      });
  }

  function parseUrl(url) {
    fetch(url, {
      mode: "no-cors",
      method: "GET", // *GET, POST, PUT, DELETE, etc.
      cache: "no-cache",
    })
      .then((response) => response.text())
      .then((text) => {
        console.log(text);
        document.getElementById(opts.containerId).innerHTML = text;
      });
  }

  return Object.freeze({
    parseUrl: parseUrl,
    getFromQueue: getFromQueue,
    version: 4.2,
  });
};
