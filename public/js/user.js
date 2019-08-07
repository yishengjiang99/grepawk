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
  var get_uuid = function(){
    if (uuid) return uuid;
    if (uuid = localStorage.getItem('uuid')) return uuid;
    uuid = generateUUID();
    localStorage.setItem('uuid', uuid);
    return uuid;
  }
  var set_uuid=function(uuid){
    uuid=uuid;
    localStorage.setItem('uuid', uuid);
  }
  var get_info = function(){
  }
  var deposit=function(args){
    fetch("/bt/token").then(res=>{
          const token = res.body;
          $("#payment-dialog").modal('show');
          if(args[0]){
            $('#bt_amount').val(args[0]);
          }
          braintree.dropin.create({
            authorization:token,
            container:"#bt_container",
            paypal:{
              flow:'vault'
            }
          },function(err,instance){
            if(err){
              outputError("error connecting payment service");
              $("#payment-dialog").modal('hide');
            }else{
               
            }
          })
        })  
  }
  
  return {
    deposit: deposit,
    get_info: get_info,
    get_uuid: get_uuid,
    gen_uuid: generateUUID,
    set_uuid: set_uuid
  }
}


