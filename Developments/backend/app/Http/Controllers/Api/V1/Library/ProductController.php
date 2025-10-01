<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Models\ProductFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * GET /api/products
     * Query: category, brand, q, page, per_page
     *
     * Nguyên tắc an toàn ảnh:
     * - Listing KHÔNG eager-load files (tránh FE nhặt bừa làm cover).
     * - FE nên hiển thị từ product.thumbnail_url; nếu null thì dùng placeholder theo type.
     */
    public function index(Request $r)
    {
        $q = Product::query()
            ->where('is_published', true);

        if ($r->filled('category')) $q->where('category_id', $r->category);
        if ($r->filled('brand'))    $q->where('brand', $r->brand);
        if ($r->filled('q'))        $q->where('title', 'like', '%'.$r->q.'%');

        $perPage = (int) $r->get('per_page', 12);

        // Chỉ trả trường cần cho card, KHÔNG load files ở đây
        $paginator = $q->orderByDesc('id')
            ->select([
                'id','title','slug','description','price_cents',
                'thumbnail_url','category_id','brand','is_published',
                'type', // nếu có cột này (ebook/podcast), giữ lại để FE biết placeholder
                'created_at','updated_at',
            ])
            ->paginate($perPage);

        return response()->json(['success' => true, 'data' => $paginator]);
    }

    /**
     * GET /api/products/{product}
     *
     * Detail có thể load files, nhưng KHÔNG dùng files làm cover.
     */
    public function show(Request $r, Product $product)
    {
        $user = $r->user();

        if (!$product->is_published) {
            if (!$user || !$user->hasRole('admin')) {
                return response()->json(['success'=>false,'message'=>'Not found'],404);
            }
        }

        if (($product->access_level ?? 'free') !== 'free') {
            if (!$user || !$user->canAccessProduct($product)) {
                return response()->json(['success'=>false,'message'=>'Access denied to this product'],403);
            }
        }

        // Chỉ load files cho trang chi tiết
        $product->load('category', 'files');

        // Không chỉnh sửa thumbnail ở đây; FE sẽ hiển thị thumbnail_url hoặc placeholder
        return response()->json(['success'=>true,'data'=>$product]);
    }

    /**
     * POST /api/products
     * - Nhận JSON chuẩn, KHÔNG dùng FormData trộn.
     * - Cover: gửi riêng qua endpoint uploadCover hoặc gửi thumbnail_url để server chuẩn hoá.
     */
    public function store(ProductRequest $request)
    {
        $data = $request->validated();

        // Nếu client gửi thumbnail_url (URL ngoài / public path), chuẩn hoá sau khi tạo id
        $thumbnailUrl = $data['thumbnail_url'] ?? null;
        unset($data['thumbnail_url']);

        $product = Product::create($data);

        if ($thumbnailUrl) {
            $normalized = $this->normalizeCoverAndSave($thumbnailUrl, $product->id, $product->type ?? null);
            if ($normalized) {
                $product->update(['thumbnail_url' => $normalized]);
            }
        }

        // Nếu vẫn muốn hỗ trợ upload nhiều "files" chung (không phải cover)
        if ($request->hasFile('files')) {
            foreach ((array)$request->file('files') as $file) {
                $path = $file->store("products/{$product->id}", 'public');
                $product->files()->create([
                    'filename' => $file->getClientOriginalName(),
                    'path'     => $path,
                    'type'     => $file->getClientMimeType(),
                    'size'     => $file->getSize()
                ]);
            }
        }

        return response()->json(['success'=>true,'data'=>$product->fresh()],201);
    }

    /**
     * PUT /api/products/{product}
     * - Nếu gửi thumbnail_url, luôn chuẩn hoá về /storage/products/{id}/cover.ext
     */
    public function update(ProductRequest $request, Product $product)
    {
        $data = $request->validated();

        $thumbnailUrl = $data['thumbnail_url'] ?? null;
        unset($data['thumbnail_url']);

        $product->update($data);

        if (!is_null($thumbnailUrl)) {
            // Nếu gửi rỗng -> xoá cover
            if (trim((string)$thumbnailUrl) === '') {
                $product->update(['thumbnail_url' => null]);
            } else {
                $normalized = $this->normalizeCoverAndSave($thumbnailUrl, $product->id, $product->type ?? null);
                if ($normalized) {
                    $product->update(['thumbnail_url' => $normalized]);
                }
            }
        }

        // Upload files bổ sung (không phải cover)
        if ($request->hasFile('files')) {
            foreach ((array)$request->file('files') as $file) {
                $path = $file->store("products/{$product->id}", 'public');
                $product->files()->create([
                    'filename' => $file->getClientOriginalName(),
                    'path'     => $path,
                    'type'     => $file->getClientMimeType(),
                    'size'     => $file->getSize()
                ]);
            }
        }

        return response()->json(['success'=>true,'data'=>$product->fresh()]);
    }

    /**
     * DELETE /api/products/{product}
     * - Không cho xoá nếu có order items
     * - Xoá luôn file vật lý
     */
    public function destroy(Product $product)
    {
        // Tránh phụ thuộc alias \DB, dùng Facade DB (đã import)
        $hasOrders = DB::table('order_items')->where('product_id', $product->id)->exists();
        if ($hasOrders) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: product has existing orders'
            ], 422);
        }

        // Eager-load để tránh N+1
        $product->load('files');

        foreach ($product->files as $f) {
            if ($f->path && Storage::disk('public')->exists($f->path)) {
                Storage::disk('public')->delete($f->path);
            }
            $f->delete();
        }

        // Xoá cover vật lý nếu nằm trong /storage (disk 'public')
        if ($product->thumbnail_url && Str::startsWith($product->thumbnail_url, '/storage/')) {
            // '/storage/' dài 9
            $rel = ltrim(substr($product->thumbnail_url, 9), '/');
            if (Storage::disk('public')->exists($rel)) {
                Storage::disk('public')->delete($rel);
            }
        }

        $product->delete();

        return response()->json(['success'=>true,'message'=>'Deleted']);
    }

    /**
     * GET /api/products/{product}/files/{file}/download
     */
    public function downloadFile(Product $product, ProductFile $file)
    {
        if ($file->product_id !== $product->id) {
            return response()->json(['success'=>false,'message'=>'Not found'],404);
        }
        $disk = Storage::disk('public');
        if (!$disk->exists($file->path)) {
            return response()->json(['success'=>false,'message'=>'File missing'],404);
        }
        return response()->download(storage_path('app/public/'.$file->path), $file->filename);
    }

    /**
     * POST /api/products/{product}/cover
     * Upload 1 ảnh bìa duy nhất -> luôn lưu /storage/products/{id}/cover.ext
     */
    public function uploadCover(Request $r, Product $product)
    {
        $v = Validator::make($r->allFiles(), [
            'image' => 'required|image|mimes:jpg,jpeg,png,webp,avif,heic,heif,tif,tiff|max:10240',
        ]);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }

        $ext = strtolower($r->file('image')->getClientOriginalExtension() ?: $r->file('image')->extension());
        $ext = $ext === 'jpeg' ? 'jpg' : $ext;
        $dst = "products/{$product->id}/cover.{$ext}";

        Storage::disk('public')->put($dst, file_get_contents($r->file('image')->getRealPath()));
        $url = Storage::url($dst);

        // (Tuỳ chọn) Không cho ebook dùng YouTube thumb (chỉ áp dụng khi attach URL; ở đây là file upload nên OK)
        $product->update(['thumbnail_url' => $url]);

        return response()->json(['success'=>true,'data'=>['thumbnail_url'=>$url]]);
    }

    /* ============================ Helpers ============================ */

    /**
     * Chuẩn hoá cover về /storage/products/{id}/cover.ext
     * - Nhận URL http(s) hoặc public path (/books/thumbnail/...)
     * - (Tuỳ chọn) Nếu có $type === 'ebook', chặn YouTube thumb
     */
    private function normalizeCoverAndSave(string $urlOrPath, int $productId, ?string $type = null): ?string
    {
        $src = trim($urlOrPath);
        if ($src === '') return null;

        // Ebook không dùng YouTube thumb
        if ($type === 'ebook' && stripos($src, 'img.youtube.com') !== false) {
            return null;
        }

        // Lấy binary
        $bin = null;
        try {
            if (preg_match('#^https?://#i', $src)) {
                $bin = @file_get_contents($src);
            } else {
                $abs = public_path(ltrim($src, '/'));
                if (is_file($abs)) $bin = @file_get_contents($abs);
            }
        } catch (\Throwable $e) {
            $bin = null;
        }
        if (!$bin) return null;

        // Đoán extension
        $ext = 'jpg';
        if (preg_match('/\.(avif|webp|png|jpe?g)$/i', $src, $m)) {
            $ext = strtolower($m[1] === 'jpeg' ? 'jpg' : $m[1]);
        }

        $dst = "products/{$productId}/cover.{$ext}";
        Storage::disk('public')->put($dst, $bin);

        return Storage::url($dst);
    }
}
