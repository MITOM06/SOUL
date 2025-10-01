<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\PersonalAccessToken;
use App\Services\PlanInclusions;
use Illuminate\Support\Facades\File;

class ProductReadController extends Controller
{
    /**
     * GET /api/v1/catalog/products
     * Query: type=ebook|podcast, search, category, page, per_page, min_price, max_price (in cents)
     *
     * Nguyên tắc an toàn ảnh:
     * - Chỉ fallback trong ĐÚNG loại (ebook -> books/, podcast -> podcasts/)
     * - Nếu không tìm được ảnh đúng loại, trả null (frontend dùng placeholder theo type)
     * - Kiểm tra tồn tại file theo nơi lưu: /storage/... trên Storage, /books|/podcasts/... ở public/
     */
    public function index(Request $r)
    {
        // Chỉ hiển thị sản phẩm đang active
        $q = DB::table('products')->where('is_active', 1);

        if ($r->filled('type')) {
            $q->where('type', $r->query('type'));
        }
        if ($r->filled('search')) {
            $s = '%' . $r->query('search') . '%';
            $q->where(function ($x) use ($s) {
                $x->where('title', 'like', $s)
                  ->orWhere('description', 'like', $s)
                  ->orWhere('category', 'like', $s);
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

        $per   = (int) ($r->query('per_page', 12));
        $page  = (int) ($r->query('page', 1));
        $total = $q->count();

        $items = $q->orderByDesc('id')
            ->forPage($page, $per)
            ->get([
                'id','type','title','description','price_cents',
                'thumbnail_url','category','slug','is_active',
                'created_at','updated_at',
            ]);

        // Chuẩn bị nguồn fallback đúng theo nơi bạn lưu (public/books/thumbnail & public/podcasts/thumbnail)
        $booksAbsPath    = public_path('books/thumbnail');
        $podcastsAbsPath = public_path('podcasts/thumbnail');

        $coversBooksAbs = is_dir($booksAbsPath)
            ? collect(File::files($booksAbsPath))
                ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                ->values()
            : collect();

        $coversPodcastsAbs = is_dir($podcastsAbsPath)
            ? collect(File::files($podcastsAbsPath))
                ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                ->values()
            : collect();

        // Transform: đảm bảo không lẫn ảnh bìa giữa 2 loại
        $items->transform(function ($it) use ($coversBooksAbs, $coversPodcastsAbs) {
            $thumb = (string) ($it->thumbnail_url ?? '');
            $needsFallback = empty($thumb);

            // Nếu là /storage/... kiểm tra tồn tại trên Storage::disk('public')
            if (!$needsFallback && str_starts_with($thumb, '/storage/')) {
                $rel = ltrim(substr($thumb, strlen('/storage/')), '/');
                $needsFallback = !Storage::disk('public')->exists($rel);
            }

            // Nếu là /books/... hoặc /podcasts/... kiểm tra trực tiếp ở public/
            if (
                !$needsFallback &&
                (str_starts_with($thumb, '/books/') || str_starts_with($thumb, '/podcasts/'))
            ) {
                $abs = public_path(ltrim($thumb, '/'));
                $needsFallback = !is_file($abs);
            }

            if ($needsFallback) {
                if ($it->type === 'ebook') {
                    // CHỈ fallback trong books; nếu không có -> để null (frontend dùng placeholder ebook)
                    if ($coversBooksAbs->count()) {
                        $name = $coversBooksAbs->random()->getFilename();
                        $it->thumbnail_url = '/books/thumbnail/' . $name; // file dưới public/
                    } else {
                        $it->thumbnail_url = null;
                    }
                } else { // podcast
                    if ($coversPodcastsAbs->count()) {
                        $name = $coversPodcastsAbs->random()->getFilename();
                        $it->thumbnail_url = '/podcasts/thumbnail/' . $name;
                    } else {
                        $it->thumbnail_url = null;
                    }
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
     *
     * Nguyên tắc an toàn ảnh giống index():
     * - Chỉ fallback theo đúng loại
     * - Không lấy ảnh loại còn lại khi thiếu
     * - Kiểm tra tồn tại file theo nơi lưu
     */
    public function show($id)
    {
        $product = DB::table('products')->where('id', $id)->first();
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        $files = DB::table('product_files')
            ->where('product_id', $id)
            ->orderByDesc('id')
            ->get();

        $booksAbsPath    = public_path('books/thumbnail');
        $podcastsAbsPath = public_path('podcasts/thumbnail');

        $needsFallback = empty($product->thumbnail_url);

        if (!$needsFallback && str_starts_with($product->thumbnail_url, '/storage/')) {
            $rel = ltrim(substr($product->thumbnail_url, strlen('/storage/')), '/');
            $needsFallback = !Storage::disk('public')->exists($rel);
        }

        if (
            !$needsFallback &&
            (str_starts_with($product->thumbnail_url, '/books/') || str_starts_with($product->thumbnail_url, '/podcasts/'))
        ) {
            $abs = public_path(ltrim($product->thumbnail_url, '/'));
            $needsFallback = !is_file($abs);
        }

        if ($needsFallback) {
            if ($product->type === 'ebook') {
                if (is_dir($booksAbsPath)) {
                    $c = collect(File::files($booksAbsPath))
                        ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                        ->values();
                    if ($c->count()) {
                        $product->thumbnail_url = '/books/thumbnail/' . $c->random()->getFilename();
                    } else {
                        $product->thumbnail_url = null; // frontend placeholder ebook
                    }
                } else {
                    $product->thumbnail_url = null;
                }
            } else { // podcast
                if (is_dir($podcastsAbsPath)) {
                    $c = collect(File::files($podcastsAbsPath))
                        ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|avif)$/i', $f->getFilename()))
                        ->values();
                    if ($c->count()) {
                        $product->thumbnail_url = '/podcasts/thumbnail/' . $c->random()->getFilename();
                    } else {
                        $product->thumbnail_url = null; // frontend placeholder podcast
                    }
                } else {
                    $product->thumbnail_url = null;
                }
            }
        }

        // Compute access cho user hiện tại (nếu có)
        $user = Auth::user();
        if (!$user) {
            // Fallback: nếu có Bearer token (Sanctum) mà route public
            $token = request()->bearerToken();
            if ($token) {
                $pat = PersonalAccessToken::findToken($token);
                if ($pat) {
                    $user = $pat->tokenable;
                }
            }
        }

        $canView = false;
        if ($user) {
            $canView = DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.user_id', $user->id)
                ->where('orders.status', 'paid')
                ->where('order_items.product_id', $id)
                ->exists();

            if (!$canView) {
                // Kiểm tra quyền qua gói subscription
                try {
                    $canView = PlanInclusions::userHasAccessViaPlan($user->id, (int) $id);
                } catch (\Throwable $e) { /* ignore */ }
            }
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
     *
     * (Giữ nguyên logic: chỉ đếm theo podcast; thumbnail lấy từ sản phẩm mới nhất trong category)
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

        $result = $cats->map(function ($row) {
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
