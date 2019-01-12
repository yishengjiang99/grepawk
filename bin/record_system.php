<?php

$fp=fopen("~/Dropbox/grepawk/proc/cpuinfo",'r');
while($l =fgets($fp)){
  echo "\n".$l;
}

