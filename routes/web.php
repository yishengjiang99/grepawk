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

Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');



Route::get('/cache', function () {
    echo Cache::get('key');
});

use App\Events\ServerEvent;

Route::get('/ping', function(){
    echo 'ddd';

    $value = config('app.broadcasting.default');
    echo $value."]";

    event(new ServerEvent("Ping"));
});


Route::view('/pusher', 'pusher');

