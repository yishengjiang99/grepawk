<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="chrome=1" />
    <title>HTML5 Web Terminal</title>

    <link href="https://fonts.googleapis.com/css?family=Inconsolata"
          rel="stylesheet" type="text/css" />
     <link href="{{ asset('css/cmd.css') }}" rel="stylesheet">

    <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
        <script src="../js/cmd.js"></script>
  </head>
  <body>
    <div id="container">
      <output></output>
      <div id="input-line" class="input-line">
        <div class="prompt"></div><div><input class="cmdline" autofocus /></div>
      </div>
    </div>
        <script src="../js/terminal.js"></script>
  </body>
</html>
