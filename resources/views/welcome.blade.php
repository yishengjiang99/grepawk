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
<h3>GrepAwk 2.0</h3>
<p>
GrepAwk.net is a web service that generalizes several storage methods on a filesystem-style interface.
<p>
You can <a href='/register'>Register</a> or <a href='/login'>Login</a> with the email 'guest@grepawk.net' and password 'welcome'.
</p>

<p>Start using the product as a guest <a href='/home'>here</a></p>

<iframe src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fyishengjiang78%2Fvideos%2F10108893670719393%2F&show_text=0&width=560" width="560" height="350" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true" allowFullScreen="true"></iframe>

<h3>Recent Changes</h3>
<div>
<textarea cols=80 rows=30>
@include("gitlog");
</textarea>
<br>
<a target=_blank href='https://github.com/yishengjiang99/grepawk/commits/master'>
https://github.com/yishengjiang99/grepawk/commits/master
</a>
</div>
            </div>
        </div>
    </body>
<script>
Echo.channel('pub-channel')
    .listen('ServerEvent', (e) => {
        console.log(e.update);
    });
</script>
</html>
