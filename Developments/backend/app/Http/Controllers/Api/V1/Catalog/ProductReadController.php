<?php
namespace App\Http\Controllers\Api\V1\Catalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ProductReadController extends Controller
{
    /**
     * GET /api/v1/catalog/products
     * Query: type=ebook|podcast, search, category, page, per_page
     */
    public function index(Request $r)
    {
        // KHÔNG còn whereNull('deleted_at'), chỉ hiển thị sản phẩm đang active
        $q = DB::table('products')->where('is_active', 1);

        if ($r->filled('type')) {
            $q->where('type', $r->query('type'));
        }
        if ($r->filled('search')) {
            $s = '%' . $r->query('search') . '%';
            $q->where(function($x) use ($s) {
                $x->where('title','like',$s)
                  ->orWhere('description','like',$s)
                  ->orWhere('category','like',$s);
            });
        }
        if ($r->filled('category')) {
            $q->where('category', $r->query('category'));
        }

        $per  = (int) ($r->query('per_page', 12));
        $page = (int) ($r->query('page', 1));
        $total = $q->count();

        $items = $q->orderByDesc('id')
            ->forPage($page, $per)
            ->get([
                'id','type','title','description','price_cents',
                'thumbnail_url','category','slug','is_active',
                'created_at','updated_at',
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'pagination' => [
                    'page'        => $page,
                    'per_page'    => $per,
                    'total'       => $total,
                    'total_pages' => (int) ceil($total / max($per, 1)),
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/catalog/products/{id}
     */
    public function show($id)
    {
        // KHÔNG còn whereNull('deleted_at')
        $product = DB::table('products')->where('id', $id)->first();
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        $files = DB::table('product_files')
            ->where('product_id', $id)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'files'   => $files,
            ],
        ]);
    }
}
