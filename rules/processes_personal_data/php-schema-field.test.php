<?php
// lexcode-expect: 8
// Stored columns for an email, a phone number, a date of birth, a government identifier and
// an IP or device address, declared in Laravel migrations and a Doctrine DBAL schema.

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCustomersTable extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone_number', 32)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('passport_number')->nullable();
            $table->ipAddress()->nullable();
            $table->macAddress('device_mac')->nullable();
            // A chain split over lines, which the rule's text anchor must admit.
            $table
                ->string(
                    'mobile',
                    20,
                )
                ->nullable();
            $table->timestamps();
        });
    }

    // Doctrine DBAL: a schema table.
    public function doctrine($schema): void
    {
        $table = $schema->createTable('subscribers');
        $table->addColumn('email_address', 'string', ['length' => 180]);
    }
}
