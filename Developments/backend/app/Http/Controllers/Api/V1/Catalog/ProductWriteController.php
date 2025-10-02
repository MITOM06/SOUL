<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\PersonalAccessToken;

class ProductWriteController extends Controller
{
    /*
     * POST /api/v1/catalog/products
     * Body JSON: { type,title,description,price_cents,thumbnail_url?,category?,slug?,metadata?,is_active?, files?[] }
     * Chính sách an toàn ảnh bìa:
     * - Luôn chuẩn hoá ảnh bìa vào /storage/products/{id}/cover.ext
     * - Cấm ebook dùng thumbnail YouTube
     * - Không tự động lấy ảnh từ product_files làm bìa
     */
    public function store(Request $r)
    {
        $data = $r->all();

        $v = Validator::make($data, [
            'type'           => 'required|in:ebook,podcast',
            'title'          => 'required|string|max:300',
            'description'    => 'nullable|string',
            'price_cents'    => 'required|integer|min:0',
            'thumbnail_url'  => 'nullable|string|max:1000',
            'category'       => 'nullable|string|max:120',
            'slug'           => 'nullable|string|max:300',
            'metadata'       => 'nullable',
            'is_active'      => 'nullable|boolean',

            // Giữ tương thích API cũ: cho phép gửi "files" kèm URL (nhưng KHÔNG dùng làm cover)
            'files'                  => 'nullable|array',
            'files.*.file_type'      => 'required_with:files|string|max:50',
            'files.*.file_url'       => 'required_with:files|string|max:1000',
            'files.*.filesize_bytes' => 'nullable|integer|min:0',
            'files.*.is_preview'     => 'nullable|boolean',
            'files.*.meta'           => 'nullable',
        ]);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }

        // Cấm ebook dùng thumbnail là YouTube
        if (($data['type'] ?? null) === 'ebook' && $this->isYoutubeThumb((string)($data['thumbnail_url'] ?? ''))) {
            return response()->json(['success'=>false,'message'=>'Ebook thumbnail cannot be a YouTube thumbnail'], 422);
        }

        DB::beginTransaction();
        try {
            $now  = now();
            $slug = $data['slug'] ?? Str::slug($data['title']).'-'.substr(md5((string)$now),0,6);

            // Lưu trước, thumbnail để null rồi xử lý chuẩn hoá sau (nếu có)
            $id = DB::table('products')->insertGetId([
                'type'          => $data['type'],
                'title'         => $data['title'],
                'description'   => $data['description'] ?? null,
                'price_cents'   => $data['price_cents'],
                'thumbnail_url' => null,
                'category'      => $data['category'] ?? null,
                'slug'          => $slug,
                'metadata'      => $this->normalizeMetadata($data['metadata'] ?? null),
                'is_active'     => (int) ($data['is_active'] ?? 1),
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);

            // Chuẩn hoá thumbnail nếu client có gửi
            if (!empty($data['thumbnail_url'])) {
                $normalized = $this->normalizeCoverAndSave((string)$data['thumbnail_url'], $id, (string)$data['type']);
                if ($normalized) {
                    DB::table('products')->where('id',$id)->update([
                        'thumbnail_url' => $normalized,
                        'updated_at'    => now(),
                    ]);
                }
            }

            // Tương thích: cho phép ghi thêm các file URL (không ảnh hưởng bìa)
            if (!empty($data['files']) && is_array($data['files'])) {
                foreach ($data['files'] as $f) {
                    DB::table('product_files')->insert([
                        'product_id'     => $id,
                        'file_type'      => (string)$f['file_type'],
                        'file_url'       => (string)$f['file_url'],
                        'filesize_bytes' => $f['filesize_bytes'] ?? null,
                        'is_preview'     => !empty($f['is_preview']) ? 1 : 0,
                        'meta'           => isset($f['meta']) ? $this->jsonOrNull($f['meta']) : null,
                        'created_at'     => $now,
                        'updated_at'     => $now,
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success'=>true,'data'=>['id'=>$id],'message'=>'Product created']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success'=>false,'message'=>$e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/v1/catalog/products/{id}
     * Không cho phép đổi type ở đây để tránh lẫn dữ liệu; nếu cần, tạo API riêng.
     */
    public function update(Request $r, $id)
    {
        $data = $r->all();

        $v = Validator::make($data, [
            'title'         => 'sometimes|required|string|max:300',
            'description'   => 'nullable|string',
            'price_cents'   => 'sometimes|required|integer|min:0',
            'thumbnail_url' => 'nullable|string|max:1000',
            'category'      => 'nullable|string|max:120',
            'slug'          => 'nullable|string|max:300',
            'metadata'      => 'nullable',
            'is_active'     => 'nullable|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }

        $row = DB::table('products')->where('id',$id)->first();
        if (!$row) return response()->json(['success'=>false,'message'=>'Product not found'],404);

        $upd = [];
        foreach (['title','description','price_cents','category','slug'] as $k) {
            if (array_key_exists($k,$data)) $upd[$k] = $data[$k];
        }
        if (array_key_exists('metadata',$data)) {
            $upd['metadata'] = $this->normalizeMetadata($data['metadata']);
        }
        if (array_key_exists('is_active',$data)) {
            $upd['is_active'] = (int) $data['is_active'];
        }

        // Chuẩn hoá thumbnail nếu client gửi lên
        if (array_key_exists('thumbnail_url', $data)) {
            // Ebook không cho dùng YouTube thumb
            if ($row->type === 'ebook' && $this->isYoutubeThumb((string)$data['thumbnail_url'])) {
                return response()->json(['success'=>false,'message'=>'Ebook thumbnail cannot be a YouTube thumbnail'], 422);
            }
            $normalized = $this->normalizeCoverAndSave((string)$data['thumbnail_url'], (int)$id, (string)$row->type);
            $upd['thumbnail_url'] = $normalized ?: null;
        }

        $upd['updated_at'] = now();

        DB::table('products')->where('id',$id)->update($upd);
        return response()->json(['success'=>true,'message'=>'Product updated']);
    }

    /**
     * POST /api/v1/catalog/products/{id}/files
     * Nhận: pdf, txt, doc, docx (ebook) | mp3, m4a, wav, mp4 (podcast)
     * KHÔNG dùng làm ảnh bìa.
     */
    public function uploadFiles(Request $r, $id)
    {
        $product = DB::table('products')->where('id',$id)->first();
        if (!$product) return response()->json(['success'=>false,'message'=>'Product not found'],404);

        $hasSingle   = $r->hasFile('file');
        $hasMultiple = $r->hasFile('files');
        if (!$hasSingle && !$hasMultiple) {
            return response()->json(['success'=>false,'message'=>'No file uploaded'], 422);
        }

        $ebookMimes   = 'pdf,txt,doc,docx';
        $podcastMimes = 'mp3,m4a,wav,mp4';
        $mimes = $product->type === 'podcast' ? $podcastMimes : $ebookMimes;

        $rules = [
            'file'        => 'nullable|file|mimes:'.$mimes.'|max:51200', // 50MB
            'files'       => 'nullable|array',
            'files.*'     => 'file|mimes:'.$mimes.'|max:51200',
            'is_preview'  => 'nullable|boolean',
            'previews'    => 'nullable|array',
            'previews.*'  => 'boolean',
        ];
        $v = Validator::make($r->allFiles() + $r->all(), $rules);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }

        $now   = now();
        $added = [];

        $saveOne = function($file, $isPreview) use ($id, $now, &$added) {
            $ext     = strtolower($file->getClientOriginalExtension() ?: $file->extension());
            $isAudio = in_array($ext, ['mp3','m4a','wav']);
            $isVideo = in_array($ext, ['mp4']);
            $isDoc   = in_array($ext, ['pdf','txt','doc','docx']);
            $fileType= $isAudio ? 'audio' : ($isVideo ? 'video' : ($isDoc ? $ext : 'file'));

            $stored  = $file->store("products/{$id}", 'public');
            $url     = Storage::url($stored);
            $size    = $file->getSize();

            DB::table('product_files')->insert([
                'product_id'     => $id,
                'file_type'      => $fileType,
                'file_url'       => $url,
                'filesize_bytes' => $size,
                'is_preview'     => $isPreview ? 1 : 0,
                'meta'           => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ]);

            $added[] = [
                'file_type'      => $fileType,
                'file_url'       => $url,
                'filesize_bytes' => $size,
                'is_preview'     => (bool)$isPreview,
            ];
        };

        if ($hasSingle) {
            $saveOne($r->file('file'), (bool)$r->boolean('is_preview', false));
        }
        if ($hasMultiple) {
            $files     = array_values((array)$r->file('files'));
            $previews  = $r->input('previews');
            $isPrevAll = (bool)$r->boolean('is_preview', false);

            foreach ($files as $i => $f) {
                $isPreview = is_array($previews) ? (bool)($previews[$i] ?? false) : $isPrevAll;
                $saveOne($f, $isPreview);
            }
        }

        return response()->json(['success'=>true,'message'=>'Files uploaded','data'=>['files'=>$added]]);
    }

    /**
     * POST /api/v1/catalog/products/{id}/thumbnail
     * Upload ảnh cover duy nhất cho sản phẩm -> luôn lưu về /storage/products/{id}/cover.ext
     */
    public function uploadThumbnail(Request $r, $id)
    {
        $product = DB::table('products')->where('id',$id)->first();
        if (!$product) return response()->json(['success'=>false,'message'=>'Product not found'],404);

        $v = Validator::make($r->allFiles(), [
            'image' => 'required|image|mimes:jpg,jpeg,png,webp,avif,heic,heif,tif,tiff|max:10240'
        ]);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }

        // Lưu với tên cover.ext để ổn định
        $ext     = strtolower($r->file('image')->getClientOriginalExtension() ?: $r->file('image')->extension());
        $ext     = $ext === 'jpeg' ? 'jpg' : $ext;
        $dstPath = "products/{$id}/cover.{$ext}";

        Storage::disk('public')->put($dstPath, file_get_contents($r->file('image')->getRealPath()));
        $url = Storage::url($dstPath);

        DB::table('products')->where('id',$id)->update([
            'thumbnail_url' => $url,
            'updated_at'    => now(),
        ]);

        return response()->json(['success'=>true,'message'=>'Thumbnail uploaded','data'=>['thumbnail_url'=>$url]]);
    }

    /**
     * DELETE /api/v1/catalog/products/{product}/files/{file}
     */
    public function destroyFile($productId, $fileId)
    {
        $file = DB::table('product_files')->where('id',$fileId)->where('product_id',$productId)->first();
        if (!$file) return response()->json(['success'=>false,'message'=>'File not found'],404);

        $urlPath = parse_url((string)$file->file_url, PHP_URL_PATH) ?: (string)$file->file_url;
        if (Str::startsWith($urlPath, '/storage/')) {
            $rel = Str::replaceFirst('/storage/', '', $urlPath);
            Storage::disk('public')->delete($rel);
        }

        DB::table('product_files')->where('id',$fileId)->delete();
        return response()->json(['success'=>true,'message'=>'File deleted']);
    }

    /**
     * DELETE /api/v1/catalog/products/{id}
     * Không cho xoá nếu sản phẩm đã từng có người đặt (order_items tồn tại)
     */
    public function destroy($id)
    {
        $hasOrders = DB::table('order_items')->where('product_id', $id)->exists();
        if ($hasOrders) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: product has existing orders'
            ], 422);
        }

        return DB::transaction(function () use ($id) {
            $files = DB::table('product_files')->where('product_id',$id)->get();
            foreach ($files as $f) {
                $urlPath = parse_url((string)$f->file_url, PHP_URL_PATH) ?: (string)$f->file_url;
                if (Str::startsWith($urlPath, '/storage/')) {
                    $rel = Str::replaceFirst('/storage/', '', $urlPath);
                    Storage::disk('public')->delete($rel);
                }
            }
            DB::table('product_files')->where('product_id',$id)->delete();

            $deleted = DB::table('products')->where('id', $id)->delete();
            if (!$deleted) {
                return response()->json(['success'=>false,'message'=>'Product not found'],404);
            }
            return response()->json(['success'=>true,'message'=>'Product deleted']);
        });
    }

    /**
     * GET /api/v1/catalog/products/{product}/files/{file}/download
     */
    public function downloadFile($productId, $fileId)
    {
        $file = DB::table('product_files')
            ->where('id', $fileId)
            ->where('product_id', $productId)
            ->first();

        if (!$file) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        $isPreview = (bool) ($file->is_preview ?? 0);
        if (!$isPreview) {
            $user = auth()->user();
            if (!$user) {
                $token = request()->bearerToken();
                if ($token) {
                    $pat = PersonalAccessToken::findToken($token);
                    if ($pat) $user = $pat->tokenable;
                }
            }
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
            }
            $isFree = (int) DB::table('products')->where('id', $productId)->value('price_cents') === 0;

            $canView = $isFree ?: DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.user_id', $user->id)
                ->where('orders.status', 'paid')
                ->where('order_items.product_id', $productId)
                ->exists();

            if (!$canView) {
                return response()->json(['success' => false, 'message' => 'Please purchase this product to access full content'], 403);
            }
        }

        $urlPath = parse_url((string)$file->file_url, PHP_URL_PATH) ?: (string)$file->file_url;

        if (Str::startsWith($urlPath, '/storage/')) {
            $rel = Str::replaceFirst('/storage/', '', $urlPath);
            $absolute = storage_path('app/public/' . $rel);

            if (is_file($absolute)) {
                return response()->download($absolute, basename($rel));
            }

            if (Storage::disk('public')->exists($rel)) {
                return response()->streamDownload(function () use ($rel) {
                    echo Storage::disk('public')->get($rel);
                }, basename($rel));
            }

            return response()->json(['success' => false, 'message' => 'File missing on server'], 404);
        }

        if (Str::startsWith($urlPath, '/books/')) {
            $rel = ltrim($urlPath, '/');
            $absolute = public_path($rel);
            if (!is_file($absolute)) {
                return response()->json(['success' => false, 'message' => 'File missing on server'], 404);
            }
            $ext = strtolower(pathinfo($absolute, PATHINFO_EXTENSION));
            $name = basename($absolute);
            $mime = @mime_content_type($absolute) ?: 'application/octet-stream';
            return response()->file($absolute, [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="'.$name.'"',
            ]);
        }

        if (preg_match('#^https?://#i', (string)$file->file_url)) {
            try {
                $resp = Http::withHeaders([])->get((string)$file->file_url);
                if (!$resp->successful()) {
                    return response()->json(['success'=>false,'message'=>'Remote file not accessible'], 404);
                }
                $ct = $resp->header('Content-Type', 'application/octet-stream');
                $name = basename(parse_url((string)$file->file_url, PHP_URL_PATH) ?: 'file');
                return response($resp->body(), 200)
                    ->header('Content-Type', $ct)
                    ->header('Content-Disposition', 'inline; filename="'.$name.'"');
            } catch (\Throwable $e) {
                return response()->json(['success'=>false,'message'=>'Failed to fetch remote file'], 500);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Unsupported file URL. Please upload the file to the server via Admin.'
        ], 400);
    }

    /**
     * POST /api/v1/catalog/products/{id}/attach-youtube
     * Chỉ cho podcast. Không set bìa cho ebook.
     */
    public function attachYoutube(Request $r, int $id)
    {
        $product = DB::table('products')->where('id', $id)->first();
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }
        if ($product->type !== 'podcast') {
            return response()->json(['success'=>false,'message'=>'YouTube can only be attached to podcast products'], 422);
        }

        $v = Validator::make($r->all(), [
            'url' => ['required','string','max:1000'],
        ]);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }

        $url = trim((string)$r->input('url'));
        if (!preg_match('~(?:youtu\.be/|v=|embed/|shorts/)([A-Za-z0-9_-]{11})~', $url, $m)) {
            return response()->json(['success'=>false,'message'=>'Invalid YouTube URL'], 422);
        }
        $vid   = $m[1];
        $watch = "https://www.youtube.com/watch?v={$vid}";
        $embed = "https://www.youtube.com/embed/{$vid}";
        $thumb = "https://img.youtube.com/vi/{$vid}/hqdefault.jpg";

        $title = null;
        try {
            $o = Http::get('https://www.youtube.com/oembed', [
                'url'    => $watch,
                'format' => 'json',
            ]);
            if ($o->ok()) $title = $o->json('title');
        } catch (\Throwable $e) { /* ignore */ }

        $now = now();
        DB::table('product_files')->insert([
            'product_id'     => $id,
            'file_type'      => 'youtube',
            'file_url'       => $watch,
            'filesize_bytes' => null,
            'is_preview'     => 0,
            'meta'           => json_encode([
                'provider'       => 'youtube',
                'video_id'       => $vid,
                'embed_url'      => $embed,
                'thumbnail_url'  => $thumb,
                'title'          => $title,
            ]),
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        // Nếu podcast CHƯA có cover -> cho phép dùng thumb YouTube làm bìa tạm
        if (empty($product->thumbnail_url)) {
            DB::table('products')->where('id', $id)->update([
                'thumbnail_url' => $thumb,
                'updated_at'    => now(),
            ]);
        }

        return response()->json(['success'=>true,'message'=>'YouTube attached']);
    }

    /* ========================= Helpers ========================= */

    /** metadata có thể là array/object/string; lưu JSON nếu là array/object */
    private function normalizeMetadata($metadata): ?string
    {
        if (is_array($metadata) || is_object($metadata)) {
            return json_encode($metadata);
        }
        if (is_null($metadata) || $metadata === '') {
            return null;
        }
        // giữ string đơn giản (client có thể lưu text), hoặc ép JSON hợp lệ nếu cần
        return (string)$metadata;
    }

    /** Trả về true nếu URL là thumbnail YouTube */
    private function isYoutubeThumb(string $url): bool
    {
        return stripos($url, 'img.youtube.com') !== false;
    }

    /**
     * Chuẩn hoá ảnh bìa về /storage/products/{id}/cover.ext
     * - Chấp nhận: URL http(s) hoặc đường dẫn tương đối dưới public/
     * - Ebook: cấm YouTube thumb
     */
    private function normalizeCoverAndSave(?string $urlOrPath, int $productId, string $productType): ?string
    {
        $src = trim((string)$urlOrPath);
        if ($src === '') return null;

        // Ebook không được dùng YouTube thumb
        if ($productType === 'ebook' && $this->isYoutubeThumb($src)) {
            return null;
        }

        // Lấy binary
        $bin = null;
        try {
            if (preg_match('#^https?://#i', $src)) {
                $bin = @file_get_contents($src);
            } else {
                // Cho phép đường dẫn kiểu /books/thumbnail/a.jpg hoặc books/thumbnail/a.jpg
                $path = public_path(ltrim($src, '/'));
                if (is_file($path)) $bin = @file_get_contents($path);
            }
        } catch (\Throwable $e) {
            $bin = null;
        }
        if (!$bin) return null;

        // Đoán phần mở rộng
        $ext = 'jpg';
        if (preg_match('/\.(avif|webp|png|jpe?g)$/i', $src, $m)) {
            $ext = strtolower($m[1] === 'jpeg' ? 'jpg' : $m[1]);
        }

        $dst = "products/{$productId}/cover.{$ext}";
        Storage::disk('public')->put($dst, $bin);

        return Storage::url($dst); // /storage/products/{id}/cover.ext
    }

    /** JSON encode nếu là array/object; nếu là string hợp lệ JSON rồi thì trả về nguyên string */
    private function jsonOrNull($meta): ?string
    {
        if (is_null($meta) || $meta === '') return null;
        if (is_array($meta) || is_object($meta)) return json_encode($meta);
        $s = (string)$meta;
        return $s;
    }
}
