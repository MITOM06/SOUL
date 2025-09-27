<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Seed product_files dựa trên media có sẵn ở storage/app/public.
 * - Ebook: gắn 1 PDF preview + 1 PDF full lấy từ books/Content
 * - Podcast: gắn 1 link YouTube preview + 1 link YouTube full
 */
class ProductFilesSeeder extends Seeder
{
    public function run()
    {
        // Seeder này chỉ tạo các file bổ trợ (extra images), KHÔNG đụng tới preview/full bắt buộc.
        $now = now();
        $products = DB::table('products')->orderBy('id')->get();

        foreach ($products as $p) {
            $dir = $p->type === 'ebook' ? 'books/thumbnail' : 'podcasts/thumbnail';
            $files = collect(Storage::disk('public')->files($dir))
                ->filter(fn($x) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $x))
                ->values();
            if ($files->count() === 0) continue;

            $count = random_int(0, 5); // ví dụ count(rand(0,5))
            for ($i = 0; $i < $count; $i++) {
                $path = $files->random();
                DB::table('product_files')->insert([
                    'product_id'     => $p->id,
                    'file_type'      => 'image',
                    'file_url'       => Storage::url($path),
                    'filesize_bytes' => null,
                    'is_preview'     => 0,
                    'meta'           => null,
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]);
            }
        }
    }
}
