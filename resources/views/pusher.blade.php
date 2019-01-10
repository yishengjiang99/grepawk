<!DOCTYPE html>
<head>
  <script src="https://js.pusher.com/4.3/pusher.min.js"></script>
  <script>
    Pusher.logToConsole = true;

    var pusher = new Pusher('a2f9344a5d41cf02de16', {
      cluster: 'us2'
    });
    var channel = pusher.subscribe('pub-channel');
    channel.bind('App\\Events\\ServerEvent', function(data) {
      parent.iframe_interface(data);
    });
    
</script>
</head>
<body>
</body>
</html>
