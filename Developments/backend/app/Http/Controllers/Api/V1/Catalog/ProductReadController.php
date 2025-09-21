<?php
namespace App\Http\Controllers\Api\V1\Catalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProductReadController extends Controller
{
    /**
     * GET /api/v1/catalog/products
     * Query: type=ebook|podcast, search, category, page, per_page, min_price, max_price (in cents)
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

        // Price filter (cents)
        $min = $r->query('min_price');
        $max = $r->query('max_price');
        if ($min !== null && $max !== null) {
            $min = (int) $min; $max = (int) $max;
            if ($max < $min) {
                return response()->json([
                    'success' => false,
                    'message' => 'max_price must be greater than or equal to min_price',
                ], 422);
            }
        }
        if ($min !== null) { $q->where('price_cents', '>=', (int) $min); }
        if ($max !== null) { $q->where('price_cents', '<=', (int) $max); }

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

        // Ensure thumbnail_url is present; if missing or file not found, attach a random demo cover
        $coversBooks    = collect(Storage::disk('public')->files('books/thumbnail'))
            ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p));
        $coversPodcasts = collect(Storage::disk('public')->files('podcasts/thumbnail'))
            ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p));

        $items->transform(function ($it) use ($coversBooks, $coversPodcasts) {
            $thumb = (string) ($it->thumbnail_url ?? '');
            $needsFallback = empty($thumb);
            if (!$needsFallback && str_starts_with($thumb, '/storage/')) {
                $rel = ltrim(substr($thumb, strlen('/storage/')), '/');
                $needsFallback = !Storage::disk('public')->exists($rel);
            }
            if ($needsFallback) {
                if ($it->type === 'podcast' && $coversPodcasts->count()) {
                    $it->thumbnail_url = Storage::url($coversPodcasts->random());
                } elseif ($coversBooks->count()) {
                    $it->thumbnail_url = Storage::url($coversBooks->random());
                }
            }
            return $it;
        });

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

        // Fallback thumbnail for detail view
        if (empty($product->thumbnail_url)) {
            $coversBooks    = collect(Storage::disk('public')->files('books/thumbnail'))
                ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p));
            $coversPodcasts = collect(Storage::disk('public')->files('podcasts/thumbnail'))
                ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p));
            if ($product->type === 'podcast' && $coversPodcasts->count()) {
                $product->thumbnail_url = Storage::url($coversPodcasts->random());
            } elseif ($coversBooks->count()) {
                $product->thumbnail_url = Storage::url($coversBooks->random());
            }
        } else {
            if (str_starts_with($product->thumbnail_url, '/storage/')) {
                $rel = ltrim(substr($product->thumbnail_url, strlen('/storage/')), '/');
                if (!Storage::disk('public')->exists($rel)) {
                    $coversBooks    = collect(Storage::disk('public')->files('books/thumbnail'))
                        ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p));
                    $coversPodcasts = collect(Storage::disk('public')->files('podcasts/thumbnail'))
                        ->filter(fn($p) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $p));
                    if ($product->type === 'podcast' && $coversPodcasts->count()) {
                        $product->thumbnail_url = Storage::url($coversPodcasts->random());
                    } elseif ($coversBooks->count()) {
                        $product->thumbnail_url = Storage::url($coversBooks->random());
                    }
                }
            }
        }

        // Compute access for current user (if authenticated via Sanctum token)
        $user = Auth::user();
        $canView = false;
        if ($user) {
            $canView = DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.user_id', $user->id)
                ->where('orders.status', 'paid')
                ->where('order_items.product_id', $id)
                ->exists();
        }
        $hasPreview = DB::table('product_files')->where('product_id', $id)->where('is_preview', 1)->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'files'   => $files,
                'access'  => [
                    'can_view'    => (bool) $canView,
                    'has_preview' => (bool) $hasPreview,
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/catalog/podcast/categories
     * Optional: ?limit=… (defaults 100)
     */
    public function categories(Request $r)
    {
        $limit = (int) ($r->query('limit', 100));
        $base  = DB::table('products')
            ->where('is_active', 1)
            ->where('type', 'podcast')
            ->whereNotNull('category');

        $cats = $base
            ->select('category', DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->limit($limit)
            ->get();

        $result = $cats->map(function($row) {
            $thumb = DB::table('products')
                ->where('is_active', 1)
                ->where('type', 'podcast')
                ->where('category', $row->category)
                ->orderByDesc('id')
                ->value('thumbnail_url');
            return [
                'category'      => $row->category,
                'count'         => (int) $row->count,
                'thumbnail_url' => $thumb,
            ];
        });

        return response()->json(['success' => true, 'data' => $result]);
    }
}
