<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Xoá trigger cũ nếu có
        DB::unprepared("DROP TRIGGER IF EXISTS trg_products_before_delete;");

        // Tạo trigger: trước khi xoá 1 product, xoá toàn bộ orders có chứa nó
        DB::unprepared("
            CREATE TRIGGER trg_products_before_delete
            BEFORE DELETE ON products
            FOR EACH ROW
            BEGIN
                DELETE FROM orders
                WHERE id IN (
                    SELECT DISTINCT order_id
                    FROM order_items
                    WHERE product_id = OLD.id
                );
                -- Sau khi xoá orders, order_items sẽ bị xoá theo (ON DELETE CASCADE)
                -- product_files đã có FK CASCADE (nếu dự án bạn đã set), hoặc bạn có thể xoá trong controller.
            END
        ");
    }

    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS trg_products_before_delete;");
    }
};
