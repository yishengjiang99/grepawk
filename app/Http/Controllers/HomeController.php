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
        $msg =$request->input("msg");
        if(!$msg) die("");
        $msgt = explode(" ",$msg);
        $cmd = $msgt[0];
        $output="";
        $error="";
        $hints=null;
        $fs = FileSystem::makeInstance(Auth::user()->name);
        $cd = $fs->getCd();
        try{
            switch($cmd){
                case "ls":
                    $output = $fs->ls("-h");
                    $hints = array_keys($fs->ls(""));   
                    break;
                case 'cd':   
                    $toCd = $msgt[1];
                    $cd = $fs->cd($toCd);    
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
                default:
                    $err=$cmd." known";
                    break;
            }  
        }catch(\Exception $e){
            $error=$e->getMessage();
        }


        $cdt=explode("/",$fs->getCd());
        $cd=$cdt[count($cdt)-1];

        return response()->json([
            "cd"=> $cd,
            "hints"=>$hints,
            "output"=>$output,
            "error"=>$error
        ]);
    }

}
