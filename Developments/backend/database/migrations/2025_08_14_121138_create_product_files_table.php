<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductFilesTable extends Migration
{
    public function up()
    {
        Schema::create('product_files', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('product_id');
            $table->enum('file_type', ['pdf','epub','mobi','mp3','mp4','image','other'])->nullable();
            $table->string('file_url', 1000);
            $table->unsignedBigInteger('filesize_bytes')->nullable();
            $table->boolean('is_preview')->default(false);
            $table->json('meta')->nullable();
            $table->timestamps(6);

            $table->index('product_id', 'idx_pf_product_id');
            $table->index('is_preview', 'idx_pf_is_preview');

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_files');
    }
}
