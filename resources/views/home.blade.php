@extends('layouts.app')
@section('content')
<div class='container'>
<div style='margin: auto; width: 80%'>
    <iframe src="{{ url('/terminal') }}" height=640 width='100%'></iframe>
</div>
</div>

@endsection



