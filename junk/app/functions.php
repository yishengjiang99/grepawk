<?php

function test(){
  echo 'dh';
}
function js_callback($string,$type='output'){
  $cbstr=json_encode([$type=>$string]);
  echo "<script>parent.iframe_interface('$cbstr')</script>" ;
  echo "<br>";
  flush();
  ob_flush();
}
