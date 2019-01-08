@extends('layouts.app')
@section('content')

<div class='container'>
   <div id='hud-top' class='bg-light' style='height:10px;top:63px'>sssss</div>
   <div><iframe id='tty1' src="{{ url('/terminal') }}" height='640px' width='100%' frameborder="0" scrolling="yes"></iframe></div>
   <div id='hud-options' class='container bg-light' style='height:32px'></div>
</div>


<div id='new_file' class="modal" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">New File</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
         <form id='new_file_form'>
         @csrf
         <div class="form-group">
            <label for="file-name-input">File Name</label>
            <input type="text" name='filename' class="form-control" id="file-name-input" placeholder="File Name">
         </div>
         <div class="form-group">
            <label for="file-content-input">File Content</label>
            <TextArea cols=80 rows=15 type="text" name='filecontent' class="form-control" id="file-content-input" placeholder="Another input"></TextArea>
         </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" id='new-file-submit'>Save changes</button>
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>


<script>
 function iframe_interface(cmd,args){
    debugger;
    if(cmd=="new"){
        $("#new_file").show();
    }
    if(cmd=="update_options"){
       $("#hud-options").html(args);
    }
    if(cmd=='debug'){
       $("#debugger").append("<p>"+args+"<p>");
    }
 }

 $(document).ready(function(){
   //  var tty1_stdin=null;
   //  var tty1 = document.getElementById('tty1');
   //  var iframeDoc = tty1.contentDocument || iframe.contentWindow.document;
   //  $(iframeDoc).ready(function(e){
   //    alert('iframe ready');
   //    tty1_stdin=tty1.contentWindow.iframe_interface;
   //    debugger;
   //  })

   $("#new-file-submit").click(function(e){
      var postdata=$("#new_file_form").serialize();
      $.post("/files/new",postdata,function(retObj){
         tty1.contentWindow.iframe_interface(retObj);
         $("#new_file").hide();

      })
   });
 })
</script>
@endsection