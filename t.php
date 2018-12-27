<?php
  require __DIR__ . '/vendor/autoload.php';

  $options = array(
    'cluster' => 'us2',
    'useTLS' => true
  );
  $pusher = new Pusher\Pusher(
    'a2f9344a5d41cf02de16',
    '63b995bc53c2901a60fa',
    '679759',
    $options
  );

  $data['message'] = 'hello world';
  $pusher->trigger('pub-channel', 'ServerEvent', $data);
?>
