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
        Log::debug("upload api called");
        $fs=FileSystem::getInstance();
        ob_start("callback");

        $cbstr=json_encode([
            'output'=>'Started uploading '
        ]);

        echo "<script>parent.iframe_interface('$cbstr')</script>" ;
        ob_end_flush();

        $output="";
        $error="";
        $hints=[];
        $options=[];
        $file=$request->file("file");
        try{
            $filePath =$file->storeAs($fs->getCd(),$file->getClientOriginalName());
            $output="$filePath is uploaded";
            $options=$fs->ls("-o");
            $hints= $fs->ls("-h");
        }catch(\Exception $e){
            $error=$e->getMessage();
        }
        $cbstr=json_encode([
            "hints"=>$hints,
            "output"=>$output,
            'options'=>$options,
            "error"=>$error,
        ]);
        echo "<script>parent.iframe_interface('$cbstr')</script>";
        ob_end_flush();

    }
    public function create(Request $request){
        $output="";
        $error="";
        $hints=null;
        $filename=$request->input("filename");
        $filecontent=$request->input("filecontent");
        if(!$filename) $error="filename cannot be empty";
        try{
            $fs=FileSystem::getInstance();
            $ret=$fs->put($filename,$filecontent);
            if($ret){
                $output="file $filename created";
                $options=$fs->ls("-o");
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
