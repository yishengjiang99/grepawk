@extends('layouts.app')
@section('content')
<div class='container-fluid'>
 <div style='margin: auto; width: 80%'>
    <iframe src="{{ url('/terminal') }}" height=640 width='100%'></iframe>
 </div>
 <div id='debugger'></div>
</div>
@endsection
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


