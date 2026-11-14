<?php
// lexcode-expect: 0
// Columns that hold no personal data, column operations that store nothing, and a builder that
// is not a table.

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            // Named for email, but a template, a flag and a count, not an address.
            $table->string('email_subject');
            $table->text('email_template');
            $table->boolean('email_verified');
            $table->integer('phone_calls_count');
            // An anonymous daily total.
            $table->date('day');
            $table->unsignedInteger('signups');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            // Removing or indexing a column stores nothing new.
            $table->dropColumn('phone');
            $table->index('email');
            $table->renameColumn('mobile', 'mobile_old');
        });
    }
};

// A form builder whose field names read like columns.
function contactForm($form)
{
    $form->string('email');
    $form->date('date_of_birth');
}
