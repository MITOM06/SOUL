<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) Bỏ FK cũ nếu tên chuẩn; nếu tên khác, bạn có thể dùng DB::statement để drop theo tên thực tế
        Schema::table('order_items', function (Blueprint $table) {
            try { $table->dropForeign('order_items_order_id_foreign'); } catch (\Throwable $e) {}
        });

        // 2) Tạo lại FK: ON DELETE CASCADE
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('order_id')
                ->references('id')->on('orders')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            try { $table->dropForeign('order_items_order_id_foreign'); } catch (\Throwable $e) {}
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('order_id')
                ->references('id')->on('orders')
                ->restrictOnDelete();
        });
    }
};
