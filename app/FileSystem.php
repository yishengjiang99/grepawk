<?php
/*
    yet another attempt at writing vfs
*/
namespace App;

use Illuminate\ Database\ Eloquent\ Model;
use Illuminate\ Support\ Facades\ Storage;
use Auth;
use DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class FileSystem extends Model {
   public static $virtual_fs = [
        'data' => [
            '_storage' => 'psql',
            'children'=>       ['json','csv','html','queries','database','live', 'intro'],
            'children_storage' =>['json','csv','html','json', 'psql','stream','html'],
            'path'=>'{storage_path}/root/data'
        ],
        'dropbox' => [
            '_storage' => 'filesystem',
            'children'=>['private','public','index_page','queries','tools'],
            'children_storage' =>['dropbox','dropbox','html','queries','bin'],
            'path'=>'~/Dropbox/grepawk'
        ],
        'myfiles' => [
            '_storage' => 'filesystem',
            'path'=>'{storage_path}/{USERNAME}',
        ],
        'controllers' => [
            '_storage' => 'filesystem',
            'path'=>'{app_path}/app/http/Controllers/',
        ],
        'ui' => [
            '_storage' => 'filesystem',
            'path'=>'{app_path}/app/resources/views',
        ],
    ];

    public static $full_vfs_map;

    public static function init_vfs(){
      if(!self::$full_vfs_map) {
        $xpaths =[];
        $mimetypes=[];
        $meta_list=[];
        $base_path="/root";
        $max_ls_depth=5;
        foreach(self::$virtual_fs as $name=>$attributes){
            $base_path=$base_path."/".$name;
            $xpaths[]=$base_path;
            $mimetypes[]=$attributes['_storage'];
            $newmeta=$attributes ? $attributes : [];
            $meta_list[]=$newmeta;
            // echo "<br>adding ".json_encode($newmeta);
            // echo "adding ".$attributes['_storage'];
            // echo "<br>";
            if(isset($attributes['children'])){
                foreach((Array)$attributes['children'] as $i=>$child){
                    // echo "adding ".$attributes['children_storage'][$i];
                    // echo "<br>";
                    $xpaths[]=$base_path."/".$child;
                    $mimetypes[]=$attributes['children_storage'][$i];
                    $meta_list[]=$newmeta; //inherits parent meta
                } 
            }
        }
        foreach($xpaths as $i=>$path){
            //add subfolders based on vfs properties.
            $parent_path = $path;
            $storage = $mimetypes[$i];
            $meta=$meta_list[$i];
            switch($storage){
                case 'html':
                case 'csv':
                case 'json':
                case 'image':
                    $file_filter="|grep $storage";
                case 'filesystem':
                    $file_filter="";
                    $os_path = str_replace('{app_path}',app_path(), $meta['path']);
                    $folders=[];
                    $os_query="ls -l $file_filter |tail -n +2|awk '{print $9}' |xargs file --mime-type";
                    $os_info=[];
                    exec($os_query,$os_info);
                    echo "<pre>";
                    var_dump($os_info);

                    foreach($os_info as $os_info_item){
                        var_dump($os_info_item);

                        if(strpos($os_info_item,": ")===false) continue;
                        list($filename,$_mimetype)=preg_split('/\:\s+/', $os_info_item);;
                 
                        echo "<br>filename $filename <br>os-item $os_info_item";
                        $xpaths[]=$parent_path."/".trim($filename);
                        $mimetypes[]=trim($_mimetype);
                    }
                    break;
                case 'html':
                case 'csv':
                case 'json':
                case 'image':
                    
                    
                    
                default:
                    continue;
                    break;
            }
        }
      }
exit;
      return [$xpaths,$mimetypes];
    }

    private static $_k = [];

    private $pwd = "root";
    private $root_node=null;
    public $current_node=null;
    private $privateDir = "guest";
    private $userName = "guest";

    public function __construct($username){
        $this->username=$username;
        $this->private_dir = $username ? str_replace(" ", "_", $username) : "guest";

        $this->root_node = new Folder("root","vfs");
        $this->root_node->set_fs($this); //FileSystem Object..
        $this->root_node->setVFS(self::$virtual_fs); //associative array
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
    public function get_system_path($filename) {
        return storage_path('app/'.$this->current_node->fs_path()."/".$filename); 
    }
    public function ls($options="") {
        $options = explode(" ", $options);
        return $this->_ls($this->pwd,$options);
    }
    public function pwd_meta(){
        $meta=[];
        switch ($this->current_node->storage_type) {
            case 'filesystem':
                break;
            case 'search':
                break;
            case 'psql':
                break;
            case 'psql_table':
                $columns = Schema::getColumnListing($this->current_node->get_db_ns());
                $meta['cols'] = array_values(array_diff($columns,['id','created_at','updated_at']));
                break;
            default:
                break;
        }
        return $meta;
    }
    public function _ls($path, $_options){  
        $list = $this->current_node->ls_children();
        if (in_array("-h", $_options)) {
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

        if (in_array("-o", $_options)) {
            $options = [];        
            if($this->current_node->parent !==null ){
                $options[]= ['cmd'=>'cd ..', 'display'=>'Go to parent folder'];
            }
            $options[] = ['cmd' => 'ls', 'display' => 'List Files'];
            $options[] = ['cmd' => 'upload', 'display' => 'List Files'];

            switch ($this->current_node->storage_type) {
                case 'filesystem':
                    $options[] = ['cmd' => 'new', 'display' => 'Create a new text file'];
                    $options[] = ['cmd' => 'upload csv', 
                    'display' => "Import an Excel spread sheet and save it to db",
                    ];
                    break;
                case 'search':
                    $options[] = ['cmd' => 'search {term}', 'display' => 'search {term}'];
                    $options[] = ['cmd' => 'upload csv', 
                        'display' => "Import an Excel spread sheet and save it to db",
                    ];
                    break;
                case 'psql':
                    $options[] = ['cmd' => 'createtable {tablename}', 'display' => 'create a new table'];
                    $options[] = ['cmd' => 'upload csv', 
                    'display' => "Import an Excel spread sheet and save it to db",
                    ]; 
                    break;
                case 'psql_table':
                    $options[] = ['cmd' => 'newdata', 'display' => 'Insert a row'];
                    $options[] = ['cmd' => 'select {column} from ', 'display' => 'Select tatemenbt'];
                    break;
                default:
                    break;
            }
            
            return ['headers' => ['cmd', 'display', 'mimetype'], 'rows' => $options];
        }
        if (in_array("-t", $_options) || in_array("-j", $_options)) {
            $rows=[];
            $headers=[];
            $second_arg=[];
            if($this->current_node->storage_type==='psql_table'){
                $second_arg[]=$this->current_node->get_db_ns();
                $second_arg[]="from";
                foreach($list as $child) {
                    if($child->content===null) continue;
                    $content = $child->content;
                    foreach((Array)$child->content as $header=>$val){
                        if(!isset($headers[$header])){
                            $second_arg[]=$header;
                            $headers[$header]=1;
                        }
                    }
                    $rows[]=$child->content;
                }
                if(in_array("-t", $_options)){
                    return ['headers' => array_keys($headers), 'rows' => $rows];
                }                
                if (in_array("-j", $_options)) {
                    return $second_arg;
                  }
            }else{
                foreach($list as $child) {
                    $mimeType = $child->get_mime_type();
                    $is_folder = strpos($mimeType,"folder") !==false;
                    $is_row = strpos($mimeType,"_row") !==false;
                    if($is_row) continue;
                    $name = basename($child->path);
                    $second_arg[]=$name;
                    if ($is_folder) {
                        $rows[] = ['cmd' => "cd $name", "mimetype"=>$mimeType, 'type' => 'folder', 'display' => "Open folder $name", 'link' => "onclick:cd ".urlencode($name)];
                    } else {
                        $rows[] = ['cmd' => "cat $name", "mimetype"=>$mimeType, 'type' => $mimeType, 'display' => "Download or view file", 'link' => "onclick:cat ".urlencode($name)];
                        if(strpos($name,'.csv')!==false){
                            $cmd="convert $name ".basename($name,".csv");
                            $rows[] = [
                                'cmd' =>$cmd,
                                'display' => "Convert $name into psql table ".basename($name,".csv"), 
                                'link' => "onclick:".$cmd
                            ];

                        }
                    }
                    foreach($rows as &$row){
                        if(isset($row['link'])){
                            $cmd=$row['cmd'];
                            $row['cmd']="<a style='color:yellow' href='#' cmd='$cmd' class='onclick_cmd'><b>$cmd</b></a>";
                            unset($row['link']);
                        }
                    }
                }
                if (in_array("-j", $_options)) {
                  return $second_arg;
                }
                return ['headers' => ['cmd', 'display', 'mimetype'], 'rows' => $rows];
            }
        }
        //return ['xpath' =>$this->getPWD(), 'list' => $list];
    }
    public function cat_1_11($filename){
         
    }
    public function get_mime_type($filename){
        $ext = pathinfo($filename, PATHINFO_EXTENSION);
        return 'vfs/'.$ext;
    }
    public function cat($filename) {
        if (substr($filename, 0, 1) == '/') {
            $filepath = $filename;
        } else {
            $filepath = $this -> get_fs_path()."/".$filename;
        }

        if (!Storage::exists($filepath)) throw new\ Exception("$filename does not exist on fs");
        
        $mimetype = $this->get_mime_type($filename);

        if($filepath)
            $geturl = url("stdin")."?msg=".urlencode("get $filepath");
        
        if (strpos($mimetype, "image") !== false) {
            return ['text_output' => "Displaying $filename as image.", 'image_link' => $geturl];
        } else if ($mimetype === "text/html") {
            return ['text_output' => "Displaying $filename in preview iframe.", 'iframe_link' => $geturl];
        }else if (strpos($mimetype, "csv") !== false || strpos($mimetype, "text") !== false){
            $content = Storage::get($filepath);
            $content = preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', $content);
            $content = str_replace("\n","<br>",$content);
            $output = "<b>$filename</b>";
            $output .= "<br>".$content;
            return ['text_output' => $output];
        }else {
            return ['text_output' => "Downloading $filename", 'download_link' => $geturl];
        }
    }
    public function create_db_table($tablename,$columns){
        $db_ns = $this->current_node->get_db_ns();
        $tablename=$db_ns.$tablename;
        if(Schema::hasTable($tablename)){
            return $tablename;
        }
        Schema::create($tablename, function(Blueprint $table) use($columns){
            $table->increments('id');
            foreach($columns as $col){
                list($name,$type) = explode(" ",$col);
                $type=trim($type);
                switch ($type){
                    case 'int': $table->integer($name); break;
                    case 'decimal': $table->decimal($name); break;
                    case 'date':  $table->timestampTz($name); break;
                    case 'string': $table->char($name,255); break;
                    default: throw new \Exception("Supported column types are: int, decimal, string, date");
                }
            }
            $table->timestamps();
        });
        return $tablename;
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
            // echo $this->getPWD()."/".$todir;
            // exit;
            $this->setPWD($this->getPWD()."/".$todir);
        }
        $pwd= $this->getPWD();
        return $pwd;
    }
}
