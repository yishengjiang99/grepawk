function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

var User = function(){
  var uuid;
  var cwd;
  var xp;
  var points;
  var get_uuid = function(){
    if (uuid) return uuid;
    if (uuid = localStorage.getItem('uuid')) return uuid;
    
    uuid = generateUUID();
    localStorage.setItem('uuid', uuid);
    return uuid;
  }
  var get_info = function(){
    
  }
 
  return {
    get_info: get_info,
    get_uuid: get_uuid,
    gen_uuid: generateUUID
  }
}


