<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Grepawk</title>
        <script src="../js/app.js"></script>

        <meta name="csrf-token" content="{{ csrf_token() }}">
     <link href="{{ asset('css/cmd.css') }}" rel="stylesheet">

        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/css?family=Nunito:200,600" rel="stylesheet" type="text/css">

        <!-- Styles -->
        <style>
            html, body {
                background-color: #fff;
                color: #636b6f;
                font-family: 'Nunito', sans-serif;
                font-weight: 200;
                height: 100vh;
                margin: 0;
            }

            .full-height {
                height: 100vh;
            }

            .flex-center {
                align-items: center;
                display: flex;
                justify-content: center;
            }

            .position-ref {
                position: relative;
            }

            .top-right {
                position: absolute;
                right: 10px;
                top: 18px;
            }

            .content {
                text-align: center;
            }

            .title {
                font-size: 84px;
            }

            .links > a {
                color: #636b6f;
                padding: 0 25px;
                font-size: 13px;
                font-weight: 600;
                letter-spacing: .1rem;
                text-decoration: none;
                text-transform: uppercase;
            }

            .m-b-md {
                margin-bottom: 30px;
            }
        </style>
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
<div class=container>
    <div class=row>
        <div class="terminal">
            <div class="terminal-header">GrepAwk Prompt</div>
            <div class=tbody-container>
             <div class="terminal-body" id=tbody>
        <div class='tline'></div>
        <div class='tline'></div>
        <div class='tline'></div>
        <div class='tline'></div>
                <div class='tline text-center'>Welcome</div>
        <div class='tline text-center'>To</div>
        <div class='tline text-center'>GrepAwk Prompt</div>
        <div class='tline'></div>
        <div class='tline'></div>
        <div class='tline'></div>
        <div class='tline'></div>
             </div>
             <div class='prompt tline'>
                <span class='carrot'>></span>
                <span class=stdin><input style='background-color:black;color:white;outline:none;' tabindex="1" autofocus="autofocus" id='stdin' type='text'></span>
                <span class=cursor>&nbsp;</span>            
             </div>
            </div> <!-- end of tbody-container -->
        </div>
    </div><!-- end of termianl -->
<div class=debug style='width:100%'>
</div>
        </div>
    </body>
<script>
$('#stdin').focus();
Echo.channel('pub-channel')
    .listen('ServerEvent', (e) => {
        console.log(e.update);
    });
</script>
</html>
