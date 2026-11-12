<?php
// lexcode-expect: 0
// Staff creating an account for someone else in a controller under an Admin namespace, though
// neither the class nor the method names admin: a tool only staff use.
namespace App\Http\Controllers\Admin;

use Illuminate\Auth\Events\Registered;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $user = User::create($request->all());
        event(new Registered($user));
        return redirect('/admin/users');
    }
}
