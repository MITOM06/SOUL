<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('to_role')->nullable()->index(); // 'user' | 'admin' | null (all)
            $table->unsignedBigInteger('to_user_id')->nullable()->index();
            $table->unsignedBigInteger('from_user_id')->nullable()->index();
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('payload')->nullable(); // e.g. { product: { id, title, thumbnail_url } }
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamps();

            // No FKs for speed/compat; optional: add foreign keys if desired
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};

