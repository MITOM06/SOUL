<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentsTable extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('provider', 100)->nullable(); // Stripe/Momo/Paypal...
            $table->integer('amount_cents')->unsigned();
            $table->string('currency', 10)->default('$');
            $table->enum('status', ['initiated','success','failed','refunded'])->default('initiated');
            $table->string('provider_payment_id', 255)->nullable();
            $table->json('raw_response')->nullable();
            $table->timestamps(6);

            $table->index('provider_payment_id', 'idx_pay_provider_payment_id');
            $table->index('order_id', 'idx_pay_order_id');

            // FK: đảm bảo migrations tạo orders & users đã chạy hoặc tồn tại
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
}
