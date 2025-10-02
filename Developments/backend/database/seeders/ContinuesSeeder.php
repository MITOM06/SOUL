<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ContinuesSeeder extends Seeder
{
    public function run(): void
    {
        // Lấy user & product
        // Nếu bạn không có cột 'role', dùng tất cả user.
        $userQuery = \App\Models\User::query();
        if (schema_has_column('users', 'role')) {
            $userQuery->where('role', '!=', 'admin');
        }
        $userIds    = $userQuery->pluck('id')->all();
        $productIds = \App\Models\Product::pluck('id')->all();

        if (empty($userIds) || empty($productIds)) return;

        // Số record mong muốn (có thể đổi)
        $TARGET_ROWS = 1000;

        // Không thể tạo nhiều hơn tổng số cặp duy nhất
        $maxPairs = count($userIds) * count($productIds);
        $need = min($TARGET_ROWS, $maxPairs);

        $now = Carbon::now();

        $rows = [];
        $seen = []; // map "userId-productId" => true

        while (count($rows) < $need) {
            $u = $userIds[array_rand($userIds)];
            $p = $productIds[array_rand($productIds)];
            $key = $u . '-' . $p;
            if (isset($seen[$key])) {
                continue; // đã có cặp này, random lại
            }
            $seen[$key] = true;

            $rows[] = [
                'user_id'               => $u,
                'product_id'            => $p,
                'current_chapter'       => random_int(1, 20),
                'current_page'          => random_int(1, 500),
                'current_time_seconds'  => random_int(0, 7200),
                'is_active'             => 1,    // dùng 1/0 cho bool
                'created_at'            => $now,
                'updated_at'            => $now,
            ];
        }

        // Upsert theo unique (user_id, product_id) để nếu seed lại sẽ update thay vì lỗi trùng
        // Chunk để tránh query quá lớn
        foreach (array_chunk($rows, 1000) as $chunk) {
            DB::table('continues')->upsert(
                $chunk,
                ['user_id', 'product_id'],
                ['current_chapter', 'current_page', 'current_time_seconds', 'is_active', 'updated_at']
            );
        }
    }
}

/**
 * Helper: kiểm tra cột tồn tại (dùng Schema facade)
 */
if (!function_exists('schema_has_column')) {
    function schema_has_column(string $table, string $column): bool
    {
        try {
            return \Illuminate\Support\Facades\Schema::hasColumn($table, $column);
        } catch (\Throwable $e) {
            return false;
        }
    }
}
