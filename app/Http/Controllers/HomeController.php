<?php



namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\ Database\ Eloquent\ Model;

use Illuminate\Support\Facades\Storage;
use Illuminate\Console\Parser;
use Auth;
use File;
use Log;

use DB;
use Cookie;
use Session;
use Player;
use App\FileSystem;
use App\VFile;
use Schema;
use App\Events\ServerEvent;



class Playerr extends Model {
    public static $os_base_path ="{BASE_PATH}/data/players/{USERNAME}";
    private $profile;
    private $player_folder;
    private $username;
    
    public function __construct($profile){   
        $this->profile=$profile;
        if(!isset($profile['username'])){
		$profile['username']='guest';
        }
        $this->username=$profile['username'];
        $this->player_folder = base_path()."/data/players/".$profile['username']."/";
        $this->is_admin= $this->username==='yisheng';
        $this->fs = new FileSystem($this->username);
    }
    public function getProfile(){
        $obj= json_decode(json_encode($this->profile));
        $obj->created_str = date('r',$obj->created);
        return $obj;
    }
    public function updateLog($event){
        file_put_contents($this->player_folder."/events.txt","\n".time().",".$event, FILE_APPEND);
    }
    public function updateProfile($key,$val,$delta=false){
        $this->profile[$key]= $delta ? (intval($this->profile[$key])+intval($val)) : $val;
        $this->persist_profile();
    }

    //save to disk, session, cookie
    public function persist_profile(){ 
        $username=$this->profile['username'];
        if(!file_exists($this->player_folder)){
            mkdir($this->player_folder);
            touch($this->player_folder."/char.txt");
            touch($this->player_folder."/events.txt");
        }
        file_put_contents($this->player_folder."/char.txt",json_encode($this->profile)); 
        session(['profile_json'=>json_encode($this->profile)]);
        session(['profile2'=>$this->profile]);  
        Cookie::queue('profile3',json_encode($this->profile),394223);
    }
    
    
    public static function checkSession(){
   
        $profile = session("profile3");
        if(!$profile){
            $profile=Cookie::get('profile5');
            if($profile){
                $profile = json_decode($profile,1);
                $profile['source']='cookie';
                $profile['session_start']=time();
                $profile['cookie_created']=time();
            }else{
                $profile=[
                    'username'=>'guest_'.$_SERVER['REMOTE_ADDR'],
                    'visits'=>1,
                    'xp'=>0,'gold'=>0,
                    'source'=>'new',
                    'created'=>time(),
                    'updated'=>time()
                ];
            }
        }else{
            if(is_string($profile)) $profile=json_decode($profile,1);
           // dd($profile);
            $profile['source']='session';
            $profile['session_updated']=time();
        }
        $player=new Playerr($profile);
        $player->persist_profile();
        return  $player;
    }
    public static function get_profile_username($username){
        $profile=file_get_contents(self::os_base_path."/username/char.txt");
        return json_code($profile);
    }
}

class HomeController extends Controller
{

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {	
       $this->player_file=Playerr::checkSession();

    }

    private $cookies=[];
    private $username="guest";
    private $player_file;
    private $is_admin=false;
    private $fs;
    

    // private function saveSession($profile){
    //     session(['profile'=>$profile]);  
    //     Cookie::queue('profile',json_encode($profile),394223);
    //     Playerr::write_profile($profile);

    // }


    
    private $playerObj; // App/Playerr
    private function checkSession(){
        $playerObj=Playerr::checkSession();
        $this->playerObj = $playerObj;
        $this->player_file=$playerObj->getProfile();
        $this->fs = $playerObj->fs;
        $this->is_admin = $playerObj->is_admin;
        $this->username = $this->player_file->username;
    } 


    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
	    $this->checkSession();
        return view('home');
    }

    public function terminal(){
        $this->checkSession();
        return view('terminal',['username'=>$this->username, 
                                'pwd'=>$this->fs->getPWD(),
                                ]);
    }

    public function stdin(Request $request){
        $this->checkSession();

        $fs = $this->fs;
        
        $player_file = $this->player_file;

        $is_admin=$this->is_admin;


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
        $pwd = $fs->getPWD();
        $os_path = $fs->get_os_path();
        $meta=[];
        $options=null;
        $table=null;
        echo "<br>std msg: $msg";
        ob_end_clean_all();
        ob_start();
	    $cookies=[];
        try{
            switch($cmd){
        		case 'cookie': 
        			$output = json_encode($this->player_file);
        			break;
        		case 'debug':
        			$output=json_encode(session('me'));
        			$output.=json_encode($_COOKIE);
        			$output.=$this->username;
        			break;
                case "help":
                    $output="type 'ls' to get started.";
                    $hints = $fs->ls("-j"); 
                    break;
        		case "register":
		        case "login":
        			if(!$argv1) {
        				$error="Usage: $cmd {username} {password}";
        				break;
        			}else {
        				$this->username=$argv1;
                        $this->playerObj->updateProfile('username',$this->username);
                        $this->checkSession();
                        $fs = $this->fs;
                        $player_file = $this->player_file;
        				$output="Logged in as ".$this->username;
        				$cmd="checkin";
        			}
		case 'stats':
                            $output.="<p>";
                            foreach($player_file as $k=>$v){
                                    $output.="<br>$k: $v";
                            }
                            $output.="</p>";
                case 'checkin':
                    event(new ServerEvent(["output"=>"User ".$this->username." joined"]));
                    $output.="<p>GrepAwk.net is an MMORP-FS. A Massively-Multiuser Online Remote Proactive File System.</p>";
                    $output.="<p>Type ls to get started</p>";
                    $options=$fs->ls('-o');
                    break;

                case 'convert':
                    $file=$argv1;
                    $tablename = $argv2;
		
		    
                    $os_path = $this->fs->get_os_path()."/$file";
                    exec("cat $os_path|grep -v '^$'",$ob);
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
                    $destination = $argv1 ? $argv1 : "";
                    if($destination){
                        $destination_path = $fs->cd($destination,true); //dry cd
                    }else{
                        $destination_path = $fs->getPWD();
                    }
                    $output = "File list of the $destination_path folder <br>";
                    $output.= "OS path is ".$fs->get_os_path($destination_path);
                    $hints = $fs->ls("-j",$destination_path); 
                    $table = $fs->ls("-t",$destination_path);
                    $options=$fs->ls('-o',$destination_path);
                    break;
                case 'cd':   
                    $toCd = $msgt[1];
                    $cd = $fs->cd($toCd); 
                    $output ="Opened $cd folder";
                    $output.="<br>OS path is ".$fs->get_os_path();
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
                    $sql=$msg;
                    if(false){
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
                    Storage::put($fs->current_node->fs_path()."/".$filename,"");
                    $output ="Created new file $filename";
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
		case 'fs':
			$output=implode("<br>",array_keys($fs->xpath_map));
			break;
        		case 'say':
        		case 'yell':
                    $output="You $cmd ".$msg;
                    event(new ServerEvent(['output'=>$this->username."$cmd: ".$msg]));
        		    break;
        		default:
        		    $error="Unknown command $cmd";
                    $output="-10 xp";
                    $this->playerObj->updateProfile('xp','-10',true);
                            
                    break;
            }  
            $this->playerObj->updateLog("msg_success,$msg");
        }catch(\Exception $e){
            throw $e;
            $this->playerObj->updateLog("msg_exception,$msg,\"".$e->getMessage()."\"");

            $error.=$e->getMessage();
            $output.=ob_get_contents();
            ob_end_clean_all();
        }

        //$this->playerObj->updateLog("msg_success,$msg");


        


        if($oformat=='debug'){
            echo 'end of debug';
            exit;
        }
        $debug=ob_get_contents();
        ob_end_clean_all();
	
        $ret=[
            "cd"=>basename($fs->getPWD()),
            "username"=>$this->username,
            'debug'=>$debug,
            "pwd"=>$fs->getPWD(),
            "hints"=>$fs->ls('-j'),
            "output"=>$output,
            'options'=>$options,
            "error"=>$error,
            'meta'=>$meta,
            'table'=>$table
        ];
        $this->playerObj->persist_profile();
		return response()->json($ret);
    }

}
