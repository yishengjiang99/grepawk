<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Console\Parser;
use Auth;
use File;
use Log;
use DB;
use App\FileSystem;
use App\VFile;
use Closure;
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

        $data = $request->input('data');
        $data = json_decode($data);
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
                    $output="type 'ls' to get started";
                    $options=$fs->ls('-o');
                    break;
                case 'checkin':
                    $output="...";
                    $options=$fs->ls('-t');
                    break;
                case 'head':
                    $file = $argv1;
                    $n = $argv2 ? intval($argv2) : 5;
                    $file=VFile::getInstance($fs->getPWD()."/".$file);
                    $file->head_fs($n);
                    exit;
                    break;
                case 'convert':
                    $filename=$argv1;
                    $format=$argv2;
                    $fromFile = VFile::getInstance($fs->getPWD()."/".$filename,'filesystem');
                    $fromFile->init();
                    $mimeType = $fromFile->mimeType;
                    $converts = $fromFile->mimeType."--".$format;
                    $header=$fromFile->head_fs(2,false);
                    if(count($header)<2){
                        throw new \Exception("less than 2 lines the file");
                    }
                    $header_arr=str_getcsv($header[0]);
                    $sample=str_getcsv($header[1]);
                    $header_obj=[];
                    $header_list=[];
                    foreach($header_arr as $i=>$header){
                        $header = str_replace(" ","_",$header);
                        $header_list[]=$header;
                        if(is_numeric($sample[$i])){
                            $header_obj[]=$header." decimal";
                        }else{
                            $header_obj[]=$header." string";
                        }
                    }
                    switch($format){
                        case 'sql':
                        case 'psql':
                            $dbname = str_replace(".$mimeType","",$filename);
                            $dbname.="_".time();
                            $dbname=$fs->create_db_table($dbname,$header_obj);
                            $lines = $fromFile->cat_fs();
                            foreach($lines as $i=>$line){
                                if($i==0) continue;
                                $success=VFile::insert_csv_db($dbname,$line,$header_list);
                                if($success===false){
                                    $error.="<br>Insert $line failed";
                                }else{

                                }
                            }
                            $output="created db table $dbname";
                            break;
                        default: 
                            $error="Unsupported conversion from $mimeType to $format";
                            break;
                    }                    
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
                   // $options=$fs->ls('-o');
                    break;
                case 'cd':   
                    $toCd = $msgt[1];
                    $cd = $fs->cd($toCd); 
                    $output ="Opened $cd folder";
                    $table = $fs->ls("-t");
                    $options=$fs->ls('-o');
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
                case 'ct':
                case 'createtable':
                    $tablename = $argv1;
                    if(!$argv1){
                        $error="Usage: createable {tablename}";
                        break;
                    }
                    if(!$data){
                        $output="Enter Create Table Prompt mode";
                        $output.="<br>Add column with the format {name} {type}";
                        $output.="<br>Supported types are: int, decimal, date, string";
                        $output.="<br>Type 'q' to finish";
                        $meta['prompt_loop']="add column for '$tablename' or 'q'>";
                        $meta['prompt_context']="createtable $tablename";
                    }else{
                        $fs->create_db_table($tablename,$data);
                        $output="$tablename created!";
                    }
                    break;
                case 'nd':
                case 'newdata':
                    $tablename = $fs->current_node->get_db_ns();
                    $meta=$fs->pwd_meta();
                    $columns =$meta['cols'];

                    if(!$data){
                        $output="Enter rows for $tablename in csv format:";

                        $columns_format="";
                        foreach($columns as $col){
                            $columns_format.="\"".$col."\",";
                        }
                        $columns_format=rtrim($columns_format,",");

                        $output.="<br>Format is $columns_format";
                        $output.="<br>Press 'q' to finish";
                        $meta['prompt_loop']="insert $columns_format for new row or press 'q' to finish>";
                        $meta['prompt_context']="newdata";
                    }else{
                        $output="Inserting rows into $tablename";

                        foreach($data as $dataline){
                            VFile::insert_csv_db($tablename,$dataline,$columns);

                            $insertSuccessful=DB::table($tablename)->insert($colvalMap);
                            if($insertSuccessful){
                                $output.="<br>$dataline inserted";
                            }else{
                                $error.="<br>$dataline NOT inserted";
                            }
                        }
                    }
                    break;
                case 'touch':
                    $filename = $msgt[1];
                    Storage::put($fs->current_node->fs_path()."/".$filename,"");
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
        if($oformat=='debug'){
            echo 'end of debug';
            exit;
        }
       // var_dump($table);

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
