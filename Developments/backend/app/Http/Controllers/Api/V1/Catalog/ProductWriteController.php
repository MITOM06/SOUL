<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;

class ProductWriteController extends Controller
{
    /**
     * POST /api/v1/catalog/products
     * Body JSON: { type,title,description,price_cents,thumbnail_url?,category?,slug?,metadata?,is_active?, files?[] }
     */
    public function store(Request $r)
    {
        $data = $r->all();
        $v = Validator()->make($data, [
            'type'           => 'required|in:ebook,podcast',
            'title'          => 'required|string|max:300',
            'description'    => 'nullable|string',
            'price_cents'    => 'required|integer|min:0',
            'thumbnail_url'  => 'nullable|string|max:255',
            'category'       => 'nullable|string|max:50',
            'slug'           => 'nullable|string|max:150',
            'metadata'       => 'nullable',
            'is_active'      => 'nullable|boolean',
            'files'                  => 'nullable|array',
            'files.*.file_type'      => 'required_with:files|string|max:50',
            'files.*.file_url'       => 'required_with:files|string|max:255',
            'files.*.filesize_bytes' => 'nullable|integer|min:0',
            'files.*.is_preview'     => 'nullable|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }

        DB::beginTransaction();
        try {
            $now  = now();
            $slug = $data['slug'] ?? Str::slug($data['title']).'-'.substr(md5((string)$now),0,6);

            $id = DB::table('products')->insertGetId([
                'type'          => $data['type'],
                'title'         => $data['title'],
                'description'   => $data['description'] ?? null,
                'price_cents'   => $data['price_cents'],
                'thumbnail_url' => $data['thumbnail_url'] ?? null,
                'category'      => $data['category'] ?? null,
                'slug'          => $slug,
                'metadata'      => isset($data['metadata']) ? json_encode($data['metadata']) : null,
                'is_active'     => (int) ($data['is_active'] ?? 1),
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);

            // Vẫn hỗ trợ thêm file dạng URL để không phá UI cũ
            if (!empty($data['files']) && is_array($data['files'])) {
                foreach ($data['files'] as $f) {
                    DB::table('product_files')->insert([
                        'product_id'     => $id,
                        'file_type'      => $f['file_type'],
                        'file_url'       => $f['file_url'],
                        'filesize_bytes' => $f['filesize_bytes'] ?? null,
                        'is_preview'     => !empty($f['is_preview']) ? 1 : 0,
                        'meta'           => isset($f['meta']) ? json_encode($f['meta']) : null,
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
     */
    public function update(Request $r, $id)
    {
        $data = $r->all();
        $v = Validator()->make($data, [
            'title'         => 'sometimes|required|string|max:300',
            'description'   => 'nullable|string',
            'price_cents'   => 'sometimes|required|integer|min:0',
            'thumbnail_url' => 'nullable|string|max:255',
            'category'      => 'nullable|string|max:50',
            'slug'          => 'nullable|string|max:150',
            'metadata'      => 'nullable',
            'is_active'     => 'nullable|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }

        $row = DB::table('products')->where('id',$id)->first();
        if (!$row) return response()->json(['success'=>false,'message'=>'Product not found'],404);

        $upd = [];
        foreach (['title','description','price_cents','thumbnail_url','category','slug'] as $k) {
            if (array_key_exists($k,$data)) $upd[$k] = $data[$k];
        }
        if (array_key_exists('metadata',$data)) $upd['metadata'] = json_encode($data['metadata']);
        if (array_key_exists('is_active',$data)) $upd['is_active'] = (int) $data['is_active'];
        $upd['updated_at'] = now();

        DB::table('products')->where('id',$id)->update($upd);
        return response()->json(['success'=>true,'message'=>'Product updated']);
    }

    /**
     * POST /api/v1/catalog/products/{id}/files
     * Nhận: pdf, txt, doc, docx, jpg, jpeg, png, webp, mp3
     *
     * Form-data:
     *   file: (single)   HOẶC  files[]: (multiple)
     *   is_preview=0|1   HOẶC  previews[]: 0|1 (song song với files[])
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

        $rules = [
            'file'        => 'nullable|file|mimes:pdf,txt,doc,docx,jpg,jpeg,png,webp,mp3|max:51200',
            'files'       => 'nullable|array',
            'files.*'     => 'file|mimes:pdf,txt,doc,docx,jpg,jpeg,png,webp,mp3|max:51200',
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

        // Helper lưu 1 file
        $saveOne = function($file, $isPreview) use ($id, $now, &$added) {
            $ext     = strtolower($file->getClientOriginalExtension() ?: $file->extension());
            $isImage = in_array($ext, ['jpg','jpeg','png','webp']);
            $isAudio = in_array($ext, ['mp3']);
            $isDoc   = in_array($ext, ['pdf','txt','doc','docx']);
            $fileType= $isImage ? 'image' : ($isAudio ? 'audio' : ($isDoc ? $ext : 'file'));

            // Lưu vật lý vào disk public: storage/app/public/products/{id}/...
            $stored  = $file->store("products/{$id}", 'public');       // ex: products/5/abc.pdf
            $url     = Storage::url($stored);                          // ex: /storage/products/5/abc.pdf
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

            // Nếu là ảnh và sản phẩm chưa có thumbnail → set làm cover
            if ($isImage) {
                $p = DB::table('products')->where('id',$id)->first();
                if ($p && empty($p->thumbnail_url)) {
                    DB::table('products')->where('id',$id)->update([
                        'thumbnail_url' => $url,
                        'updated_at'    => now(),
                    ]);
                }
            }

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
     * Upload ảnh cover duy nhất cho sản phẩm
     */
    public function uploadThumbnail(Request $r, $id)
    {
        $product = DB::table('products')->where('id',$id)->first();
        if (!$product) return response()->json(['success'=>false,'message'=>'Product not found'],404);

        $v = Validator::make($r->allFiles(), [
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120'
        ]);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }

        $stored = $r->file('image')->store("products/{$id}", 'public');
        $url    = Storage::url($stored); // /storage/products/{id}/...

        DB::table('products')->where('id',$id)->update([
            'thumbnail_url' => $url,
            'updated_at'    => now(),
        ]);

        return response()->json(['success'=>true,'message'=>'Thumbnail uploaded','data'=>['thumbnail_url'=>$url]]);
    }

    /**
     * DELETE /api/v1/catalog/products/{product}/files/{file}
     * Xoá file (DB + vật lý nếu nằm trong public storage)
     */
    public function destroyFile($productId, $fileId)
    {
        $file = DB::table('product_files')->where('id',$fileId)->where('product_id',$productId)->first();
        if (!$file) return response()->json(['success'=>false,'message'=>'File not found'],404);

        $urlPath = parse_url((string)$file->file_url, PHP_URL_PATH) ?: (string)$file->file_url;
        if (Str::startsWith($urlPath, '/storage/')) {
            $rel = Str::replaceFirst('/storage/', '', $urlPath); // products/5/xxx.pdf
            Storage::disk('public')->delete($rel);
        }

        DB::table('product_files')->where('id',$fileId)->delete();
        return response()->json(['success'=>true,'message'=>'File deleted']);
    }

    /**
     * DELETE /api/v1/catalog/products/{id}
     * Xoá product + toàn bộ orders/items liên quan
     */
    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            $orderIds = DB::table('order_items')->where('product_id', $id)->distinct()->pluck('order_id');
            if ($orderIds->count() > 0) {
                DB::table('orders')->whereIn('id', $orderIds)->delete(); // order_items cascade
            }

            // Xoá file vật lý nếu URL thuộc /storage
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
            return response()->json(['success'=>true,'message'=>'Product and related orders/items deleted']);
        });
    }

    /**
     * GET /api/v1/catalog/products/{product}/files/{file}/download
     * - /storage/... => tải trực tiếp
     * - http(s)      => redirect
     * - file:///     => từ chối (yêu cầu upload lên server)
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

        // Gate: allow previews, restrict full files to paid users
        $isPreview = (bool) ($file->is_preview ?? 0);
        if (!$isPreview) {
            $user = auth()->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
            }
            // Free product (price_cents = 0) is viewable for signed-in users
            $isFree = (int) DB::table('products')->where('id', $productId)->value('price_cents') === 0;

            $canView = false;
            if ($isFree) {
                $canView = true;
            } else {
                $canView = DB::table('order_items')
                    ->join('orders', 'orders.id', '=', 'order_items.order_id')
                    ->where('orders.user_id', $user->id)
                    ->where('orders.status', 'paid')
                    ->where('order_items.product_id', $productId)
                    ->exists();
            }

            if (!$canView) {
                return response()->json(['success' => false, 'message' => 'Please purchase this product to access full content'], 403);
            }
        }

        $urlPath = parse_url((string)$file->file_url, PHP_URL_PATH) ?: (string)$file->file_url;

        if (Str::startsWith($urlPath, '/storage/')) {
            $rel = Str::replaceFirst('/storage/', '', $urlPath); // products/5/a.pdf
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

        if (preg_match('#^https?://#i', (string)$file->file_url)) {
            // Proxy remote file to avoid CORS issues on redirects
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


public function attachYoutube(Request $r, int $id)
{
    // 1) Kiểm tra product
    $product = DB::table('products')->where('id', $id)->first();
    if (!$product) {
        return response()->json(['success' => false, 'message' => 'Product not found'], 404);
    }

    // 2) Validate URL
    $v = Validator::make($r->all(), [
        'url' => ['required','string','max:255'],
    ]);
    if ($v->fails()) {
        return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
    }

    $url = trim((string)$r->input('url'));

    // 3) Bắt id YouTube (hỗ trợ share/watch/embed/shorts)
    if (!preg_match('~(?:youtu\.be/|v=|embed/|shorts/)([A-Za-z0-9_-]{11})~', $url, $m)) {
        return response()->json(['success'=>false,'message'=>'Invalid YouTube URL'], 422);
    }
    $vid   = $m[1];
    $watch = "https://www.youtube.com/watch?v={$vid}";
    $embed = "https://www.youtube.com/embed/{$vid}";
    $thumb = "https://img.youtube.com/vi/{$vid}/hqdefault.jpg";

    // 4) (Tuỳ chọn) Lấy tiêu đề qua oEmbed — không bắt buộc phải thành công
    $title = null;
    try {
        $o = Http::get('https://www.youtube.com/oembed', [
            'url'    => $watch,
            'format' => 'json',
        ]);
        if ($o->ok()) {
            $title = $o->json('title');
        }
    } catch (\Throwable $e) {
        // ignore
    }

    // 5) Ghi bản ghi "file" kiểu youtube vào product_files
    $now = now();
    DB::table('product_files')->insert([
        'product_id'     => $id,
        'file_type'      => 'youtube',
        'file_url'       => $watch,                 // lưu link xem
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

    // 6) Nếu product chưa có thumbnail -> set theo youtube
    if (empty($product->thumbnail_url)) {
        DB::table('products')->where('id', $id)->update([
            'thumbnail_url' => $thumb,
            'updated_at'    => now(),
        ]);
    }

    return response()->json(['success'=>true,'message'=>'YouTube attached']);
}



}
