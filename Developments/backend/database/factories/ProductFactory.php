<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;

class ProductFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = \App\Models\Product::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        // Choose between an ebook or podcast
        $type  = $this->faker->randomElement(['ebook', 'podcast']);
        // Generate a random title; keep it concise
        $title = $this->faker->sentence(4, true);

        // Pick a cover from public/... based on type
        $coverUrl = null;
        try {
            $dir = $type === 'ebook' ? 'books/thumbnail' : 'podcasts/thumbnail';
            $abs = public_path($dir);

            if (is_dir($abs)) {
                $files = collect(File::files($abs))
                    ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                    ->values();

                if ($files->count() > 0) {
                    $name = $files->random()->getFilename();
                    // URL hiển thị ra web:
                    $coverUrl = asset("$dir/$name"); // hoặc "/$dir/$name" nếu muốn URL tương đối
                }
            }
        } catch (\Throwable $e) {
            // ignore; leave null
        }

        // Build metadata based on the product type
        if ($type === 'ebook') {
            $metadata = [
                'pages'    => $this->faker->numberBetween(50, 500),
                'author'   => $this->faker->name(),
                'isbn'     => $this->faker->isbn13(),
                'language' => 'en',
            ];
        } else {
            $metadata = [
                'duration_seconds' => $this->faker->numberBetween(600, 7200),
                'author'           => $this->faker->name(),
                'language'         => 'en',
            ];
        }

        return [
            'type'          => $type,
            'title'         => $title,
            'description'   => $this->faker->paragraph(3, true),
            'price_cents'   => $this->faker->numberBetween(0, 200000),
            'thumbnail_url' => $coverUrl, // from public if available
            'category'      => $this->faker->randomElement(['Programming','Design','Business','Marketing','Health','Education']),
            // Add a random suffix to ensure slug uniqueness
            'slug'          => Str::slug($title) . '-' . Str::random(5),
            'metadata'      => json_encode($metadata),
            'is_active'     => true,
        ];
    }

    /**
     * After creating a product, attach essential files via product_files.
     * - ebook: 1 preview + 1 full PDF from public/books/Content
     * - podcast: 1 preview + 1 full YouTube link
     * Also attach a few extra images to simulate assets.
     */
    public function configure()
    {
        return $this->afterCreating(function (\App\Models\Product $p) {
            $now = now();

            if ($p->type === 'ebook') {
                try {
                    $dirPdf = 'books/Content';
                    $absPdf = public_path($dirPdf);

                    if (is_dir($absPdf)) {
                        $pdfs = collect(File::files($absPdf))
                            ->filter(fn($f) => preg_match('/\.pdf$/i', $f->getFilename()))
                            ->values();

                        if ($pdfs->count() > 0) {
                            $file   = $pdfs->random();
                            $name   = $file->getFilename();
                            $abs    = $file->getPathname();
                            $url    = asset("$dirPdf/$name");        // URL cho trình duyệt
                            $size   = @filesize($abs) ?: null;       // kích thước file (bytes)

                            // preview
                            DB::table('product_files')->insert([
                                'product_id'     => $p->id,
                                'file_type'      => 'pdf',
                                'file_url'       => $url,
                                'filesize_bytes' => $size,
                                'is_preview'     => 1,
                                'meta'           => json_encode(['note' => 'preview']),
                                'created_at'     => $now,
                                'updated_at'     => $now,
                            ]);

                            // full
                            DB::table('product_files')->insert([
                                'product_id'     => $p->id,
                                'file_type'      => 'pdf',
                                'file_url'       => $url,
                                'filesize_bytes' => $size,
                                'is_preview'     => 0,
                                'meta'           => null,
                                'created_at'     => $now,
                                'updated_at'     => $now,
                            ]);
                        }
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
            } else { // podcast
                $vids  = ['pIrkcBp-UO8','dQw4w9WgXcQ','kXYiU_JCYtU','9bZkp7q19f0','3JZ_D3ELwOQ'];
                $vid   = $vids[array_rand($vids)];
                $watch = "https://www.youtube.com/watch?v={$vid}";
                $embed = "https://www.youtube.com/embed/{$vid}";
                $thumb = "https://img.youtube.com/vi/{$vid}/hqdefault.jpg";

                DB::table('product_files')->insert([
                    'product_id'     => $p->id,
                    'file_type'      => 'youtube',
                    'file_url'       => $watch,
                    'filesize_bytes' => null,
                    'is_preview'     => 1,
                    'meta'           => json_encode([
                        'provider'       => 'youtube',
                        'video_id'       => $vid,
                        'embed_url'      => $embed,
                        'thumbnail_url'  => $thumb,
                        'watch_url'      => $watch,
                        'title'          => 'Preview',
                    ]),
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]);

                DB::table('product_files')->insert([
                    'product_id'     => $p->id,
                    'file_type'      => 'youtube',
                    'file_url'       => $watch,
                    'filesize_bytes' => null,
                    'is_preview'     => 0,
                    'meta'           => json_encode([
                        'provider'       => 'youtube',
                        'video_id'       => $vid,
                        'embed_url'      => $embed,
                        'thumbnail_url'  => $thumb,
                        'watch_url'      => $watch,
                        'title'          => 'Full',
                    ]),
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]);
            }

            // Extra images as supportive attachments (0..3) từ public/...
            try {
                $dirImg = $p->type === 'ebook' ? 'books/thumbnail' : 'podcasts/thumbnail';
                $absImg = public_path($dirImg);

                if (is_dir($absImg)) {
                    $images = collect(File::files($absImg))
                        ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                        ->values();

                    $extra = random_int(0, 3);
                    for ($i = 0; $i < $extra; $i++) {
                        if ($images->count() === 0) break;
                        $pick = $images->random();
                        $name = $pick->getFilename();

                        DB::table('product_files')->insert([
                            'product_id'     => $p->id,
                            'file_type'      => 'image',
                            'file_url'       => asset("$dirImg/$name"),
                            'filesize_bytes' => null,
                            'is_preview'     => 0,
                            'meta'           => null,
                            'created_at'     => $now,
                            'updated_at'     => $now,
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                // ignore
            }
        });
    }
}
