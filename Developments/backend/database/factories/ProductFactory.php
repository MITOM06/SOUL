<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;

class ProductFactory extends Factory
{
    protected $model = \App\Models\Product::class;

    public function definition(): array
    {
        // 1) Chọn loại
        $type  = $this->faker->randomElement(['ebook', 'podcast']);
        $title = $this->faker->sentence(4, true);

        // 2) Map type -> ĐÚNG thư mục trong public/
        //    Bạn đang để ảnh tại public/books/thumbnail và public/podcasts/thumbnail
        $dirMap = [
            'ebook'   => 'books/thumbnail',
            'podcast' => 'podcasts/thumbnail',
        ];
        $dir = $dirMap[$type];

        // 3) Chọn 1 ảnh từ public/... theo type
        $coverUrl = null;
        try {
            $abs = public_path($dir);                // ví dụ: {project}/public/books/thumbnail
            if (is_dir($abs)) {
                $files = collect(File::files($abs))
                    ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                    ->values();

                if ($files->isNotEmpty()) {
                    $name = $files->random()->getFilename();
                    // URL hiển thị ra web (theo APP_URL)
                    $coverUrl = asset($dir.'/'.$name); // ví dụ http://127.0.0.1:8000/books/thumbnail/xxx.jpg
                }
            }
        } catch (\Throwable $e) {
            // để null nếu không tìm thấy
        }

        // 4) Metadata theo type
        $metadata = $type === 'ebook'
            ? [
                'pages'    => $this->faker->numberBetween(50, 500),
                'author'   => $this->faker->name(),
                'isbn'     => $this->faker->isbn13(),
                'language' => 'en',
            ]
            : [
                'duration_seconds' => $this->faker->numberBetween(600, 7200),
                'author'           => $this->faker->name(),
                'language'         => 'en',
            ];

        return [
            'type'          => $type,
            'title'         => $title,
            'description'   => $this->faker->paragraph(3, true),
            'price_cents'   => $this->faker->numberBetween(0, 20000), // 0..200 USD
            'thumbnail_url' => $coverUrl, // trỏ đúng public/books/thumbnail | public/podcasts/thumbnail
            'category'      => $this->faker->randomElement(['Programming','Design','Business','Marketing','Health','Education']),
            'slug'          => Str::slug($title) . '-' . Str::random(5),
            'metadata'      => json_encode($metadata),
            'is_active'     => true,
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (\App\Models\Product $p) {
            $now = now();

            if ($p->type === 'ebook') {
                // Gắn PDF từ public/books/Content (preview + full)
                try {
                    $dirPdf = 'books/Content';
                    $absPdf = public_path($dirPdf);
                    if (is_dir($absPdf)) {
                        $pdfs = collect(File::files($absPdf))
                            ->filter(fn($f) => preg_match('/\.pdf$/i', $f->getFilename()))
                            ->values();

                        if ($pdfs->isNotEmpty()) {
                            $file   = $pdfs->random();
                            $name   = $file->getFilename();
                            $abs    = $file->getPathname();
                            $url    = asset("$dirPdf/$name");
                            $size   = @filesize($abs) ?: null;

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
            } else {
                // Podcast: Youtube (preview + full)
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

            // Ảnh phụ (0..3) — dùng CÙNG thư mục thumbnail theo type
            try {
                $dirImg = $p->type === 'ebook' ? 'books/thumbnail' : 'podcasts/thumbnail';
                $absImg = public_path($dirImg);
                if (is_dir($absImg)) {
                    $images = collect(File::files($absImg))
                        ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                        ->values();

                    $extra = random_int(0, 3);
                    for ($i = 0; $i < $extra && $images->isNotEmpty(); $i++) {
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
