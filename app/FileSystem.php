<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;


class FileSystem extends Model
{
    //
  private const DIRS=[
    'root'=>[
        'data'=>[
            '_storage'=>'psql',
            'file1'=>'file',
            'file2'=>'file'
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
        'dps_logs'=>[
            '_storage'=>'web',
            '_index'=>'warcraftlogs.com'
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


  private $cd="root";
  private static $_k=[];
  private $privateDir="guest";
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
    $cd = str_replace("root/myfiles",$this->privateDir,$cd);
    if(!Storage::exists($cd)){
        Storage::makeDirectory($cd);
    }
    return $cd;
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
            //echo '<br> checking '.$filepath;
            $hasPath=Storage::has($filepath);
            if(!$hasPath){
                throw new \Exception("cd to $t not found");
            }
            break;
        }
        $ret=$ret[$t];
    }
    //throw new \Exception($this->cd);    

    $filetype = isset($ret['_storage']) ? $ret['_storage'] : "folder";
    $path=$this->get_fs_path();
  //  throw new \Exception($path);    
    $dirs=Storage::directories($path);
    foreach($dirs as $dir){
        $dirname = str_replace($path."/","",$dir);
        $dirname = $dirname.'/';
        $ret[$dirname]=[
            '_storage'=>'filesystem'
        ];
    }
    $files=Storage::files($path);
    foreach($files as $filename){
        $filename = str_replace($path."/","",$filename);
        $ret[$filename]=[
            '_storage'=>'files'
        ];
    }


    if(in_array("-h", $options)){
        $output="";
        foreach($ret as $name=>$attr){
            if(substr($name,0,1)==='_') continue;
            $is_folder = !isset($attr['type']) || $attr['type']!=='folder';
            $display = $is_folder ? $name : $name;
            $output.=$display." ";
        }
        return $output;
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
  //  echo "<br> current cd ".$this->cd;

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
