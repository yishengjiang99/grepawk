@extends('layouts.app')
@section('content')

<div class='container' style='margin-top:73px;margin-bottom:100px'>
   <div class='row' id='hud-0'></div>

   <div class='row'>
   <div class='col-lg-12'><iframe id='tty1' src="{{ url('/terminal') }}" height='500px' width='90%' frameborder="0" scrolling="yes"></iframe></div>
   </div>
   <div id='hud-1' class='row' style='height:64px'></div>
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
    <iframe id="pusher_listener" src='/pusher' height="0" width="0" frameborder="0" scrolling="yes"></iframe>


<script>
 function iframe_interface(cmd,args){
    if(typeof cmd==='object' && cmd.update){
        tty1.contentWindow.iframe_interface(cmd.update);
    }
    if(cmd=="new"){
        $("#new_file").show();
    }
    if(cmd=="update_options"){
       $("#hud-options").html(args);
    }
    if(cmd=='update_html'){
      $("#"+args[0]).html(args[1]);
    }
    if(cmd=='debug'){
       $("#debugger").append("<p>"+args+"<p>");
    }
 }

 $(document).ready(function(){
   window.tty1 = document.getElementById('tty1');
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
