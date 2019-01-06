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
    public $path="";
    public $name="";
    public $storage_type="filesystem";
    private $children=null;
    private $fs_base_path =null;
    private $parent=null;
    private $fs=null;
    public $dirty=false;
    public $mimeType = 'folder';
    public $vfs = []; //virtual fs map
    
    public function __construct($path, $storage_type, Array $vfs=null){
        $this->path=$path;
        $this->name = basename($this->path);
        $this->storage_type=$storage_type;
        $this->fs_full_path= storage_path()."/app"."/".$this->path;
        $this->children=[];
    }
    public function init(){
        $this->ls_children();
    }
    public function fs_path(){
        $path=$this->path;
        // echo "<br><br>";
        // echo debug_backtrace()[1]['function'];
        // echo "<br>".debug_backtrace()[2]['function'];
        // echo "<br>".debug_backtrace()[3]['function'];

        // echo "<br>DEBUG<BR>".$path;
        $path = str_replace("root/public", "public", $path);
       // echo "<br>".$path;

        $path = str_replace("root/myfiles", $this->get_fs()->private_dir(), $path);
        return $path;
    }
    public function get_db_ns(){
        return str_replace("/", "_", $this->path);
    }
    public function set_fs($fs){
        $this->fs=$fs;
    }
    public function get_fs(){
        if(!$this->fs && !$this->parent){
            throw new FolderException("Folder ".$this->path." has no fs or parent");
        }
        return $this->fs ? $this->fs : $this->parent->get_fs();
    }
    public function get_mime_type(){
        if($this->storage_type=="file"){
            return Storage::mimeType($this->fs_path());
        }else{
            return "vfs_folder/".$this->storage_type;
        }
    }
    public function init_children_from_vfs(){
        foreach($this->vfs as $name=>$attributes){
          //  echo "<br>looking $name";
            if (substr($name, 0, 1) === '_') continue; //meta data
           // echo "<br>adding $name";

            $storageType = isset($attributes['_storage']) ? $attributes['_storage'] : 'vfs';
            $child_path=$this->path."/".$name;
            $c=$this->addChild($storageType,$child_path); //->setVFS($attributes);
            $c->setVFS($attributes);
         //   print_r($attributes);

        }
        //echo "<br>done for child from  vfs for ".$this->path;

    }
    public function ls_children(){
        //echo "<br>ls childrent";

        //var_dump($this->children);
        //if($this->children!==null && $this->dirty===false) return $this->children; 
        switch($this->storage_type){
            case 'filesystem':
                $dirs = Storage::directories($this->fs_path());
                foreach($dirs as $dir){
                    $dir=basename($dir);
                  //  echo "<br>add child ".$this->path."/".$dir;
                    $this->addChild('filesystem', $this->path."/".$dir);
                }
                $files = Storage::files($this->fs_path());
                foreach($files as $filename) {
                    $filename = basename($filename);
                
                   // echo "<br>add child file $filename to path ".$this->path;
                    
                    $this->addChild('file', $this->path."/".$filename);
                }
                break;
            case 'psql':
                $table_ns = $this->get_db_ns();
               // $table_ns = "";
                $sql="select table_name from information_schema.tables where table_schema='public' and table_name like '$table_ns%'";
                $tables = DB::connection('pgsql') -> select($sql);
                foreach($tables as $table){
                    $childPath = str_replace("_","/",$table->table_name);
                    $this->addChild('psql_table', $childPath);
                }
                break;
            case 'file':
                //no children
                break;
            default: break;
        }
        return $this->children;
    }
    public function get_folder_cmds(){
        switch($this->storage_type){
            case "filesystem":
        }
    }
    public function setVFS($vfs){
        $this->vfs=$vfs;
        $this->init_children_from_vfs();
        return $this;
    }

    public function addChild($type,$path){
      //  echo "<br>adding child at $path";
        if(strpos($path,$this->path)===false) {
            throw new FolderException("Child Path $path does not stem from parent path ".$this->path);
        }
        $leaf_path = str_replace($this->path."/","",$path);
        if(isset($this->children[$leaf_path])){
            //throw new FolderException("Folder $path already exists");
        }
        if(!$this->children) $this->children=[];
        $newChild= new Folder($path,$type);
      //  echo "<br> addoing children at $leaf_path for ".$this->path;
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
        $this->children[$folderName]->ls_children();
        return $this->children[$folderName];
    }
    //
}

