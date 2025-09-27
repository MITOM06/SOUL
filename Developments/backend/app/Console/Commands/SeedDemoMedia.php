<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class SeedDemoMedia extends Command
{
    protected $signature = 'demo:seed-media {--force : Run even if media exists}';
    protected $description = 'Attach random cover images and PDF/Youtube demo content for existing products (ebooks & podcasts).';

    public function handle(): int
    {
        // 1) Chuẩn bị danh sách nguồn trong public/ (đọc trực tiếp từ public_path)
        $coversBooksAbs    = $this->listPublicFiles('books/thumbnail', ['jpg','jpeg','png','webp','avif']);
        $coversPodcastsAbs = $this->listPublicFiles('podcasts/thumbnail', ['jpg','jpeg','png','webp','avif']);

        // Ưu tiên C hoa theo yêu cầu của bạn: public/books/Content
        $pdfsAbs = $this->listPublicFiles('books/Content', ['pdf']);
        if (empty($pdfsAbs)) {
            // fallback nếu thư mục chữ thường
            $pdfsAbs = $this->listPublicFiles('books/content', ['pdf']);
        }

        $force = (bool) $this->option('force');
        $now   = now();

        // 2) Nhắc nhở nếu chưa có symlink public/storage
        $storageLink = public_path('storage');
        if (!is_link($storageLink) && !is_dir($storageLink)) {
            $this->warn('⚠️  Chưa thấy symlink public/storage. Hãy chạy: php artisan storage:link');
        }

        // 3) Lấy toàn bộ products
        $products = DB::table('products')->orderBy('id')->get();
        $this->info('Found products: ' . $products->count());

        foreach ($products as $p) {
            if ($p->type === 'ebook') {
                $baseDir = "products/{$p->id}";
                if ($force) {
                    $this->cleanStorageDir($baseDir);
                }

                // 3a) Gán cover
                if (!empty($coversBooksAbs)) {
                    $coverSrcAbs = $coversBooksAbs[array_rand($coversBooksAbs)];
                    $ext         = strtolower(pathinfo($coverSrcAbs, PATHINFO_EXTENSION) ?: 'jpg');
                    $coverDst    = "$baseDir/cover.$ext";

                    if ($force || !Storage::disk('public')->exists($coverDst)) {
                        $this->copyAbsToPublicDisk($coverSrcAbs, $coverDst);
                    }

                    DB::table('products')->where('id', $p->id)->update([
                        'thumbnail_url' => Storage::url($coverDst), // /storage/products/{id}/cover.ext
                        'updated_at'    => $now,
                    ]);
                }

                // 3b) Gán PDF (full + preview)
                $hasPdf = DB::table('product_files')
                    ->where('product_id', $p->id)
                    ->whereIn('file_type', ['pdf','txt','doc','docx'])
                    ->exists();

                if ($force || !$hasPdf) {
                    if ($force) {
                        DB::table('product_files')->where('product_id', $p->id)->delete();
                    }

                    if (!empty($pdfsAbs)) {
                        $pdfSrcAbs = $pdfsAbs[array_rand($pdfsAbs)];
                        $pdfDst    = "$baseDir/content.pdf";

                        if ($force || !Storage::disk('public')->exists($pdfDst)) {
                            $this->copyAbsToPublicDisk($pdfSrcAbs, $pdfDst);
                        }

                        $url  = Storage::url($pdfDst); // /storage/products/{id}/content.pdf
                        $size = Storage::disk('public')->size($pdfDst) ?: null;

                        // Full
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
                        // Preview (dùng chung file demo)
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
                if ($force) {
                    $this->cleanStorageDir($baseDir);
                }

                // 4a) Gán cover podcast
                if (!empty($coversPodcastsAbs)) {
                    $coverSrcAbs = $coversPodcastsAbs[array_rand($coversPodcastsAbs)];
                    $ext         = strtolower(pathinfo($coverSrcAbs, PATHINFO_EXTENSION) ?: 'jpg');
                    $coverDst    = "$baseDir/cover.$ext";

                    if ($force || !Storage::disk('public')->exists($coverDst)) {
                        $this->copyAbsToPublicDisk($coverSrcAbs, $coverDst);
                    }

                    DB::table('products')->where('id', $p->id)->update([
                        'thumbnail_url' => Storage::url($coverDst),
                        'updated_at'    => $now,
                    ]);
                }

                // 4b) Seed demo YouTube nếu chưa có
                $hasVideo = DB::table('product_files')
                    ->where('product_id', $p->id)
                    ->where('file_type', 'youtube')
                    ->exists();

                if ($force || !$hasVideo) {
                    if ($force) {
                        DB::table('product_files')->where('product_id', $p->id)->delete();
                    }

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
                            'title'          => 'Demo clip',
                        ]),
                        'created_at'     => $now,
                        'updated_at'     => $now,
                    ]);
                }
            }
        }

        $this->info('✅ Done.');
        return self::SUCCESS;
    }

    /**
     * Liệt kê file trong public/{subdir} với whitelist phần mở rộng (case-insensitive).
     * Trả về mảng đường dẫn tuyệt đối (absolute).
     */
    private function listPublicFiles(string $subdir, array $extWhitelist): array
    {
        $absDir = public_path(trim($subdir, '/'));
        if (!is_dir($absDir)) {
            return [];
        }

        $exts = array_map(fn($e) => strtolower($e), $extWhitelist);
        $out  = [];

        foreach (File::files($absDir) as $file) {
            $ext = strtolower($file->getExtension());
            if (in_array($ext, $exts, true)) {
                $out[] = $file->getPathname(); // absolute path
            }
        }
        return $out;
    }

    /**
     * Xoá toàn bộ file trong storage/app/public/{dir}
     */
    private function cleanStorageDir(string $dir): void
    {
        $disk = Storage::disk('public');
        if ($disk->exists($dir)) {
            foreach ($disk->files($dir) as $f) {
                $disk->delete($f);
            }
        }
    }

    /**
     * Copy 1 file tuyệt đối (trong public/ hoặc bất kỳ) vào disk('public') tại đích $dstPath.
     */
    private function copyAbsToPublicDisk(string $absSrc, string $dstPath): void
    {
        $contents = @file_get_contents($absSrc);
        if ($contents === false) {
            throw new \RuntimeException("Cannot read source file: {$absSrc}");
        }
        Storage::disk('public')->put($dstPath, $contents);
    }
}
