<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Auth;

class FileSystem extends Model
{
    //
  private const DIRS=[
    'root'=>[
        'data'=>[
            '_storage'=>'psql',
        ],
        'search'=>[
            '_storage'=>'psql',
        ],
        'files'=>[
            '_storage'=>'file'
        ],
        'facebook'=>[
            '_storage'=>'facebook'
        ],
        'dropbox'=>[
            '_storage'=>'dropbox'
        ],
        'myfiles'=>[
            '_storage'=>'filesystem'
        ],
        'public'=>[
            '_storage'=>'filesystem'
        ]
    ]
  ];


  private $cd="/root";
  private static $_k=[];
  private $privateDir="guest";
  public static function getInstance(){
      if(Auth::user()!==null){
        return self::makeInstance(Auth::user()->username);
      }else{
        return self::makeInstance();
      }
  }
  public static function makeInstance($userName=0){
    if(!isset(self::$_k[$userName])){
      self::$_k[$userName] = new Filesystem();
      if($userName && session('cd')){
        if(session('cd')===str_replace(" ","_",$userName)){
            self::$_k[$userName]->setCd('root/myfiles');
        }else{
            self::$_k[$userName]->setCd(session('cd'));
        }
      }
    }
    self::$_k[$userName]->privateDir = str_replace(" ","_",$userName);
    return self::$_k[$userName];
  }

  public function get_fs_path(){
    $cd = $this->cd;
    $cd = str_replace("/root/myfiles",$this->privateDir,$cd);
    if(!Storage::exists($cd)){
        Storage::makeDirectory($cd);
    }
    return $cd;
  }
  public function mimeType($filename){

  }
  public function ls($options=""){
    $options=explode(" ",$options);
    $cd = $this->cd;
    $cdt=explode("/",$cd);
    $ret=self::DIRS;
    $xpath=[];
    $currentFileType="folder";
    foreach($cdt as $t){
        if(!$t) continue;
        $xpath[]=$t;
        $this->cd = implode("/",(Array)$xpath);
        $filepath = $this->get_fs_path();
        if(!isset($ret[$t])){
            $hasPath=Storage::has($filepath);
            if(!$hasPath){
                throw new \Exception("cd to $t not found");
            }
            break;
        }
        $ret=$ret[$t];
    }
    $filetype = isset($ret['_storage']) ? $ret['_storage'] : "folder";
    $path=$this->get_fs_path();
    $dirs=Storage::directories($path);
    foreach($dirs as $dir){
        $dirname = str_replace($path."/","",$dir);
        $dirname = $dirname.'/';
        $ret[$dirname]=[
            '_storage'=>'filesystem',
        ];
    }
    $files=Storage::files($path);
    foreach($files as $filename){
        $filename = str_replace($path."/","",$filename);
        $ret[$filename]=[
            '_storage'=>'filesystem',
            '_type'=>'file'
        ];
    }


    if(in_array("-h", $options)){
        $output="";
        foreach($ret as $name=>$attr){
            if(substr($name,0,1)==='_') continue;
            $is_file = isset($attr['_type']) && $attr['_type']==='file';
            $is_folder = !$is_file;
            $display = $is_folder ? $name : $name;
            $output.=$display." ";
        }
        return $output;
    }
    if(in_array("-o", $options)){
        $options=[];
        $options[]='new';
        $options[]='upload';
        $options[]='cd ..';
        foreach($ret as $name=>$attr){
            if(substr($name,0,1)==='_') continue;
            $is_file = isset($attr['_type']) && $attr['_type']==='file';
            $is_folder = !$is_file;
            $options[] = $is_folder ? "cd $name" : "get $name";
        }
        return $options;
    }
    if(in_array("-j", $options)){
        $hints=[];
        foreach($ret as $name=>$attr){
            if(substr($name,0,1)==='_') continue;
            $hints[]=$name;
        }
        return $hints;
    }
    return['xpath'=>$xpath,'list'=>$ret];
  }
  public function cat($filename){
    if(substr($filename,0,1)=='/'){
        $filepath=$filename;
    }else{
        $filepath = $this->get_fs_path()."/".$filename;
    }

    if(!Storage::exists($filepath)) throw new \Exception("$filename does not exist on fs");
    $mimeType="text";
    foreach(explode(" ","png html gif jpeg html") as $non_bin_ext){
        if(strpos($filename, ".".$non_bin_ext)!==false){
            $mimeType=$non_bin_ext;
        }
    }
    if($mimeType=='text'){
        $ret=Storage::get($filepath);
        $preview_url=false;
    }else{
        $preview_url=true;
        $ret=url("stdin")."?msg=".urlencode("get $filepath");
    }
    return ['preview_url'=>$preview_url,
            'ret'=>$ret];
  }

  public function put($filename,$content){
      $filePath=$this->get_fs_path()."/".$filename;
      return Storage::put($filePath,$content);
  }
  public function getCd(){
    return $this->cd;
  }
  public function setCd($cd){
      $this->cd=$cd;
  }
  public function cd($todir){
    //  echo "<br> cd to $todir";
    if($todir=='root'){
        $this->cd = "root";
        session(["cd"=>$this->cd]);
        return $this->cd;
    }
    $todirT = explode("/",$todir);
    $fs = $this->ls();
    $xpath = $fs['xpath'];
    foreach($todirT as $todirToken){
        if($todirToken===".."){
            if(count($xpath)==1){
                $this->cd="root";
                session(["cd"=>$this->cd]);
                throw new \Exception("Cannot cd .. when at root directory");
            }
            array_pop($xpath);
 
        }else{
            $xpath[]=$todirToken;
        }
        $this->cd = implode("/",(Array)$xpath);
        $fs = $this->ls();
        $xpath = $fs['xpath'];
    }
    if(!$xpath) $xpath=[];
    $this->cd = implode("/",(Array)$xpath);
    //exit;
    session(["cd"=>$this->cd]);
    return $this->cd;
  }
}
