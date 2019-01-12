<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Grepawk</title>
        <script src="../js/app.js"></script>

        <meta name="csrf-token" content="{{ csrf_token() }}">
    </head>
    <body>
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
   <div class='col-lg-12' style='margin-top:25px'><iframe id='tty1' src="{{ url('/terminal') }}" height='500px' width='90%' frameborder="0" scrolling="yes"></iframe></div>
</p>
<p>
<h4>Live development stream:</h4>
</P>
<div class=container>
<iframe src='/twitch' frameborder=0 scrolling=no width=854 height=480>
</iframe>
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
