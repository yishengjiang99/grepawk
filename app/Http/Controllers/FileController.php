<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\FileSystem;
class FileController extends Controller
{
    //
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
