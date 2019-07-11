<html>
  <body>
    <!-- Add a placeholder for the Twitch embed -->
    <div id="twitch-embed">Loading..</div>

    <!-- Load the Twitch embed script -->
    <script src="https://embed.twitch.tv/embed/v1.js"></script>

    <!-- Create a Twitch.Embed object that will render within the "twitch-embed" root element. -->
    <script type="text/javascript">
      new Twitch.Embed("twitch-embed", {
        width: 854,
	layout:'video',
        height: 480,
        channel: "ragnus_the_orc"
      });
    </script>
  </body>
</html>
