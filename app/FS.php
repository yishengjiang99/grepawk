<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use File;
use Illuminate\Support\Facades\Storage;

class FS extends Model
{
    //
    public static function ls($cd){
        $output="";
        $files = Storage::files($cd);
        $dirs  = Storage::directories($cd);
        $hints=[];

        foreach($dirs as $dir){
            $dir=str_replace($cd."/","",$dir);
            $hints[]=$dir;
            $output.=$dir."/ ";
        }
        foreach($files as $file){
            $file=str_replace($cd."/","",$file);
            $hints[]=$file;

            $output.=$file." ";
        }
        return [$hints,$output];
    }    

}
