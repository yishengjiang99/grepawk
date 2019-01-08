<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Storage;
use Closure;
use DB;

class VFile extends Model
{
    //file obj


    public $storage_type;
    public $full_path; // full path
    public $mimeType;
    public $attributes;
    public $std_out; 
    public $std_out_pipe_name;    
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
            
                $this->mimeType="csv";
                break;
            default:
                $this->mimeType="vfs/".$this->storage_type;
                break;
        }
        $this->std_out="-";
    }
    public function pipe(Closure $closure)
    {
        $this->std_out=$closure;
    }
    public function pipe_msg($name){
        $this->std_out_pipe_name=$name;
    }

    public function head_fs($n=10,$stream=true){
        $path = "/usr/local/var/www/blog/storage/app/".$this->full_path;
        $fp = fopen($path,'r');
        $ob=[];
        while($l=fgets($fp)){
            if(trim($l)=="") continue;
            $ob[]=$l;
            $this->std_out($l);
            if($n--==0) break;
        }
        fclose($fp);
        return $ob;
    }
    public function cat_fs(){
        $path = "/usr/local/var/www/blog/storage/app/".$this->full_path;
        $fp = fopen($path,'r');
        $ob=[];
        while($l=fgets($fp)){
            $this->std_out($l);
            $ob[]=$l;
        }
        return $ob;
    }
    public static function insert_csv_db($dbname,$csvline,$columns){
        $columnvals = str_getcsv($csvline);
        if(count($columnvals) !== count($columns)){
            throw new \Exception("Column name mismatch for $dataline. Columns are ".implode(", ",$columns));
        }
        $colvalMap=[];
 
        foreach($columns as $i=>$col){
            $colvalMap[$col]=$columnvals[$i];
        }
        $colvalMap['created_at']=new \DateTime();
        return DB::table($dbname)->insert($colvalMap);
    }
    public function std_out($line){
        if($this->std_out_pipe_name){
            $parts = explode(' ',$this->std_out_pipe_name);
            $cmd=$parts[0];
            $argv1=isset($parts[1]) ? $parts[1] : '';
            if($cmd=='insert_sql'){
                $tablename=$argv1;

            }
        }else{
            switch($this->std_out){
                case '-': echo $line; break;
                default:
                    $this->std_out($line);
                    break;
            }
        }
    }
    public function std_in($line,$pipe){
        switch($this->storage_type){
            case 'sql':
            case 'psql':
                break;
        }
    }
    
    public function proc_pipe($pipe,$line){

    }
}
