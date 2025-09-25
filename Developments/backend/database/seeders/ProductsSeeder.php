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
        // 1) Create exactly 100 ebooks and 100 podcasts
        $ebooks   = Product::factory()->count(100)->state(['type' => 'ebook'])->create();
        $podcasts = Product::factory()->count(100)->state(['type' => 'podcast'])->create();
        $products = $ebooks->concat($podcasts);

        // Mark some items as free (price_cents = 0) for both ebooks and podcasts
        $freeE = $ebooks->shuffle()->take(10);
        foreach ($freeE as $p) {
            DB::table('products')->where('id', $p->id)->update(['price_cents' => 0]);
        }
        $freeP = $podcasts->shuffle()->take(10);
        foreach ($freeP as $p) {
            DB::table('products')->where('id', $p->id)->update(['price_cents' => 0]);
        }

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
