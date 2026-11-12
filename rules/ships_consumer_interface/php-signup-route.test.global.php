<?php
// lexcode-expect: 2
// An older Laravel routes file that uses the global Route alias with no import and no namespace.

Route::post('register', 'Auth\RegisterController@register');
Route::any('/sign_up', 'Auth\RegisterController@showRegistrationForm');
Route::get('/home', 'HomeController@index');
