<?php
use Illuminate\Support\Facades\Cache;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});


use App\User;
Route::get('/user/{id}', function($id){
   $user = User::findOrFail($id);
   echo $user->name; 
})->where('id','[0-9]+');

Route::get("/users/", function(){
   $users = User::all();
   foreach($users as $user){
       echo "<br>".$user->email;
   }    
});

Route::get('/user/{name}', function($name){
   $users = User::where('name','like', '%'.$name.'%')->get();
   foreach($users as $user){
       echo "<br>".$user->email;
   }
})->where('id','[A-Za-z]+');

Route::get('/file/{name}', function($name){
    echo asset('storage/'.$name.'.txt');
})->where('name','!=','new');;


Route::view('/file/new', 'newfile');

Route::post("/file/new", function(){    
});
Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');



Route::get('/cache', function () {
    echo Cache::get('key');
});

Route::get('/weather', function(){
    echo 'weather';
})->middleware("Location");

use App\Events\ServerEvent;

Route::get('/ping', function(){
    event(new ServerEvent("Ping"));
});


Route::view('/pusher', 'pusher');

Route::get('/terminal','HomeController@terminal');

Route::resource('photos', 'PhotoController')->except(['show']);
Route::get('photos/{filename}', 'PhotoController@show');
Route::get('stdin', 'HomeController@stdin');
Route::view("modal/newfile","newfile");
Route::post("photos/create","PhotoController@create");
Route::post("files/new","FileController@create");
Route::post("files/upload","FileController@upload");

Route::get("files/upload","FileController@upload");

