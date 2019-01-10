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
            '_storage' => 'symlink',
            'children'=>['private','public','index_page','queries','tools'],
            'children_storage' =>['dropbox','dropbox','html','queries','bin'],
            'ln_target'=>'~/Dropbox/grepawk',
            'path'=>'{ln_target}/dropbox'
        ],
        'controllers' => [
            '_storage' => 'filesystem',
            'path'=>'{app_path}/app/http/Controllers/',
        ],
        'initd' => [
            '_storage' => 'filesystem',
            'path'=>'/etc/init.d/',
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

            unset($newmeta['children']);
            unset($newmeta['children_storage']);
            // if($name=='dropbox'){
            //     var_dump($newmeta);
            //     exit;
            // }
            $meta_list[]=$newmeta;
            if(isset($attributes['children'])){
                foreach((Array)$attributes['children'] as $i=>$child){
    
                    $xpaths[]=$folder_path."/".$child;
                    $mimetypes[]=$attributes['children_storage'][$i];
                    $meta_list[]="ref:$list_index"; //parent meta
                } 
            }
            $list_index++;
        }

        foreach($xpaths as $i=>$path){
            //add subfolders based on vfs properties.
            $parent_path = $path;
            $storage = $mimetypes[$i];
            $meta=$meta_list[$i];
            $hasstrin=false;
            while(true){
                if(is_string($meta) && strpos($meta,'ref:')!==false){
                    $hasstrin=true;
                    $ref_index=intval(str_replace('ref:','',$meta));
                    $meta =$meta_list[$ref_index];
                }else{
                    break;
                }
            }
            if(isset($meta['path'])){
                $os_path = str_replace('{app_path}',app_path(), $meta['path']);
            }else{
                $os_path=null;
            }

            switch($storage){
                case 'symlink':
                    $os_path = str_replace('{ln_target}',$meta['ln_target'],$os_path);
                case 'html':
                case 'csv':
                case 'json':
                case 'image':
                    $file_filter="|grep $storage";
                case 'filesystem':
                    $file_filter="";
                    $folders=[];
                    $os_query="ls -l $file_filter |tail -n +2|awk '{print $9}' |xargs file --mime-type";
                    $os_info=[];
                    exec($os_query,$os_info);
                    foreach($os_info as $os_info_item){
                        if(strpos($os_info_item,": ")===false) continue;
                        list($filename,$_mimetype)=preg_split('/\:\s+/', $os_info_item);;                 
                        $xpaths[]=$parent_path."/".trim($filename);
                        // if($storage=='symlink'){
                        //     echo "<br>added path ".$parent_path."/".trim($filename);
                        //     echo " for file $filename";
                        // }
                        $mimetypes[]=trim($_mimetype);
                        $meta_list[]="ref:$i"; //parent meta
                    }
                    break;
                case 'psql':
                    break;
                case 'psql-table':
                    break;  
                default:
                    break;
            }
        }
        self::$full_vfs_map=[$xpaths,$mimetypes,$meta_list];
       // exit;
      }
      return self::$full_vfs_map=[$xpaths,$mimetypes,$meta_list];
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

        $this->vfs = self::init_vfs();
        $this->pwd = "/root";
        session(['pwd'=>'/root']);
        if(session('pwd')) {
            $this->pwd=session("pwd");
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
    public function ls($args=""){
        if(true){
            //$this->path="/root/dropbox";
            $nodes=[];
            $types=[];
            $myrank = count(explode("/",$this->pwd));

            $xpath_map = array_flip($this->vfs[0]);
            $path_index = $xpath_map[$this->pwd];
            $my_mimetype=$this->vfs[1][$path_index];
            foreach($this->vfs[0] as $index=>$path){
                $rank = count(explode("/",$path));
                //echo "<br>rank of $path is $rank";
                if($rank!== $myrank+1) continue;
                if(dirname($path)!==$this->pwd) {
                    continue;
                }
                $mimetype = $this->vfs[1][$index];
                $meta =$this->vfs[2][$index];
                $nodes[]=basename($path);
                $node_types[]=$mimetype;
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
    public function ls_v_junk($options="") {
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
    public static function ls_table($storage_type,$nodes,$node_types){
        
        if($storage_type=='psql_table'){
            return ['headers'=>[],'rows'=>$rows];
        }else{
            foreach($nodes as $i=>$node_path) {
                $mimeType = $node_types[$i];
                $is_folder= stripos($mimeType,"directory")!==false;
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
        $this->pwd=$wpd;
        session(["pwd" => $this->pwd]);
    }
    public function cd($todir) {
        $parts=explode("/",$todir);
        $path_parts = explode("/",$this->pwd);

        foreach($parts as $part){
            if($part==".." && count($path_parths)>1) array_pop($path_parts);
            elseif($part=='.') continue;
            else $parts[]=$part;
        }
        $new_path=implode("/",$parts);

        $this->setPWD(implode("/",$parts));
      
        return $pwd;
    }
}
