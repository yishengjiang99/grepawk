<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\FileSystem;
use Log;
use Config;
use Storage;
class FileController extends HomeController
{
    //
    public function upload(Request $request){
	    $this->checkSession();
        Log::critical("upload1 api called");
        $fs=$this->fs;

        header( 'Content-type: text/html; charset=utf-8' );
        ob_start();
        $output="";
        $error="";
        $hints=[];
        $filetype = $request->input("type");
        $table=[];
        $options=[];

        $file=$request->file("file");
        try{
            $cbstr=json_encode([
                'output'=>'Upload initiating.',
            ]);
            echo "<script>parent.iframe_interface('$cbstr')</script>" ; 
            flush();
            ob_flush();   
            $filePath=base_path()."/data/".$file->getClientOriginalName();
	        move_uploaded_file( $_FILES['file']['tmp_name'], $filePath);
            Log::critical("upload 1 saving file as $filePath");
            $output="$filePath is uploaded";
            //$table=$fs->ls("-t");
            $options=$fs->ls("-o");
            $hints= $fs->ls("-j");
        }catch(\Exception $e){
            $error=$e->getMessage();
        }

        $cbstr=json_encode([
          //  "table"=>$table,
            "hints"=>$hints,
            "output"=>$output,
            'options'=>$options,
            "error"=>$error,
        ]);
        Log::critical("Cb: $cbstr");
        echo "<script>parent.iframe_interface('$cbstr')</script>" ; 
        flush();
        ob_flush();   
        exit;
    }
    public function uploadCSV(Request $request){
        $this->checkSession();

        Log::critical("upload api called");
        $fs=$this->fs;

        header( 'Content-type: text/html; charset=utf-8' );
        ob_start();
        js_callback('Starting upload');

        $output="";
        $error="";
        $hints=[];
        
        $options=[];
        $file=$request->file("file");
        try{
            js_callback('Upload initiating');
            $filePath =$file->storeAs($fs->getPWD(),$file->getClientOriginalName());

            $output="$filePath is uploaded";
            $options=$fs->ls("-o");
            $hints= $fs->ls("-h");
        }catch(\Exception $e){
            $error=$e->getMessage();
        }
    }
    
    public function create(Request $request){
        $this->checkSession();

        $output="";
        $error="";
        $options=null;
        $hints=null;
        $filename=$request->input("filename");
        $filecontent=$request->input("filecontent");
        if(!$filename) $error="filename cannot be empty";
        try{
            $fs=$this->fs;
            $file_path=$fs->put($filename,$filecontent);
            if($file_path){
                $output="file $file_path created";
            }else{
                $error="File not created";
            }
        }catch(\Exception $e){
            $error=$e->getMessage();
        }
 
        return response()->json([
            "hints"=>$hints,
            "output"=>$output,
            "options"=>$fs->ls("-o"),
	    "table"=>$fs->ls("-t"),
            "error"=>$error,
        ]);
    }
}
