@extends('layouts.app')
@section('content')
<div class='container-fluid'>
  <div class="modal fade" id="myModal" role="dialog">
    <div class="modal-dialog">
      <!-- Modal content-->
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal">&times;</button>
          <h4 class="modal-title">Modal Header</h4>
        </div>
        <div class="modal-body">
          <p>Some text in the modal.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
 <div style='margin: auto; width: 80%'>
    <iframe src="{{ url('/terminal') }}" height=640 width='100%'></iframe>
 </div>
</div>
@endsection
<script>

 function iframe_interface(cmd,args){
    if(cmd=="new"){
        $("#myModal").show();
    }
 }
</script>


