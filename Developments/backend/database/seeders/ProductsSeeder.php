<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
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
        // 1) Create 500 products total: split evenly between ebooks and podcasts
        $ebooksCount   = 250;
        $podcastsCount = 250;
        $ebooks   = Product::factory()->count($ebooksCount)->state(['type' => 'ebook'])->create();
        $podcasts = Product::factory()->count($podcastsCount)->state(['type' => 'podcast'])->create();
        $products = $ebooks->concat($podcasts);

        // Mark a subset of items as free (price_cents = 0).  We choose 20
        // ebooks and 20 podcasts at random to be permanently free.
        $freeE = $ebooks->shuffle()->take(min(20, $ebooks->count()));
        foreach ($freeE as $p) {
            DB::table('products')->where('id', $p->id)->update(['price_cents' => 0]);
        }
        $freeP = $podcasts->shuffle()->take(min(20, $podcasts->count()));
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

        $now = Carbon::now();
        // Randomize created_at/updated_at for each product to lie between 2024‑01‑01 and now
        $startDate = Carbon::create(2024, 1, 1, 0, 0, 0);
        foreach ($products as $p) {
            // ensure thumbnails exist
            if (empty($p->thumbnail_url)) {
                if ($p->type === 'ebook' && $coversBooks->isNotEmpty()) {
                    $cover = $coversBooks->random();
                    DB::table('products')->where('id', $p->id)->update([
                        'thumbnail_url' => Storage::url($cover),
                    ]);
                } elseif ($p->type === 'podcast' && $coversPodcasts->isNotEmpty()) {
                    $cover = $coversPodcasts->random();
                    DB::table('products')->where('id', $p->id)->update([
                        'thumbnail_url' => Storage::url($cover),
                    ]);
                }
            }
            // assign random created_at and updated_at times
            $randTs = $this->randomDateBetween($startDate, $now);
            DB::table('products')->where('id', $p->id)->update([
                'created_at' => $randTs,
                'updated_at' => $randTs,
            ]);
        }
    }

    /**
     * Generate a random Carbon instance between two dates.
     */
    private function randomDateBetween(Carbon $start, Carbon $end): Carbon
    {
        $min = $start->getTimestamp();
        $max = $end->getTimestamp();
        $ts  = random_int($min, $max);
        return Carbon::createFromTimestamp($ts);
    }
}
