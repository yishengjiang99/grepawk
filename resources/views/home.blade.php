@extends('layouts.app')
@section('content')
<div class='container-fluid'>
   <div class='row'>
      <main role='main' class="col-lg-10 offset-md-1 mt-5 pt-5">
         <iframe src="{{ url('/terminal') }}" height=640 width='100%'></iframe>
      </main>
   </div>
</div>
<script>
 function iframe_interface(cmd,args){
    if(cmd=="new"){
        $("#if_newfile").show();
    }
    if(cmd=='debug'){
       $("#debugger").append("<p>"+args+"<p>");
    }
 }
</script>
@endsection
