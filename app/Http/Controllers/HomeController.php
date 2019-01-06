<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Auth;
use File;
use Log;
use Illuminate\Console\Parser;
use App\FS;
use App\FileSystem;

class HomeController extends Controller
{

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
//        $this->middleware('auth');
    }
   
    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        return view('home');
    }

    public function terminal(){
        if(Auth::user()!==null){
            $this->private_dir = str_replace(" ","_",Auth::user()->name);
            $this->username=Auth::user()->name;
            $fs=FileSystem::makeInstance(Auth::user()->name);
        }else{
            $this->private_dir="anon";
            $fs=FileSystem::makeInstance(0);
            $this->username="guest";
        }
        if(!File::exists($this->private_dir)){
            Storage::makeDirectory($this->private_dir);
        }       
        return view('terminal',['username'=>$this->username, 
                                'pwd'=>$fs->getPWD(),
                                ]);
    }


    public function stdin(Request $request){
        Log::debug("stdin: ".$request->fullUrl());
        $this->username="guest";
        $msg =$request->input("msg");
        $msg =urldecode($msg);
        if(!$msg) die("");
        $oformat=$request->input("output","json");
        $msgt = explode(" ",$msg);
        $cmd = $msgt[0];

        $argv1= isset($msgt[1]) ? $msgt[1] : 0;
        $argv2= isset($msgt[2]) ? $msgt[2] : 0;
        $output="";
        $error="";
        $hints=null;
        $fs = FileSystem::getInstance();
        $pwd = $fs->getPWD();
        $meta=[];
        $options=null;
        $table=null;
        try{
            switch($cmd){
                case "help":
                    $options=$fs->ls('-t');
                    break;
                case 'checkin':
                    $output="...";
                    $options=$fs->ls('-t');
                    break;
                case "get":
                    header("Content-Type: File/File");
                    $download_file="grepawk_download_".basename($argv1);
                    header('Content-Disposition: attachment; filename="'.basename($download_file).'"');
                    echo Storage::get($argv1);
                    exit;
                    break;
                case "ls":
                    $output = "File list of the ".$fs->getPWD()." folder";
                    $hints = $fs->ls("-j"); 
                    $table = $fs->ls("-t");
                    $options=$fs->ls('-t');
                    break;
                case 'cd':   
                    $toCd = $msgt[1];
                    $cd = $fs->cd($toCd); 
                    $output ="Opened $cd folder";
                    $table = $fs->ls("-t");
                    $options=$table;
                    break;
                case 'cat':
                    $ret = $fs->cat($argv1);
                    if(isset($ret['text_output'])){
                        $output = $ret['text_output'];
                    }
                    $meta = array_merge($meta, $ret);
                    break;
                case 'pwd':
                    $output=$fs->getPWD();
                    break;
                case 'touch':
                    $filename = $msgt[1];
                    Storage::put($fs->getCd()."/".$filename,"");
                    $output ="Created new file $filename";
                    $hints = $fs->ls("-j"); 
                    $table = $fs->ls("-t");
                    break;
                case 'upload':
                    break;
                case 'wget':
                    $url = $argv1;
                    $content=@file_get_contents($url); 
                    if(!$content){
                        $error="$url not reachable";
                    }else{
                        $res = preg_match("/<title>(.*)<\/title>/siU", $content,$title_matches);
                        if(!$res){
                            $title="web_cache_".parse_url($url, PHP_URL_HOST);
                        }else{
                            $title=$title_matches[1];
                        }
                        $fileName = $fs->getCd()."/".$title.".html";
                        Storage::put($fileName,$content);
                        $output="File Cached as $fileName";
                        $meta['mime']='html';
                        $catcmd ="cat /$fileName";
                        $meta['url']=url()->current()."?msg=$catcmd";
                    }
                    break;
                default:
                    $err=$cmd." known";
                    $table = $fs->ls("-t");
                    break;
            }  
        }catch(\Exception $e){
            throw $e;
            $error=$e->getMessage();
            $table = $fs->ls("-t");
        }
        
        return response()->json([
            "cd"=>basename($fs->getPWD()),
            "pwd"=>$fs->getPWD(),
            "hints"=>$hints,
            "output"=>$output,
            'options'=>$options,
            "error"=>$error,
            'meta'=>$meta,
            'table'=>$table
        ]);
    }

}
