<?php
/*
    yet another attempt at writing vfs
*/
namespace App;

use Illuminate\ Database\ Eloquent\ Model;
use Illuminate\ Support\ Facades\ Storage;
use Auth;
use DB;

class FileSystem extends Model {
    private const virtual_fs = [
        'data' => [
            '_storage' => 'psql',
        ],
        'search' => [
            '_storage' => 'search',
            'page_ranks'=>[
                '_storage'=>'psql'
            ]
        ],
        'facebook' => [
            '_storage' => 'facebook',
            'top_users' => [
                '_storage' => 'psql'
            ]
        ],
        'dropbox' => [
            '_storage' => 'dropbox'
        ],
        'myfiles' => [
            '_storage' => 'filesystem'
        ],
        'public' => [
            '_storage' => 'filesystem'
        ],
    ];
    private static $_k = [];

    private $pwd = "root";
    private $root_node=null;
    private $current_node=null;
    private $privateDir = "guest";
    private $userName = "guest";

    public function __construct($username){
        $this->username=$username;
        $this->private_dir = $username ? str_replace(" ", "_", $username) : "guest";
        $this->root_node = new Folder("root","vfs");
        $this->root_node->set_fs($this);
        $this->root_node->setVFS(self::virtual_fs);
        $this->current_node=$this->root_node;
        if(session('pwd')) {
            $this->setPWD(session('pwd'));
         }
    }

    public static function getInstance() {
        if (Auth::user() !== null) {
            return self::makeInstance(Auth::user() -> username);
        } else {
            return self::makeInstance();
        }
    }
    public static function makeInstance($userName = 0) {
        if (!isset(self::$_k[$userName])) {
            self::$_k[$userName] = new Filesystem($userName);
        }
        return self::$_k[$userName];
    }
    public function private_dir(){
        return $this->private_dir;
    }
    public function get_fs_path() {
        return $this->current_node->fs_path();
    }
    public function ls($options="") {
        $options = explode(" ", $options);
        return $this->_ls($this->pwd,$options);
    }
    public function _ls($path, $options){  
        $list = $this->current_node->ls_children();
        if (in_array("-h", $options)) {
            $output = "";
            foreach($list as $name => $attr) {
                if (substr($name, 0, 1) === '_') continue;
                $is_file = isset($attr['_type']) && $attr['_type'] === 'file';
                $is_folder = !$is_file;
                $display = $is_folder ? $name : $name;
                $output .= $display." ";
            }
            return $output;
        }

        if (in_array("-t", $options)) {
            $options = [];            
            switch ($this->current_node->storage_type) {
                case 'filesystem':
                    $options[] = ['cmd' => 'ls', 'display' => 'List Files', 'link' => "onclick:msg=ls"];
                    $options[] = ['cmd' => 'new', 'display' => 'Create a new text file', 'link' => "onclick:new"];
                    $options[] = ['cmd' => 'upload', 'display' => 'Upload a file of any type', 'link' => "onclick:upload"];
                    break;
                case 'search':
                    $options[] = ['cmd' => 'search {term}', 'display' => 'search {term}', 'link' => "onclick:msg=seach <prompt>"];
                    break;
                default:
                    break;
            }
            foreach($list as $child) {
                $is_folder = strpos($child->get_mime_type(),"vfs_folder") !==false;
                $mimeType = $child->get_mime_type();
                $name = basename($child->path);
                if ($is_folder) {
                    $options[] = ['cmd' => "cd $name", "mimetype"=>$mimeType, 'type' => 'folder', 'display' => "Open folder $name", 'link' => "onclick:cd ".urlencode($name)];
                } else {
                    $options[] = ['cmd' => "cat $name", "mimetype"=>$mimeType, 'type' => $mimeType, 'display' => "Download or view file", 'link' => "onclick:cat ".urlencode($name)];
                }
            }
            return ['headers' => ['cmd', 'display', 'mimetype','link'], 'rows' => $options];
        }
        if (in_array("-o", $options)) {
            $options = [];
            $options[] = 'ls';
            $options[] = 'new';
            $options[] = 'upload';
            foreach($list as $name => $attr) {
                if (substr($name, 0, 1) === '_') continue;
                $is_file = isset($attr['_type']) && $attr['_type'] === 'file';
                $is_folder = !$is_file;
                $options[] = $is_folder ? "cd $name" : "get $name";
            }
            return $options;
        }
        if (in_array("-j", $options)) {
            $hints = [];
            foreach($list as $name => $attr) {
                if (substr($name, 0, 1) === '_') continue;
                $hints[] = $name;
            }
            return $hints;
        }
        return ['xpath' => explode("/", $this -> cd), 'list' => $list];
    }
    public function cat($filename) {
        if (substr($filename, 0, 1) == '/') {
            $filepath = $filename;
        } else {
            $filepath = $this -> get_fs_path().
            "/".$filename;
        }

        if (!Storage::exists($filepath)) throw new\ Exception("$filename does not exist on fs");
        $mimetype = Storage::mimeType($filepath);

        $geturl = url("stdin")."?msg=".urlencode("get $filepath");

        if (strpos($mimetype, "image") !== false) {
            return ['text_output' => "Displaying $filename as image.", 'image_link' => $geturl];
        } else if ($mimetype === "text/html") {
            return ['text_output' => "Displaying $filename in preview iframe.", 'iframe_link' => $geturl];
        } else if (strpos($mimetype, "text") !== false) {
            $output = "<b>$filename</b>";
            $output .= "<br><br>";
            $output .= "<p><pre>".Storage::get($filepath)."</pre></p>";
            return ['text_output' => $output];
        } else {
            return ['text_output' => "Downloading $filename", 'download_link' => $geturl];
        }
    }

    public function put($filename, $content) {
        $filePath = $this -> get_fs_path()."/".$filename;
        return Storage::put($filePath, $content);
    }
    public function getPWD() {
        return $this->pwd;
    }
    public function setPWD($pwd) {
        if($pwd==='root'){
            $this->pwd=$pwd;
            $this->current_node=$this->root_node;
        }
    
        $pwd_parts = explode("/",$pwd);
        $node = $this->root_node;
        foreach($pwd_parts as $part){

            if($part==='root') continue;
            $node=$node->cd($part);
        }
        $this->pwd = $node->path;
        $this->current_node = $node;
        session(["pwd" => $this->pwd]);
    }
    public function cd($todir) {
        if($todir==='/'){
            $this->setPWD('root'); 
        }elseif(substr($todir,0,1)==='/'){//using absolute path
            $todir="root".$todir;
            $this->setPWD($todir); 
        }else{
            $this->setPWD($this->getPWD()."/".$todir);
        }
        return $this->getPWD();
    }
}
