<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\FileSystem;
use Log;
use Storage;
class FileController extends Controller
{
    //
    public function upload(Request $request){
        Log::critical("upload1 api called");
        $fs=FileSystem::getInstance();

        header( 'Content-type: text/html; charset=utf-8' );
        ob_start();
        js_callback('Starting upload');


        $output="";
        $error="";
        $hints=[];
        $filetype = $request->input("type");

        
        $options=[];
        $file=$request->file("file");
        try{
            $cbstr=json_encode([
                'output'=>'Upload initiating.<br><br><br><br>',
            ]);
            echo "<script>parent.iframe_interface('$cbstr')</script>" ; 
            flush();
            ob_flush();   

            $filePath =$file->storeAs($fs->getPWD(),$file->getClientOriginalName());
            Log::critical("upload1 saving file as $filePath");

            $output="$filePath is uploaded";
            $table=$fs->ls("-t");
            $options=$fs->ls("-o");

           // $hints= $fs->ls("-h");
        }catch(\Exception $e){
            $error=$e->getMessage();
        }

        $cbstr=json_encode([
           // "hints"=>$hints,
            "output"=>$output,
            //'options'=>$options,
            "error"=>$error,
        ]);
        Log::critical("Cb: $cbstr");

        echo "<script>parent.iframe_interface('$cbstr')</script>";
        flush();
        ob_flush();   
        exit;
    }
    public function uploadCSV(Request $request){
        Log::critical("upload api called");
        $fs=FileSystem::getInstance();

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
        $output="";
        $error="";
        $options=null;
        $hints=null;
        $filename=$request->input("filename");
        $filecontent=$request->input("filecontent");
        if(!$filename) $error="filename cannot be empty";
        try{
            $fs=FileSystem::getInstance();
            $ret=$fs->put($filename,$filecontent);
            if($ret){
                $output="file $filename created";
            }else{
                $error="File not created";
            }
        }catch(\Exception $e){
            $error=$e->getMessage();
        }
 
        return response()->json([
            "hints"=>$hints,
            "output"=>$output,
            'options'=>$options,
            "error"=>$error,
        ]);
    }
}
