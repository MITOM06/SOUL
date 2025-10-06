<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class Thumbs
{
    /**
     * Ensure a valid thumbnail URL for a product. If the provided $thumb is
     * empty or points to a missing file, return a type-correct fallback from
     * public/books/thumbnail or public/podcasts/thumbnail. Returns null if no
     * fallback source is available.
     */
    public static function ensureThumb(?string $type, ?string $thumb): ?string
    {
        $thumb = (string) ($thumb ?? '');

        $exists = function (string $path): bool {
            if (str_starts_with($path, '/storage/')) {
                $rel = ltrim(substr($path, strlen('/storage/')), '/');
                return Storage::disk('public')->exists($rel);
            }
            if (str_starts_with($path, '/books/') || str_starts_with($path, '/podcasts/')) {
                return is_file(public_path(ltrim($path, '/')));
            }
            // Unknown scheme: consider missing so FE can normalize
            return false;
        };

        if ($thumb && $exists($thumb)) return $thumb;

        $type = $type === 'podcast' ? 'podcast' : 'ebook';
        $dir = $type === 'ebook' ? 'books/thumbnail' : 'podcasts/thumbnail';
        $abs = public_path($dir);
        try {
            if (is_dir($abs)) {
                $files = collect(File::files($abs))
                    ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                    ->values();
                if ($files->count()) {
                    return '/' . trim($dir, '/') . '/' . $files->random()->getFilename();
                }
            }
        } catch (\Throwable $e) {}

        return null;
    }
}

