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
use Schema;
use App\Events\ServerEvent;

class HomeController extends Controller
{

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
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
        ob_end_clean_all();
        ob_start();
        echo 'started ob';
        $is_admin=false;
        if(Auth::user()){
            if(Auth::user()->id===1) $is_admin=true;
            $this->username=Auth::user()->name."@".$_SERVER['REMOTE_ADDR'];
        }else{
            $this->username="guest@".$_SERVER['REMOTE_ADDR'];
        }
      
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
        $os_path = $fs->get_os_path();
        $meta=[];
        $options=null;
        $table=null;
        echo "<br>std msg: $msg";
        ob_end_clean_all();
        ob_start();


        try{
            switch($cmd){
                case "help":
                    $output="type 'ls' to get started.";
                    //$options=$fs->ls('-o');
                    $hints = $fs->ls("-j"); 
                    break;
                case 'checkin':
                    event(new ServerEvent(["output"=>"User ".$this->username." joined"]));
                    $output.="<p>GrepAwk.net is an MMORP-FS. A Massively-Multiuser Online Remote Proactive File System.</p>";
                    $output.="<p>Type ls to get started</p>";
                    $options=$fs->ls('-t');
                    break;
                case 'convert':
                    $file=$argv1;
                    $tablename = $argv2;
                    $path = $fs->get_system_path($argv1);
                    exec("cat $path|grep -v '^$'",$ob);
                    $headers=null;
                    $rows = [];
                    $coltypes=[];
                    foreach($ob as $i=>$line){
                        if($i==0) {
                            $headercsv = str_getcsv($line);
                            foreach($headercsv as $i=>$header){
                                if($header=="") continue;
                                $headers[$i] = strtolower(str_replace(" ","_",$header));
                            }
                            continue;

                        }else if($i==1){
                            $cols = str_getcsv($line);
                            foreach($cols as $i=>$c){
                                $coltypes[$i] = is_numeric($c) ? 'decimal' : 'string';
                            }
                        }
                        $rowobj=[];
                        $lineparts=str_getcsv($line);
                        foreach($headers as $i=>$header){
                            $rowobj[$header]=$lineparts[$i];
                        }
                        $rows[]=$rowobj;    
                    }

                    $header_list=[];
                    foreach($headers as $i=>$header){
                        $header_list[]=$header." ".$coltypes[$i];
                    }
                    $full_table_name=$fs->create_db_table($tablename,$header_list);
                    $row_inserted=0;
                    foreach($rows as $row){
                        $row['created_at']=new \DateTime();
                        $insertSuccessful=DB::table($full_table_name)->insert($row);
                        if(!$insertSuccessful){
                            $errors.="<br>Error inserting ".json_encode($row).".";
                        }else{
                            $row_inserted++;
                        }
                    }
                    $output = "Inserted $row_inserted rows into table $full_table_name";
                    $table = $fs->ls("-t");
                    break;
                case "get":
                    $mimetype = $argv2 ? $argv2 : 'File/File';
                    header("Content-Type: $mimetype");
                    $os_path=$fs->get_os_path()."/".$argv1;
                    ob_end_clean_all();
                    echo readFile($os_path);

                case "ls":               
                    $output = "File list of the ".$fs->getPWD()." folder <br>";
                    $output.= "OS path is ".$fs->get_os_path($fs->getPWD());
                    //$output.= $fs->ls();
                    $hints = $fs->ls("-j"); 
                    $table = $fs->ls("-t");
                    $options=$fs->ls('-o');
                    break;
                case 'cd':   
                    $toCd = $msgt[1];
                    $cd = $fs->cd($toCd); 
                    $output ="Opened $cd folder";
                    $output.="OS path is ".$fs->get_os_path();
                    $table = $fs->ls("-t");
                    $options=$fs->ls('-o');
                    break;
                case 'cat':
                    $ob=[];
                   
                    $ret = $fs->cat($argv1);

                    if(isset($ret['text_output'])){
                        $output = $ret['text_output'];
                    }
                    $meta = array_merge($meta, $ret);
                    break;
                case 'rm':
                    if(!$is_admin){
                        $error='admin only function';
                        break;
                    }
                    $ob=[];
                    $ret=unlink($os_path."/".$argv1);
                    if($ret){
                        $output.="$argv1 unlinked";
                    }
                    $table=$fs->ls("-t");
                    break;

                case 'pwd':
          

                    $output=$fs->get_os_path();
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
                case 'select':
                    $table_ns = str_replace("/", "_", dirname($fs->getPWD()))."_f_".basename($fs->getPWD());
                    $sql=$msg;
                    if(stripos($sql," $tablename")===false){
                        $error="Must query tablename ".$tablename;
                        break;
                    }else{
                        try{
                            $output="Trying SQL statement: $sql";
                            $rows=DB::connection('pgsql')->select($sql);
                            $table_list=[];
                            $table_headers=[];
                            foreach($rows as $i=>$row) {
                                foreach($row as $k=>$val){
                                    if($i==0) $table_headers[]=$k;
                                }
                                $table_list[]=$row;
                            }
                            $table=['headers'=>$table_headers,'rows'=>$table_list];  
                        }catch(\Exception $e){
                            $error=$e->getMessage();
                        }
                    }           
                    break;
                case 'nd':
                case 'newdata':
                    $table_ns = str_replace("/", "_", dirname($fs->getPWD()))."_f_".basename($fs->getPWD());
                   // $table_ns = $fs->get_db_ns();
                   // $meta=$fs->pwd_meta('psql_table');
                    $columns = Schema::getColumnListing($table_ns);
                    $meta=['cols'=> array_values(array_diff($columns,['id','created_at','updated_at']))];

                    $columns =$meta['cols'];
                    if(!$data){
                        $output="Enter rows for $table_ns in csv format:";

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
                        $output="Inserting rows into $table_ns";
                        foreach($data as $dataline){
                            $columnvals = \str_getcsv($dataline);
                            if(count($columnvals) !== count($columns)){
                                throw new \Exception("Column name mismatch for $dataline. Columns are ".implode(", ",$columns));
                            }
                            $colvalMap=[];
                     
                            foreach($columns as $i=>$col){
                                $colvalMap[$col]=$columnvals[$i];
                            }
                            $colvalMap['created_at']=new \DateTime();

                            $insertSuccessful=DB::table($table_ns)->insert($colvalMap);
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
		    touch($fs->get_os_path()."/".$filename);
                    $hints = $fs->ls("-j"); 
                    $table = $fs->ls("-t");
                    event(new ServerEvent(['output'=>$this->username.' make a new file at '.$fs->current_node->fs_path()."/".$filename]));
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
                    $output="You say ".$msg;
                    event(new ServerEvent(['output'=>$this->username.' says: '.$msg]));
                    break;
            }  
        }catch(\Exception $e){
            //throw $e;

           // event(new ServerEvent(['error'=>$this->username." caused an exception with the cmd:<br>$msg"]));

            $error.=$e->getMessage();
            $output.=ob_get_contents();
            ob_end_clean_all();
            // $table = $fs->ls("-t");
        }
        if($oformat=='debug'){
            echo 'end of debug';
            exit;
        }
        $debug=ob_get_contents();
        ob_end_clean_all();

        return response()->json([
            "cd"=>basename($fs->getPWD()),
            'debug'=>$debug,
            "pwd"=>$fs->getPWD(),
            "hints"=>$fs->ls('-j'),
            "output"=>$output,
            'options'=>$options,
            "error"=>$error,
            'meta'=>$meta,
            'table'=>$table
        ]);
    }

}
