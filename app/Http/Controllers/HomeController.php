<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Auth;
use File;
use Illuminate\Console\Parser;
use App\FS;
use App\FileSystem;

class HomeController extends Controller
{

    private $cd='/';
    private $private_dir;
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
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
                                'cd'=>$fs->getCd(),
                                ]);
    }


    public function stdin(Request $request){
        $this->username="guest";
        $msg =$request->input("msg");
        if(!$msg) die("");
        $msgt = explode(" ",$msg);
        $cmd = $msgt[0];

        $argv1= isset($msgt[1]) ? $msgt[1] : 0;
        $argv2= isset($msgt[2]) ? $msgt[2] : 0;
        $output="";
        $error="";
        $hints=null;
        $fs = FileSystem::makeInstance(Auth::user()->name);
        $cd = $fs->getCd();
        $meta=[];
        $options=null;
        try{
            switch($cmd){
                case "ls":
                    $output = $fs->ls("-h");
                    $hints = $fs->ls("-j"); 
                    $options=$fs->ls("-o");
                    break;
                case 'cd':   
                    $toCd = $msgt[1];
                    $cd = $fs->cd($toCd); 
                    $output = $fs->ls("-h");
                    $hints = $fs->ls("-j");   
                    $options=$fs->ls("-o");   
                    break;
                case 'cat':
                    $cd = FileSystem::cd($cd);
                    break;
                case 'pwd':
                    $output=$cd;
                    break;
                case 'touch':
                    $filename = $msgt[1];
                    if($cd) $dir=$cd."/";
                    else $dir="";
                    Storage::put($dir.$filename,"");
                    list($hints,$output)=FS::ls($cd);
                    break;
                case 'newfile':
                    switch($argv1){
                        case 'upload':
                        case 'copy-paste':

                            $tmp_filename="tmp_".time()."_".$this->username.".tmp";
                            $output="$argv1 started";
                            $meta['prompts']=['filename','filetype'];
                            $tmp_filepath=$fs->getCd()."/".$tmp_filename;
                            $meta['tmp_fn']=$tmp_filepath;
                            Storage::put($tmp_filepath,"tmp-gen");
                            break;
                    }
                default:
                    $err=$cmd." known";
                    break;
            }  
        }catch(\Exception $e){
            throw $e;
            $error=$e->getMessage();
        }


        $cdt=explode("/",$fs->getCd());
        $cd=$cdt[count($cdt)-1];

        return response()->json([
            "cd"=> $cd,
            "hints"=>$hints,
            "output"=>$output,
            'options'=>$options,
            "error"=>$error,
            'meta'=>$meta,


        ]);
    }

}
