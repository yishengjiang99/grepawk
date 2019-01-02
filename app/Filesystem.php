<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Filesystem extends Model
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
        ]
    ]
  ];


  private $cd="root";
  private static $_k=[];

  public static function makeInstance($userId=0){
    if(!isset(self::$_k[$userId])){
      self::$_k[$userId] = new Filesystem();
      if($userId && session('cd')){
        if(session('cd')===str_replace(" ","_",$userId)){
            self::$_k[$userId]->setCd('root/myfiles');
        }else{
            self::$_k[$userId]->setCd(session('cd'));
        }
      }
    }
    return self::$_k[$userId];
  }
  
  public function ls($options=""){
    $options=explode(" ",$options);
    $cd = $this->cd;
    $cdt=explode("/",$cd);
    $ret=self::DIRS;
    $xpath=[];
    foreach($cdt as $t){
        if(!$t) continue;
        if(!isset($ret[$t])){
            throw new \Exception("cd to $t not found");
            $this->cd="root";
            session(["cd"=>$this->cd]);
            break;
        }
        $xpath[]=$t;
        $ret=$ret[$t];
    }
    if(in_array("-h", $options)){
        $output="";
        foreach($ret as $name=>$attr){
            if(substr($name,0,1)==='_') continue;
            $is_folder = !isset($attr['type']) || $attr['type']!=='folder';
            $display = $is_folder ? $name."/" : $name;
            $output.=$display." ";
        }
        return $output;

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
    session(["cd"=>$this->cd]);
    return $this->cd;
  }
}
