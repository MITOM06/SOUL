<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class FixProductThumbnailsSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure public storage symlink is available
        try { if (!is_link(public_path('storage')) && is_dir(storage_path('app/public'))) @symlink(storage_path('app/public'), public_path('storage')); } catch (\Throwable $e) {}

        $products = DB::table('products')->select('id','type','thumbnail_url','title')->orderBy('id')->get();
        foreach ($products as $p) {
            $type = $p->type === 'podcast' ? 'podcast' : 'ebook';
            $thumb = (string) ($p->thumbnail_url ?? '');

            // Normalize stored thumbnail path (strip domain if present)
            if ($thumb && preg_match('~https?://[^/]+(/.+)$~', $thumb, $m)) {
                $thumb = $m[1];
            }

            $invalid = false;
            if (!$thumb) {
                $invalid = true;
            } else {
                // Wrong source dir for type
                if ($type === 'ebook' && Str::startsWith(ltrim($thumb,'/'), 'podcasts/thumbnail')) $invalid = true;
                if ($type === 'podcast' && Str::startsWith(ltrim($thumb,'/'), 'books/thumbnail')) $invalid = true;

                // If points to storage, verify file exists
                if (!$invalid && Str::startsWith($thumb, '/storage/')) {
                    $rel = Str::after($thumb, '/storage/'); // products/ID/cover.ext
                    if (!Storage::disk('public')->exists($rel)) $invalid = true;
                }
            }

            if ($invalid) {
                // Attempt to pick a proper source image by type
                $srcDir = $type === 'ebook' ? 'books/thumbnail' : 'podcasts/thumbnail';
                $absDir = public_path($srcDir);
                $picked = null;
                try {
                    if (is_dir($absDir)) {
                        $files = collect(File::files($absDir))->filter(function($f){
                            return preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename());
                        })->values();
                        if ($files->isNotEmpty()) $picked = $files->random();
                    }
                } catch (\Throwable $e) {}

                if ($picked) {
                    $ext = strtolower(pathinfo($picked->getFilename(), PATHINFO_EXTENSION) ?: 'jpg');
                    if ($ext === 'jpeg') $ext = 'jpg';
                    $dst = "products/{$p->id}/cover.{$ext}";
                    try {
                        Storage::disk('public')->put($dst, @file_get_contents($picked->getPathname()));
                        DB::table('products')->where('id', $p->id)->update(['thumbnail_url' => Storage::url($dst)]);
                    } catch (\Throwable $e) {
                        DB::table('products')->where('id', $p->id)->update(['thumbnail_url' => null]);
                    }
                } else {
                    // No source images available: clear thumbnail
                    DB::table('products')->where('id', $p->id)->update(['thumbnail_url' => null]);
                }
            }
        }
    }
}

