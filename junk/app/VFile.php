<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class VFile extends Model
{
    //file obj


    public $storage_type;
    public $full_path; // full path
    public $mimeType;
    public $attributes;

    private static $_k; //cached singleton
    
    public static function getInstance($full_path,$storage_type=""){
        if(!isset(self::$_k[$full_path])){
            self::$_k[$full_path]=new VFile($full_path,$storage_type);
        }
        
        return self::$_k[$full_path];
    }
    public function __construct($full_path,$storage_type){
        $this->full_path=$full_path;
        $this->storage_type=$storage_type;
        $this->attributes=[];
    }

    public function init(){
        switch($this->storage_type){
            case 'filesystem': 
                $this->mimeType=Storage::mimeType($this->full_path);
            default:
                $this->mimeType="vfs/".$this->storage_type;
        }
    }
}
