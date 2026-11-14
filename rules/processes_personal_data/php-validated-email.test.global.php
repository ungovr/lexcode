<?php
// lexcode-expect: 1
// A file with no namespace (a Laravel routes file), where the bare Validator is the facade's
// root alias.

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/newsletter', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'address' => 'required|email',
    ]);

    return $validator->fails() ? back() : redirect('/thanks');
});
