<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->id();

            // Khóa ngoại tới users
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Gói subscription (ví dụ: vip, basic, premium,...)
            $table->string('plan_key', 50);

            // Giá tiền (tính bằng cents)
            $table->integer('price_cents')->unsigned();

            // Ngày bắt đầu - kết thúc
            $table->dateTime('start_date');
            $table->dateTime('end_date');

            // Trạng thái (active, expired, canceled, pending...)
            $table->string('status', 20)->default('active');

            // Khóa ngoại tới payments (nếu có thanh toán liên kết)
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->foreign('payment_id')->references('id')->on('payments')->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_subscriptions');
    }
};
