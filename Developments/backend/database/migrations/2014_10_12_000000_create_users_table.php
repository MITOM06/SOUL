<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('email', 255)->unique();
            $table->string('password_hash', 255);
            $table->enum('role', ['user','admin'])->default('user');
            $table->string('name', 150)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps(6);
            $table->index('role', 'idx_users_role');
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
}
