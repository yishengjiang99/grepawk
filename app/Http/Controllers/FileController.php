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
        die("<script>parent.iframe_interface('$cbstr')</script>");
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
