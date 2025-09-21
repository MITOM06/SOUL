<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SeedDemoMedia extends Command
{
    protected $signature = 'demo:seed-media {--force : Run even if media exists}';
    protected $description = 'Attach random cover images and PDF/Youtube demo content for existing products (ebooks & podcasts).';

    public function handle(): int
    {
        $coversBooks    = collect(Storage::disk('public')->files('books/thumbnail'))
            ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p));
        $coversPodcasts = collect(Storage::disk('public')->files('podcasts/thumbnail'))
            ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p));
        $pdfs           = collect(Storage::disk('public')->files('books/Content'))
            ->filter(fn($p) => preg_match('/\.(pdf)$/i', $p));

        $force = (bool) $this->option('force');
        $now   = now();

        $products = DB::table('products')->orderBy('id')->get();
        $this->info('Found products: ' . $products->count());

        foreach ($products as $p) {
            // Assign cover if missing or --force
            if ($p->type === 'ebook') {
                // Ensure /products/{id}/cover.ext + content.pdf exist to keep a clear structure
                $baseDir = "products/{$p->id}";
                if ($force) {
                    // Clean existing files in this product dir
                    if (Storage::disk('public')->exists($baseDir)) {
                        foreach (Storage::disk('public')->files($baseDir) as $f) {
                            Storage::disk('public')->delete($f);
                        }
                    }
                }

                if ($coversBooks->count()) {
                    $coverSrc = $coversBooks->random();
                    $ext = pathinfo($coverSrc, PATHINFO_EXTENSION) ?: 'jpg';
                    $coverDst = "$baseDir/cover.$ext";
                    if ($force || !Storage::disk('public')->exists($coverDst)) {
                        Storage::disk('public')->put($coverDst, Storage::disk('public')->get($coverSrc));
                    }
                    DB::table('products')->where('id', $p->id)->update([
                        'thumbnail_url' => Storage::url($coverDst),
                        'updated_at'    => $now,
                    ]);
                }

                // Attach PDFs (preview + full) under /products/{id}
                $hasPdf = DB::table('product_files')->where('product_id', $p->id)->whereIn('file_type', ['pdf','txt','doc','docx'])->exists();
                if ($force || !$hasPdf) {
                    if ($force) DB::table('product_files')->where('product_id', $p->id)->delete();
                    if ($pdfs->count()) {
                        $pdfSrc = $pdfs->random();
                        $pdfDst = "$baseDir/content.pdf";
                        if ($force || !Storage::disk('public')->exists($pdfDst)) {
                            Storage::disk('public')->put($pdfDst, Storage::disk('public')->get($pdfSrc));
                        }
                        $url = Storage::url($pdfDst);
                        $size = Storage::disk('public')->size($pdfDst) ?: null;
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
                        // Preview: reuse same file as demo
                        DB::table('product_files')->insert([
                            'product_id'     => $p->id,
                            'file_type'      => 'pdf',
                            'file_url'       => $url,
                            'filesize_bytes' => $size,
                            'is_preview'     => 1,
                            'meta'           => json_encode(['note' => 'demo preview']),
                            'created_at'     => $now,
                            'updated_at'     => $now,
                        ]);
                    }
                }
            } elseif ($p->type === 'podcast') {
                $baseDir = "products/{$p->id}";
                if ($force && Storage::disk('public')->exists($baseDir)) {
                    foreach (Storage::disk('public')->files($baseDir) as $f) {
                        Storage::disk('public')->delete($f);
                    }
                }
                if ($coversPodcasts->count()) {
                    $coverSrc = $coversPodcasts->random();
                    $ext = pathinfo($coverSrc, PATHINFO_EXTENSION) ?: 'jpg';
                    $coverDst = "$baseDir/cover.$ext";
                    if ($force || !Storage::disk('public')->exists($coverDst)) {
                        Storage::disk('public')->put($coverDst, Storage::disk('public')->get($coverSrc));
                    }
                    DB::table('products')->where('id', $p->id)->update([
                        'thumbnail_url' => Storage::url($coverDst),
                        'updated_at'    => $now,
                    ]);
                }

                // Attach demo YouTube if none
                $hasVideo = DB::table('product_files')->where('product_id', $p->id)->where('file_type', 'youtube')->exists();
                if ($force || !$hasVideo) {
                    if ($force) DB::table('product_files')->where('product_id', $p->id)->delete();
                    $vids = [ 'pIrkcBp-UO8','dQw4w9WgXcQ','kXYiU_JCYtU','9bZkp7q19f0','3JZ_D3ELwOQ' ];
                    $vid = $vids[array_rand($vids)];
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
                            'title'          => 'Demo clip',
                        ]),
                        'created_at'     => $now,
                        'updated_at'     => $now,
                    ]);
                }
            }
        }

        $this->info('Done.');
        return self::SUCCESS;
    }
}
