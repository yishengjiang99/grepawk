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
            '_storage' => 'filesystem',
            'path'=>'{storage_path}/root/data',
        ],
        'data/timeseries' => [
            '_storage' => 'filesystem',
            'path'=>'{base_path}/timeseries',
        ],
        'data/snapshots' => [
            '_storage' => 'filesystem',
            'path'=>'{base_path}/snapshots',
        ],
	'database'=>[
            '_storage' => 'psql',
	    'path'=>'none'
	],
        'bin' =>[
            '_storage'=>'filesystem',
            'path'=>'{base_path}/bin',
        ],
        'files'=>[
            '_storage'=>'filesystem',
            'path'=>'{storage_path}/app/public'
        ],
        'dropbox' => [
            '_storage' => 'filesystem',
            'path'=>'/home/ubuntu/Dropbox/grepawk',
        ],
        'controllers' => [
            '_storage' => 'filesystem',
            'path'=>'{app_path}/http/Controllers/',
        ],
        'initd' => [
            '_storage' => 'filesystem',
            'path'=>'/etc/init.d/',
        ],
        'logs' => [
            '_storage' => 'filesystem',
            'path'=>'/var/logs',
        ],
        'logs/apache2' => [
            '_storage' => 'filesystem',
            'path'=>'/var/logs/apache2',
        ],
        'ui' => [
            '_storage' => 'filesystem',
            'path'=>'{base_path}/resources/views',
        ],
    ];


    
    public function get_os_path($pwd="",$append=""){

        $pwd = $pwd ? $pwd : $this->getPWD();
 
       
        if(isset($this->xpath_map[$pwd]) &&
            isset($this->xpath_map[$pwd][2]) &&
               isset($this->xpath_map[$pwd][2]['os_path']))
        {
                return  $this->xpath_map[$pwd][2]['os_path'].$append;
           
        }  
        else {
            if(dirname($pwd)==="") throw new \Exception("vfs error");
            $append = "/".basename($pwd).$append;
            return $this->get_os_path(dirname($pwd),$append);
        }
    }

    public static $full_vfs_map;


    public static function init_vfs(){
      if(!self::$full_vfs_map) {
        $xpaths =[];
        $mimetypes=[];
        $meta_list=[];
        $base_path="/root";
        $xpaths[]='/root';
        $mimetypes[]='vfs/root';
        $meta_list=[];
        $meta_list[]=['_storage'=>'vfs/root',
                      'os_path'=>storage_path()."/app/root"];
        $max_ls_depth=5;
        $list_index=0;
        foreach(self::$virtual_fs as $name=>$attributes){
            $folder_path=$base_path."/".$name;
            $xpaths[]=$folder_path;
            $mimetypes[]=$attributes['_storage'];
            $newmeta=$attributes ? $attributes : [];
            if(isset($newmeta['path'])){
                $os_path= $newmeta['path'];
                $os_path = str_replace('{base_path}', base_path(), $os_path);

                $os_path = str_replace('{app_path}', app_path(), $os_path);
                $os_path = str_replace('{storage_path}', storage_path(),$os_path);
                
                if($attributes['_storage']==='symlink'){
                    $os_path = str_replace('{ln_target}',$newmeta['ln_target'], $os_path);
                }
                $newmeta['os_path']=$os_path;
           
            }else{
                $newmeta['os_path']="";
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
     // var_dump(self::$full_vfs_map[1]);

      return self::$full_vfs_map;
    }



    public function ls($args,$todir=""){
        if($todir!=="") $_pwd = $todir;
        else $_pwd = $this->pwd;
        if(!self::$ls_cache) $ls_cache=[];
        $error="";
        Log::debug("LS TO $_pwd");


        if(true && !isset(self::$ls_cache[$_pwd])){
            Log::debug("NO cache for $_pwd");
            Log::debug(json_encode(debug_backtrace(3)));
            //self::$ls_cache[$this->pwd]=[];
            $nodes=[];
            $node_types=[];
     
            $myrank = count(explode("/",$_pwd));
   
            $parent_path = dirname($this->getPwd());
            if(!isset($this->xpath_map[$_pwd])){
                list($parent_index,$parent_mimetype,$parent_meta)=$this->xpath_map[$parent_path];                
                $my_mimetype="filesystem";
                if($parent_mimetype=='psql') $my_mimetype='psql_table';
                $my_meta=['os_path'=>$parent_meta['os_path']."/".basename($_pwd)];
                $my_meta=array_merge($my_meta,$parent_meta);
                $this->xpath_map[$_pwd]=[$parent_index,$my_mimetype,$my_meta];  
            }else{
                list($my_index,$my_mimetype,$my_meta)=$this->xpath_map[$_pwd];
            }

            while(true){
                if(isset($my_meta['ref:'])){
                    $meta_ref=intval($my_meta['ref:']);
                    $my_meta = $this->full_vfs_map[2][$meta_ref];
                }else{
                    break;
                }
            }



            foreach($this->vfs[0] as $index=>$path){
                $rank = count(explode("/",$path));
                
                if($rank!== $myrank+1) continue;
                if(dirname($path)!==$_pwd) {
                    continue;
                }

                $mimetype = $this->vfs[1][$index];
                $meta =$this->vfs[2][$index];
                $nodes[]=basename($path);
                $node_types[]=$mimetype;
            }
            $storage = $my_mimetype;
            $os_path = isset($my_meta['os_path']) ? $my_meta['os_path'] : "none";
            if(!$os_path && isset($my_meta['path'])){
                $os_path = $my_meta['path'];
            }
   
            switch($storage){
                case 'vfs/root':
                    break; // 
                case 'symlink':
                case 'html':
                case 'csv':
                case 'json':
                case 'image':
                    $file_filter="|grep $storage";
                case 'data':
                case 'filesystem':
                    if($os_path=='none') break;
                    $file_filter="";
                    $folders=[];
                    $os_query="cd $os_path && ls -l $file_filter |tail -n +2|awk '{print $9}' |xargs file --mime-type";
                    Log::debug($os_query);
                    $os_info=[];
                    exec($os_query,$os_info);
                    $parent_path=$_pwd;
                    foreach($os_info as $os_info_item){
                        if(strpos($os_info_item,": ")===false) continue;
                        list($filename,$_mimetype)=preg_split('/\:\s+/', $os_info_item);
                        $_mimetype="ls-".$_mimetype;
                   
                        $node_path=$parent_path."/".basename($filename);
                        if(in_array($node_path,$nodes)) continue;

                        $this->xpath_map[$node_path]=[0,$_mimetype,['os_path'=>$os_path.'/'.$filename]];
                        $nodes[]=basename($node_path);
                        $node_types[]=trim($_mimetype);
                    }              
                    break;
                case 'psql':
                    $parent_path=$_pwd;
                    $table_ns=str_replace("/", "_", $parent_path)."_f_";
                    $sql="select table_name from information_schema.tables where table_schema='public' and table_name like '$table_ns%'";
                    $tables = DB::connection('pgsql') -> select($sql);
                    foreach($tables as $table){
                        $child_path =str_replace($table_ns,"",$table->table_name);
                        $full_path = $parent_path."/".$child_path;
                        $_meta=['db_name'=>$table->table_name];
                        $this->xpath_map[$full_path]=[0,'psql_table',$_meta];
                        $nodes[]=basename($full_path);
                        $node_types[]='psql_table';
                    }
           
                    break;
                case 'psql_table':
                    $tablename=str_replace("/", "_", dirname($_pwd))."_f_".basename($_pwd);
                    $nodes[]=$tablename;
                    $node_types[]='psql_row';
                    break;
                default:
                    break;
                }

              
            self::$ls_cache[$_pwd]=[
                'nodes'=>$nodes,
                'node_types'=>$node_types,
                'output'=>"",
                'hints'=>$nodes,
                'options'=>self::cmd_options($_pwd,$my_mimetype),
                'dl_links'=>[],
                'table'=>self::ls_table($my_mimetype,$nodes,$node_types)
            ];
        }
        if($args=='') return self::$ls_cache[$_pwd]['output'];
        if($args=='-t') return self::$ls_cache[$_pwd]['table'];
        if($args=='-o') return self::$ls_cache[$_pwd]['options'];
        if($args=='-j') return self::$ls_cache[$_pwd]['hints'];
        return $ret;
    }



    private static $folder_objs=[];

 
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
        $this->xpath_map=[];
        foreach($this->vfs[0] as $i=>$path){
            $this->xpath_map[$path]=[$path,$this->vfs[1][$i],$this->vfs[2][$i]];
        }

        $this->pwd = "/root";
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

    
    public static function ls_table($storage_type,$nodes,$node_types){

        if($storage_type=='psql_table'){
            $rows=[];

            if(isset($nodes[0])){
                $table_ns=$nodes[0];
            }
            $dbrows = DB::table($table_ns)->paginate(15);
            $headers=[];
            foreach($dbrows as $i=>$row){
                if($i==0) $headers=array_keys((Array)$row);
                $rows[]=(Array)$row;
            }
            return ['headers'=>$headers,'rows'=>$rows];
        }elseif($storage_type=='psql'){
            $rows=[];
            foreach($nodes as $i=>$node_path){
                $mimeType = $node_types[$i];
                $name = basename($node_path);
                $rows[] = ['cmd' => "cd $name", "mimetype"=>$mimeType, 'display' => "Query db table"];
            }
            return ['headers' => ['cmd', 'display', 'mimetype'], 'rows' => $rows];
        }else{
            $rows=[];
            foreach($nodes as $i=>$node_path) {
                $mimeType = $node_types[$i];
                $is_file= stripos($mimeType,'ls-')===0 && stripos($mimeType,'/directory')===false;
                $is_folder=!$is_file;
                $name = basename($node_path);
                if ($is_folder) {
                    $rows[] = ['cmd' => "cd $name", 
                                'name'=>$name,
                                "mimetype"=>$mimeType, 'type' => 'folder', 
                                'display' => "Open folder $name", 
                                'links' => ["onclick:cd ".urlencode($name)]
                            ];
                } else {
                    $rows[] = ['name'=>$name, 
                               'cmd' => "cat $name", 
                               "mimetype"=>$mimeType,  
                               'display' => "Download or view file", 
                               'type'=>"file",
                               'links' => ["onclick:cat ".urlencode($name),
                                            "onclick:get ".urlencode($name)]
                            ];
                    if(strpos($name,'.csv')!==false){
                        $cmd="convert $name ".basename($name,".csv");
                        $rows[] = [
                            'name'=>$name, 
                            'cmd' =>$cmd,
                            'mimetype'=>$mimeType,
                            'display' => "Convert $name into psql table ".basename($name,".csv"), 
                            'links' => ["onclick:".$cmd]
                        ];

                    }
                }
            }
            return ['headers' => ['name', 'display', 'mimetype','links'], 'rows' => $rows];
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

        if(!isset($this->xpath_map[$full_path])){
            $this->ls("",dirname($full_path));
            if(!isset($this->xpath_map[dirname($full_path)])){
                throw new \Exception("Cannot cat to $full_path");
            }
        }


        list($full_path,$mimetype,$meta)=$this->xpath_map[$full_path];
        

        $os_path = isset($meta['os_path']) ? $meta['os_path'] : $full_path;

        exec("file --mime-type $os_path", $ob);
        $mimetype=explode(": ",$ob[0])[1];



        //if (!Storage::exists($filepath)) throw new\ Exception("$filename does not exist on fs");
        
        //$mimetype = $this->get_mime_type($filename);
        $geturl = url("stdin")."?msg=".urlencode("get $os_path");

        if (strpos($mimetype, "image") !== false) {
            return ['text_output' => "Displaying $filename as image.", 'image_link' => $geturl];
        }else if ($mimetype === "text/html") {
            return ['text_output' => "Displaying $filename in preview iframe.", 'iframe_link' => $geturl];
        }else if (strpos($mimetype, "csv") !== false || strpos($mimetype, "text") !== false || true){
            $cat_out_put=[];
            exec("cat $os_path", $cat_out_put);
            $content = implode("<br>",$cat_out_put);
            // $content = Storage::get($full_path);
            $content = preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', $content);
            $content = str_replace("\n","<br>",$content);
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
        
        $popped_stack=[];
        $i=0;
        while($i++<60){
            if(!isset($this->xpath_map[$new_path])){
                $popped_stack[]=basename($new_path);
                $new_path=dirname($new_path);
                if(!$new_path) {
                  new \Exception("Cannot cd to $todir");
                }
                $this->ls("",$new_path);
                
            }else{
                if(count($popped_stack)){
                    $new_path=$new_path."/".array_pop($popped_stack);
                }else{
                    break;
                }
            }
        }

        if(!isset($this->xpath_map[$new_path])){
            $this->ls("",$new_path);
            if(!isset($this->xpath_map[$new_path])){
                throw new \Exception("Cannot cd to $new_path");
            }
        }
        if($dry!==false) return $new_path;
        else{
            $this->setPWD($new_path);
            return $new_path;
        }
    }
}
