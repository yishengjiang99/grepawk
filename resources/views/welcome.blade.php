<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Grepawk</title>
        <script src="../js/app.js"></script>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-3.3.1.js" crossorigin="anonymous"></script>
      
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.6/umd/popper.min.js" integrity="sha384-wHAiFfRlMFy6i5SRaxvfOCifBUQy1xHdJ/yoi7FRNXMRBu5WHdZYu1hA6ZOblgut" crossorigin="anonymous"></script>
        
<meta name="csrf-token" content="{{ csrf_token() }}">
    </head>
    <body class='container-fluid'>
        <div class="flex-center position-ref full-height">
            @if (Route::has('login'))
                <div class="top-right links">
                    @auth
                        <a href="{{ url('/home') }}">Home</a>
                    @else
                        <a href="{{ route('login') }}">Login</a>

                        @if (Route::has('register'))
                            <a href="{{ route('register') }}">Register</a>
                        @endif
                    @endauth
                </div>
            @endif

            <div class="content">
<p>
GrepAwk.net is an MMORP-FS. A Massively-Multiuser Online Remote Proactive File System.
</p>
<p>
<a href='/fullscreen'>Full Screen HD</a>
   <div class='col-lg-12' style='margin-top:25px'><iframe id='tty1' src="{{ url('/terminal') }}" height='500px' width='90%' frameborder="0" scrolling="yes"></iframe></div>
</p>
<h4>Live development stream:</h4>
<div class=container>
<h4>Live development stream:</h4>
<div class='row'>
  <iframe class=col-md-12 src='/twitch' frameborder=0 scrolling=no width=854 height=480>
  </iframe>
</div>
</div>
</p>
        </div>
    </body>
<script>
Echo.channel('pub-channel')
    .listen('ServerEvent', (e) => {
        console.log(e.update);
    });
</script>
</html>
