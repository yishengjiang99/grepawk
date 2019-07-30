// Note: The file system has been prefixed as of Google Chrome 12:


window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestFileSystem(type, size, successCallback, opt_errorCallback)
