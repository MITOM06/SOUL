<?php
namespace App\Http\Controllers\Api\V1\Catalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class ProductWriteController extends Controller
{
    /**
     * POST /api/v1/catalog/products
     * Accepts JSON body with product fields and optional files array
     */
    public function store(Request $r)
    {
        $data = $r->all();
        $v = Validator()->make($data, [
            'type' => 'required|in:ebook,podcast',
            'title' => 'required|string|max:300',
            'description' => 'nullable|string',
            'price_cents' => 'required|integer|min:0',
            'thumbnail_url' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:50',
            'slug' => 'nullable|string|max:150',
            'metadata' => 'nullable',
            'is_active' => 'nullable|boolean',
            'files' => 'nullable|array',
            'files.*.file_type' => 'required_with:files|string|max:50',
            'files.*.file_url' => 'required_with:files|string|max:255',
            'files.*.filesize_bytes' => 'nullable|integer|min:0',
            'files.*.is_preview' => 'nullable|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
        }
        DB::beginTransaction();
        try {
            $now = now();
            $slug = $data['slug'] ?? Str::slug($data['title']) . '-' . substr(md5((string)$now),0,6);
            $id = DB::table('products')->insertGetId([
                'type' => $data['type'],
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'price_cents' => $data['price_cents'],
                'thumbnail_url' => $data['thumbnail_url'] ?? null,
                'category' => $data['category'] ?? null,
                'slug' => $slug,
                'metadata' => isset($data['metadata']) ? json_encode($data['metadata']) : null,
                'is_active' => (int) ($data['is_active'] ?? 1),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if (!empty($data['files']) && is_array($data['files'])) {
                foreach ($data['files'] as $f) {
                    DB::table('product_files')->insert([
                        'product_id' => $id,
                        'file_type' => $f['file_type'],
                        'file_url' => $f['file_url'],
                        'filesize_bytes' => $f['filesize_bytes'] ?? null,
                        'is_preview' => !empty($f['is_preview']) ? 1 : 0,
                        'meta' => isset($f['meta']) ? json_encode($f['meta']) : null,
                        'created_at' => $now,
                        'updated_at' => $now,
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
            'title' => 'sometimes|required|string|max:300',
            'description' => 'nullable|string',
            'price_cents' => 'sometimes|required|integer|min:0',
            'thumbnail_url' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:50',
            'slug' => 'nullable|string|max:150',
            'metadata' => 'nullable',
            'is_active' => 'nullable|boolean',
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
     * DELETE /api/v1/catalog/products/{id}
     */
    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            // 1) Xoá các orders có chứa product này
            $orderIds = DB::table('order_items')
                ->where('product_id', $id)
                ->distinct()
                ->pluck('order_id');

            if ($orderIds->count() > 0) {
                // Xoá orders -> order_items xoá theo (ON DELETE CASCADE)
                DB::table('orders')->whereIn('id', $orderIds)->delete();
            }

            // 2) (Tuỳ chọn) Xoá product_files nếu DB bạn CHƯA bật CASCADE cho product_files.product_id
            // DB::table('product_files')->where('product_id', $id)->delete();

            // 3) Xoá product
            $deleted = DB::table('products')->where('id', $id)->delete();
            if (!$deleted) {
                // Không tìm thấy product
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            return response()->json(['success' => true, 'message' => 'Product and related orders/items deleted']);
        });
    }
}
