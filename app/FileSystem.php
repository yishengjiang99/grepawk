<?php
/*
    yet another attempt at writing vfs
*/
namespace App;

use Illuminate\ Database\ Eloquent\ Model;
use Illuminate\ Support\ Facades\ Storage;
use Auth;
use DB;
use Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class FileSystem extends Model {

    public static $virtual_fs_next = 
    [
        '/root'=>             'vfs/root',
        '/root/data'=>        'vfs/psql,vfs/csv,json,html,rss',
        '/root/bin'=>         'nodejs,php,python,sh,api,github,sql-select',
        '/root/html'=>        'text,html,image',
        '/root/myfiles'=>     'symlink',
        '/root/remote'=>      'folder',
        '/root/dropbox'=>     'symlink',
        '/root/tickers/weather' => 'latest',
        '/root/tickers/{username}/'=>'symlink',
        '/root/cronjobs'=>    '',
    ];

    public static $virtual_fs = [
        'data' => [
            '_storage' => 'psql',
            'children'=>       ['json','csv','html','queries','database','live', 'intro'],
            'children_storage' =>['json','csv','html','json', 'psql','stream','html'],
            'path'=>'{storage_path}/root/data'
        ],
        'files'=>[
            '_storage'=>'filesystem',
            'path'=>'{storage_path}/public'
        ],
        'dropbox' => [
            '_storage' => 'symlink',
            'ln_target'=>'~/Dropbox/grepawk',
            'path'=>'{ln_target}'
        ],
        'controllers' => [
            '_storage' => 'filesystem',
            'path'=>'{app_path}/http/Controllers/',
        ],
        'initd' => [
            '_storage' => 'filesystem',
            'path'=>'/etc/init.d/',
        ],
        'ui' => [
            '_storage' => 'filesystem',
            'path'=>'{app_path}/../resources/views',
        ],
    ];


    public static $full_vfs_map;


    public static function init_vfs(){
      if(!self::$full_vfs_map) {
        $xpaths =[];
        $mimetypes=[];
        $meta_list=[];
        $base_path="/root";
        $xpaths[]='/root';
        $mimetypes[]='vfs/root';
        $meta_list[]=[];
        $max_ls_depth=5;
        $list_index=0;
        foreach(self::$virtual_fs as $name=>$attributes){
            $folder_path=$base_path."/".$name;
            $xpaths[]=$folder_path;
            $mimetypes[]=$attributes['_storage'];
            $newmeta=$attributes ? $attributes : [];
            if(isset($newmeta['path'])){
                $os_path= $newmeta['path'];
                $os_path = str_replace('{app_path}', app_path(), $os_path);
                $os_path = str_replace('{storage_path}', storage_path(),$os_path);
                if($attributes['_storage']==='symlink'){
                    $os_path = str_replace('{ln_target}',$newmeta['ln_target'], $os_path);
                }
                $meta['os_path']=$os_path;
           
            }else{
                $meta['os_path']="";
            }
            $meta_list[]=$newmeta;
            if(isset($attributes['children'])){
                foreach((Array)$attributes['children'] as $i=>$child){
                    $xpaths[]=$folder_path."/".$child;
                    $mimetypes[]=$attributes['children_storage'][$i];
                    $meta_list[]=["ref:"=>$list_index,];  //parent meta
                } 
            }
            $list_index++;
        }
        self::$full_vfs_map=[$xpaths,$mimetypes,$meta_list];
      }
      return self::$full_vfs_map;
    }

    public function ls($_options, $cd=""){
        if($cd){
            $pwd=$this->cd($cd);
        }
    }
    public function ls_j($args){
        if(true){
            $nodes=[];
            $node_types=[];
            $myrank = count(explode("/",$this->pwd));
            $xpath_map = $this->xpath_map;
            $path_index = $xpath_map[$this->pwd];
            $my_mimetype=$this->vfs[1][$path_index];
            $my_meta = $this->vfs[2][$path_index];
            $storage = $my_meta['_storage'];
            $os_path = $my_meta['os_path'];


            foreach($this->vfs[0] as $index=>$path){
                $rank = count(explode("/",$path));
                if($rank!== $myrank+1) continue;
                if(dirname($path)!==$this->pwd) {
                    continue;
                }
                $mimetype = $this->vfs[1][$index];
                $meta =$this->vfs[2][$index];
                $nodes[]=basename($path);
                $node_types[]=$mimetype;
            }
            if(isset($my_meta['path'])){
                $os_path = $my_meta['os_path'];
            }
            switch($storage){
                case 'symlink':
                    $os_path = str_replace('{ln_target}',$meta['ln_target'], $os_path);
                case 'html':
                case 'csv':
                case 'json':
                case 'image':
                    $file_filter="|grep $storage";
                case 'filesystem':
                    $file_filter="";
                    $folders=[];
                    if(!$os_path) continue;
                    $os_query="cd $os_path && ls -l $file_filter |tail -n +2|awk '{print $9}' |xargs file --mime-type";
                    Log::debug($os_query);
                    $os_info=[];
                    exec($os_query,$os_info);
                    foreach($os_info as $os_info_item){
                        if(strpos($os_info_item,": ")===false) continue;
                        list($filename,$_mimetype)=preg_split('/\:\s+/', $os_info_item);
                        $_mimetype="ls-".$_mimetype;
                        $xpaths[]=$parent_path."/".trim($filename);
                        $mimetypes[]=trim($_mimetype);
                        $meta_list[]=[
                            'os_path'=>$os_path."/".trim($filename),
                        ];
                    }
                    break;
                }
            self::$ls_cache=[
                'nodes'=>$nodes,
                'node_types'=>$node_types,
                'output'=>implode("\t",$nodes),
                'hints'=>$nodes,
                'options'=>self::cmd_options($this->pwd,$my_mimetype),
                'dl_links'=>[],
                'table'=>self::ls_table($my_mimetype,$nodes,$node_types)
            ];
        }

        if($args=='') return self::$ls_cache['output'];
        if($args=='-t') return self::$ls_cache['table'];
        if($args=='-o') return self::$ls_cache['options'];
        if($args=='-j') return self::$ls_cache['hints'];

        return $ret;
    }



    private static $folder_objs=[];

    private function ls_folder($os_path,$storage, &$nodes,&$node_types){
        $os_query="cd $os_path && ls -l $file_filter |tail -n +2|awk '{print $9}' |xargs file --mime-type";
        Log::debug($os_query);
       // echo $os_query;
       // echo "<br>";
        //exit;
        $os_info=[];
        exec($os_query,$os_info);

        switch($storage){
            case 'symlink':
                $os_path = str_replace('{ln_target}',$meta['ln_target'], $os_path);
            case 'html':
            case 'csv':
            case 'json':
            case 'image':
                $file_filter="|grep $storage";
            case 'filesystem':
                $file_filter="";
                $folders=[];
                if(!$os_path) continue;
                $os_query="cd $os_path && ls -l $file_filter |tail -n +2|awk '{print $9}' |xargs file --mime-type";
                Log::debug($os_query);
               // echo $os_query;
               // echo "<br>";
                //exit;
                $os_info=[];
                exec($os_query,$os_info);
                foreach($os_info as $os_info_item){
                    if(strpos($os_info_item,": ")===false) continue;
                    list($filename,$_mimetype)=preg_split('/\:\s+/', $os_info_item);
                    $_mimetype="ls-".$_mimetype;
                    $xpaths[]=$parent_path."/".trim($filename);
                    $mimetypes[]=trim($_mimetype);
                    $meta_list[]=[
                        'os_path'=>$os_path."/".trim($filename),
                    ];
                }
                break;
            case 'psql':
                $table_ns=str_replace("/", "_", $parent_path)."_f_"; 
  
                $sql="select table_name from information_schema.tables where table_schema='public' and table_name like '$table_ns%'";

                $tables = DB::connection('pgsql') -> select($sql);
                foreach($tables as $table){
                    $child_path =str_replace($table_ns,"",$table->table_name);
                    $full_path = $parent_path."/".$child_path;
                    //echo "<br> adding $full_path";
                    $xpaths[]=$full_path;
                    $mimetypes[]="psql_table";
                    $meta_list[]=[
                        'table_name'=>$table->table_name
                    ];
                }    

                break;
            case 'psql-table':
                break;  
            default:
                break;
        }
        return [$xpath,$mimetypes,$meta_list];
    }

    private static $_k = [];

    private $pwd = "root";
    private $root_node=null;
    public $current_node=null;
    private $privateDir = "guest";
    private $userName = "guest";
    public $xpath_map=[];


    public function __construct($username){
        $this->username=$username;
        $this->private_dir = $username ? str_replace(" ", "_", $username) : "guest";

        $this->vfs = self::init_vfs();
        $this->xpath_map = array_flip($this->vfs[0]);
        $this->pwd = "/root";
//session(['pwd'=>'/root']);
        if(session('pwd')) {
           $this->setPWD(session("pwd"));
         }

        // $this->root_node = new Folder("root","vfs");
        // $this->root_node->set_fs($this); //FileSystem Object..
        // $this->root_node->setVFS(self::$virtual_fs); //associative array
        // $this->current_node=$this->root_node;
        // if(session('pwd')) {
        //     $this->setPWD(session('pwd'));
        //  }
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

    private static $ls_cache;

    
  
 
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
    public static function ls_table($storage_type,$nodes,$node_types){
        $rows=[];

        if($storage_type=='psql_table'){
            return ['headers'=>[],'rows'=>[]];
        }elseif($storage_type=='psql'){
            $rows=[];
            foreach($nodes as $i=>$node_path){
                $mimeType = $node_types[$i];
                $name = basename($node_path);
                $rows[] = ['cmd' => "cd $name", "mimetype"=>"psql_table", 'display' => "Query db table"];
                return ['headers' => ['cmd', 'display', 'mimetype'], 'rows' => $rows];
            }
           
        }else{
            foreach($nodes as $i=>$node_path) {
                $mimeType = $node_types[$i];
                $is_file= stripos($mimeType,'ls-')===0 && stripos($mimeType,'/directory')===false;
                $is_folder=!$is_file;
                $name = basename($node_path);
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
            }
            return ['headers' => ['cmd', 'display', 'mimetype'], 'rows' => $rows];
        }

    
    }
    public static function cmd_options($pwd,$storage_type){
        $options = [];        
        if($pwd!=='/root'){
            $options[]= ['cmd'=>'cd ..', 'display'=>'Go to parent folder'];
        }
        $options[] = ['cmd' => 'ls', 'display' => 'List Files'];
        switch ($storage_type) {
            case 'filesystem':
                $options[] = ['cmd' => 'upload', 'display' => 'Upload a new file'];
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
                $options[] = ['cmd' => 'createtable', 'display' => 'create a new table'];
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
        return ['headers' => ['cmd', 'display'], 'rows' => $options];
    }
    public function ls_($path, $_options,$list){  
       // $list = $this->current_node->ls_children();
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
        //echo implode("<br>",$this->vfs[0]);
        $full_path = $this->getPWD()."/".$filename;
        $index=$this->xpath_map[$full_path];
  
        $mimetype = $this->vfs[1][$index];
        $meta = $this->vfs[2][$index];
        $os_path = isset($meta['os_path']) ? $meta['os_path'] : $full_path;
        //if (!Storage::exists($filepath)) throw new\ Exception("$filename does not exist on fs");
        
        //$mimetype = $this->get_mime_type($filename);
        $geturl = url("stdin")."?msg=".urlencode("get $full_path");
        
        if (strpos($mimetype, "image") !== false) {
            return ['text_output' => "Displaying $filename as image.", 'image_link' => $geturl];
        } else if ($mimetype === "text/html") {
            return ['text_output' => "Displaying $filename in preview iframe.", 'iframe_link' => $geturl];
        }else if (strpos($mimetype, "csv") !== false || strpos($mimetype, "text") !== false){
            $cat_out_put=[];
            exec("cat $os_path", $cat_out_put);
            $content = implode("<br>",$cat_out_put);
            // $content = Storage::get($full_path);
            // $content = preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', $content);
            // $content = str_replace("\n","<br>",$content);
            $output = "<b>$filename</b>";
            $output .= "<br><pre>".$content."</pre>";
            return ['text_output' => $output];
        }else {
            return ['text_output' => "Downloading $filename", 'download_link' => $geturl];
        }
    }
    public function create_db_table($tablename,$columns){
        $db_ns = str_replace("/","_",$this->getPWD())."_f_";

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

        $filePath = $this->getPWD()."/".$filename;
        return Storage::put($filePath, $content);
    }
    public function getPWD() {
        return $this->pwd;
    }
    public function setPWD($pwd) {
        $this->pwd=$pwd;
        session(["pwd" => $this->pwd]);
    }
    public function cd($todir,$dry=false) {
        if($todir=='root'){
            return $this->setPWD('/root');
        }
        $parts=explode("/",$todir);
        $path_parts = explode("/",$this->pwd);
 
        foreach($parts as $part){
            if($part==".." && count($path_parts)>1) {
                array_pop($path_parts);
            }
            elseif($part=='.') continue;
            else $path_parts[]=$part;
        }
        $new_path=implode("/",$path_parts);
        if(!isset($this->xpath_map[$new_path])){
            throw new \Exception("Cannot CD to $todir");
        }
        if($dry) return $new_path;
        else{
            $this->setPWD($new_path);
            return $new_path;
        }
    }
}
