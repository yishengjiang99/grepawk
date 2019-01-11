<?php
function ob_end_clean_all() {
    $handlers = ob_list_handlers();
    while (count($handlers) > 0 && $handlers[count($handlers) - 1] != 'ob_gzhandler' && $handlers[count($handlers) - 1] != 'zlib output compression') {
        ob_end_clean();
        $handlers = ob_list_handlers();
    }
}
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
