<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductsTable extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->enum('type', ['ebook','podcast']);
            $table->string('title', 300);
            $table->text('description')->nullable();
            $table->integer('price_cents')->default(0);
            $table->string('thumbnail_url', 1000)->nullable();
            $table->string('category', 120)->nullable();
            $table->string('slug', 300)->unique();
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps(6);
            $table->index('type', 'idx_products_type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
}
