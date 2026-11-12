<?php
// lexcode-expect: 0
// A role that is not a conversation turn: a user account given an admin role, a team membership, a
// message prompt built in memory and sent to a model without being stored, and a role from a variable.
namespace App\Http\Controllers;

final class TeamController
{
    public function invite(Request $request, Team $team)
    {
        User::create(['email' => $request->input('email'), 'role' => 'admin']);
        $team->members()->create(['user_id' => $request->input('user'), 'role' => 'editor']);
        $prompt = [['role' => 'user', 'content' => $request->input('text')]];
        $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $prompt]);
        Membership::create(['team_id' => $team->id, 'role' => $request->input('role')]);
        return back();
    }
}
