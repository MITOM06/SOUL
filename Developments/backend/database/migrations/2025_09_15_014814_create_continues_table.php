<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateContinuesTable extends Migration
{
    public function up()
    {
        Schema::create('continues', function (Blueprint $table) {
            $table->bigIncrements('id');

            // Quan hệ với user
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Quan hệ với product (ebook hoặc podcast)
            $table->unsignedBigInteger('product_id');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');

            // Tiến trình người dùng
            $table->integer('current_chapter')->default(1);       // chương hiện tại
            $table->integer('current_page')->nullable();          // trang hiện tại (ebook)
            $table->integer('current_time_seconds')->nullable();  // thời gian hiện tại (podcast)

            // Trạng thái active/inactive nếu muốn mở rộng
            $table->boolean('is_active')->default(true);

            // Thời gian tạo / cập nhật
            $table->timestamps();  // created_at + updated_at

            // Index để query nhanh
            $table->index('user_id', 'idx_continues_user');
            $table->index('product_id', 'idx_continues_product');
        });
    }

    public function down()
    {
        Schema::dropIfExists('continues');
    }
}
