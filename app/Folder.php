<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Storage;
use DB;

class FolderException extends \Exception{

}

class Folder extends Model
{
    public static $_map=[];
    private $path="";
    private $name="";
    private $storage_type="filesystem";
    private $children=null;
    private $fs_base_path =null;
    private $parent=null;
    public $dirty=false;
    public $mimeType = 'folder';
    public $vfs = []; //virtual fs map
    
    public function __construct($path, $storage_type, Array $vfs=null){
        $this->path=$path;
        $this->name = $this->path;
        $this->storage_type=$storage_type;
        $this->fs_full_path= storage_path()."/app".$this->path;
        if($this->storage_type=="file"){
            $this->mimeType=Storage::mimeType($this->path);
        }
        $this->children=[];
    }
    public function init(){
        $this->ls_children();
    }
    public function init_children_from_vfs(){
        if(!$this->vfs) return;
        foreach($this->vfs as $name=>$attributes){
            if (substr($name, 0, 1) === '_') continue; //meta data
            $storageType = isset($attributes['_storage']) ? $attributes['_storage'] : 'vfs';
            
            $child_path=$this->path."/".$name;
           $this->addChild($storageType,$child_path)->setVFS($attributes);
        }
    }
    public function ls_children(){
        //if($this->children!==null && $this->dirty===false) return $this->children; 
        switch($this->storage_type){
            case 'filesystem':
                $dirs = Storage::disk('local')->directories($this->path);
                foreach($dirs as $dir){
                    $this->addChild('filesystem', $this->path."/".$dir);
                }
                $files = Storage::files($this->path);
                foreach($files as $filename) {
                    $this->addChild('file', $this->path."/".$filename);
                }
                break;
            case 'psql':
                $table_ns = $this->this_path;
                $table_ns = "";
                $tables = DB::connection('pgsql') -> select("select table_name from information_schema.tables where table_schema='public' and table_name like '$table_ns%'");
                foreach($tables as $table){
                    $this->addChild('psql_table', $this->path."/".$table->table_name);
                }
                break;
            case 'file':
                //no children
                break;
            default: break;
        }
        return $this->children;
    }
    
    public function setVFS($vfs){
        $this->vfs=$vfs;
        $this->init_children_from_vfs();
        return $this;
    }

    public function addChild($type,$path){
        if(strpos($path,$this->path)===false) {
            throw new FolderException("Child Path $path does not stem from parent path ".$this->path);
        }
        $leaf_path = str_replace($path,"",$this->path);
        if(isset($this->children[$leaf_path])){
            
            //throw new FolderException("Folder $path already exists");
        }
        if(!$this->children) $this->children=[];
        $newChild= new Folder($path,$type);
        $newChild->parent=$this;
        $this->children[$leaf_path]=$newChild;
        return $this->children[$leaf_path];
    }
    public function hasChild($name){
        return isset($this->children[$name]);
    }
    
    public function cd($folderName){
        if($folderName ==='.') return $this;
        if($folderName == "..") return $this->parent ? $this->parent : $this;

        if($this->hasChild($folderName)==false){
            throw new FolderException("$folderName does not exist on ".$this->path);
        }
        if($this->children[$folderName]->mimeType !=='folder'){
            throw new FolderException("$folderName is a file");
        }
        return $this->children[$folderName];
    }
    //
}
