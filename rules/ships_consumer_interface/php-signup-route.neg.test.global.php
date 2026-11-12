<?php
// lexcode-expect: 0
// A file with no namespace that imports the app's own Route class (a course-enrolment route table),
// so a bare Route here is not Laravel's global alias.

use App\Routing\Route;

Route::get('register', 'enrolment.register');
Route::post('/sign-up', 'enrolment.store');
