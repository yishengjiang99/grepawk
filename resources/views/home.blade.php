@extends('layouts.app')
@section('content')
<script>
    @include('terminal')
</script>
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8 terminal-container">
            <div id="container">
                <output></output>
                <div id="input-line" class="input-line">
                    <div class="prompt"></div><div><input class="cmdline" autofocus /></div>
                </div>
            </div>
        </div>
        <div class='col-md-4'>
        
            <ul class="list-group">
                <li class="list-group-item">Cras justo odio</li>
                <li class="list-group-item">Dapibus ac facilisis in</li>
                <li class="list-group-item">Morbi leo risus</li>
                <li class="list-group-item">Porta ac consectetur ac</li>
                <li class="list-group-item">Vestibulum at eros</li>
            </ul>
        </div>
    </div>
</div>

@endsection



