<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Auth;
use File;
use Illuminate\Console\Parser;
use App\FS;
use Illuminate\Filesystem\Filesystem;
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
            $this->cd = $this->private_dir;
            $this->username=Auth::user()->name;
        }else{
            $this->cd = "public";
            $this->username="guest";
        }
        session(["cd"=>$this->cd]);

        if(!File::exists($this->private_dir)){
            Storage::makeDirectory($this->private_dir);
        }       
        $dirs = Storage::allDirectories($this->cd);
        $files = Storage::allFiles($this->cd);

        return view('terminal',['username'=>$this->username, 
                                'cd'=>$this->cd,
                                'dirs'=>$dirs,
                                'files'=>$files]);
    }


    public function stdin(Request $request){
        $cd = session("cd");
        $current_directory_tokens = explode("/",$cd);
        $msg =$request->input("msg");
        if(!$msg) die("");
        $msgt = explode(" ",$msg);
        $cmd = $msgt[0];
        $output="";
        $error="";
        $hints=null;
        switch($cmd){
            case "ls":
                list($hints,$output)=FS::ls($cd);
                break;
            case 'cd':
                $todir = $msgt[1];
                $todirT = explode("/",$todir);
                foreach($todirT as $todirToken){
                    if($todirToken===".."){
                        if(count($current_directory_tokens)==0){
                            $error="Error: already at root dir";
                            break;
                        }
                        array_pop($current_directory_tokens);
                    }else{
                        $current_directory_tokens[]=$todirToken;
                    }
                }
                if(count($current_directory_tokens)){
                    $cd_try = implode("/",$current_directory_tokens);
                }else{
                    $cd_try="";
                } 
                if(!Storage::exists($cd_try)){
                    $error="Directory $cd_try does not exist";
                    break;
                }
                if(Storage::mimeType($cd_try)!=="directory"){
                    $error="$cd_try is not a directory";
                    break;
                }
                $cd=$cd_try;              
                session(["cd"=>$cd]);
                list($hints,$output)=FS::ls($cd);
                break;
            case 'cat':
                $filename = $msgt[1];
                if($cd) $dir=$cd."/";
                else $dir="";
                $content=Storage::get($dir.$filename);
                $output=str_replace("\n","<br>",$content);
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
        $cdt=explode("/",$cd);
        $cd=$cdt[count($cdt)-1];

        return response()->json([
            "cd"=> $cd,
            "hints"=>$hints,
            "output"=>$output,
            "error"=>$error
        ]);
    }

}
