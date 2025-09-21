<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Product;

/**
 * Seed the products table with a variety of ebooks and podcasts.  Using the
 * ProductFactory ensures that each product includes English titles and
 * metadata appropriate for its type.
 */
class ProductsSeeder extends Seeder
{
    public function run()
    {
        // 1) Tạo N sản phẩm (ebook/podcast) từ factory (thumbnail sẽ null)
        $products = Product::factory()->count(30)->create();

        // 2) Gán cover từ thư mục public storage (đã chuẩn bị sẵn)
        $coversBooks    = collect(Storage::disk('public')->files('books/thumbnail'))
            ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p))
            ->values();
        $coversPodcasts = collect(Storage::disk('public')->files('podcasts/thumbnail'))
            ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p))
            ->values();

        $now = now();
        foreach ($products as $p) {
            if (empty($p->thumbnail_url)) {
                if ($p->type === 'ebook' && $coversBooks->isNotEmpty()) {
                    $cover = $coversBooks->random();
                    DB::table('products')->where('id', $p->id)->update([
                        'thumbnail_url' => Storage::url($cover),
                        'updated_at'    => $now,
                    ]);
                } elseif ($p->type === 'podcast' && $coversPodcasts->isNotEmpty()) {
                    $cover = $coversPodcasts->random();
                    DB::table('products')->where('id', $p->id)->update([
                        'thumbnail_url' => Storage::url($cover),
                        'updated_at'    => $now,
                    ]);
                }
            }
        }
    }
}
