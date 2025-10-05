<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    protected $model = \App\Models\Product::class;

    public function definition(): array
    {
        // 1) Type & category
        $type     = $this->faker->randomElement(['ebook', 'podcast']);
        $category = $this->faker->randomElement([
            'Programming','Design','Business','Marketing','Health','Education'
        ]);

        // 2) Title theo type
        if ($type === 'ebook') {
            $modifier  = $this->faker->randomElement(['Essentials','Basics','Guide','Handbook','Principles']);
            $title     = ucfirst($category) . ' ' . $modifier . ': ' . $this->faker->catchPhrase();
        } else {
            $titleOptions = [
                'The ' . ucfirst($category) . ' Podcast',
                'Exploring ' . ucfirst($category),
                ucfirst($category) . ' Conversations',
            ];
            $title = $this->faker->randomElement($titleOptions);
        }

        // 3) Chọn 1 ảnh NGUỒN theo type (đường dẫn public tương đối, KHÔNG asset())
        $dirMap = [
            'ebook'   => 'books/thumbnail',
            'podcast' => 'podcasts/thumbnail',
        ];
        $dir = $dirMap[$type];

        $coverSrc = null; // ví dụ: 'books/thumbnail/xxx.jpg'
        try {
            $abs = public_path($dir);
            if (is_dir($abs)) {
                $files = collect(File::files($abs))
                    ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                    ->values();

                if ($files->isNotEmpty()) {
                    $coverSrc = $dir . '/' . $files->random()->getFilename();
                }
            }
        } catch (\Throwable $e) {
            // để null nếu không tìm thấy
        }

        // 4) Metadata theo type (mảng để Eloquent cast)
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
            'description'   => $this->faker->paragraphs(2, true),
            'price_cents'   => $this->faker->numberBetween(0, 20000),
            // TẠM lưu nguồn cover để afterCreating chuẩn hoá (đặt dạng '/books/thumbnail/xxx.jpg')
            'thumbnail_url' => $coverSrc ? ('/' . ltrim($coverSrc, '/')) : null,
            'category'      => $category,
            'slug'          => Str::slug($title) . '-' . Str::random(5),
            'metadata'      => $metadata, // KHÔNG json_encode
            'is_active'     => true,
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (\App\Models\Product $p) {
            $now = now();

            /* ===================== CHUẨN HOÁ COVER ===================== */
            try {
                $src = $p->thumbnail_url ? ltrim((string)$p->thumbnail_url, '/') : null; // VD: 'books/thumbnail/xxx.jpg'
                if ($src) {
                    // Chốt: ebook không nhận nguồn từ podcasts/, podcast không nhận từ books/
                    if ($p->type === 'ebook' && Str::startsWith($src, 'podcasts/thumbnail')) {
                        $src = null;
                    }
                    if ($p->type === 'podcast' && Str::startsWith($src, 'books/thumbnail')) {
                        $src = null;
                    }
                }

                if ($src) {
                    $abs = public_path($src);
                    if (is_file($abs)) {
                        $ext = strtolower(pathinfo($abs, PATHINFO_EXTENSION) ?: 'jpg');
                        if ($ext === 'jpeg') $ext = 'jpg';

                        $dst = "products/{$p->id}/cover.{$ext}";
                        Storage::disk('public')->put($dst, @file_get_contents($abs));
                        $p->update(['thumbnail_url' => Storage::url($dst)]);
                    } else {
                        // Không tìm thấy file nguồn -> bỏ cover để FE dùng placeholder
                        $p->update(['thumbnail_url' => null]);
                    }
                } else {
                    // Không có nguồn hợp lệ -> bỏ cover
                    $p->update(['thumbnail_url' => null]);
                }
            } catch (\Throwable $e) {
                // Lỗi đọc/ghi -> bỏ cover
                $p->update(['thumbnail_url' => null]);
            }

            /* ===================== NỘI DUNG THEO TYPE ===================== */
            if ($p->type === 'ebook') {
                // Gắn PDF (preview + full) từ public/books/Content
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
                try {
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
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            /* ===================== ẢNH PHỤ (0..3) ===================== */
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
