<?php

namespace App\Http\Controllers\Api\V1\Library;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Favourite;
use App\Models\Product;
use App\Http\Requests\Library\FavouriteStoreRequest;

/**
 * Endpoints cho người dùng thao tác Favourite.
 * - GET    /api/v1/favourites
 * - POST   /api/v1/favourites           { product_id }
 * - POST   /api/v1/favourites/toggle    { product_id }
 * - DELETE /api/v1/favourites/{product}
 */
class FavouriteController extends Controller
{
    /**
     * GET /api/v1/favourites
     * Trả về danh sách favourite của user hiện tại, nhóm theo type (ebook/podcast)
     * + danh sách phẳng product_ids để client check nhanh.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $favs = Favourite::with(['product'])
            ->where('user_id', $user->id)
            ->get();

        $books = [];
        $podcasts = [];
        $productIds = [];

        foreach ($favs as $fav) {
            if (!$fav->product || !$fav->product->is_active) {
                continue;
            }

            $p = $fav->product;
            $productIds[] = (int) $p->id;

            $entry = [
                'id'            => (int) $p->id,
                'title'         => $p->title,
                'type'          => $p->type,
                'slug'          => $p->slug,
                'thumbnail_url' => $p->thumbnail_url ?? null,
                'price_cents'   => (int) ($p->price_cents ?? 0),
                'metadata'      => $p->metadata,
                'favourited_at' => optional($fav->created_at)->toISOString(),
            ];

            if ($p->type === 'ebook') {
                $books[] = $entry;
            } elseif ($p->type === 'podcast') {
                $podcasts[] = $entry;
            }
        }

        return response()->json([
            'data' => [
                'books'       => $books,
                'podcasts'    => $podcasts,
                'product_ids' => array_values(array_unique($productIds)),
            ],
        ]);
    }

    /**
     * POST /api/v1/favourites { product_id }
     * Thêm favourite (idempotent).
     */
    public function store(FavouriteStoreRequest $request)
    {
        $user      = $request->user();
        $productId = (int) $request->input('product_id');

        // Chỉ cho phép favourite sản phẩm còn active
        $product = Product::active()->findOrFail($productId);

        $fav = Favourite::firstOrCreate([
            'user_id'    => $user->id,
            'product_id' => $product->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Added to favourites',
            'data'    => [
                'product_id'    => (int) $product->id,
                'favourited_at' => optional($fav->created_at)->toISOString(),
            ],
        ], 201);
    }

    /**
     * POST /api/v1/favourites/toggle { product_id }
     * Bật/tắt favourite. Trả về on=true/false.
     */
    public function toggle(FavouriteStoreRequest $request)
    {
        $user      = $request->user();
        $productId = (int) $request->input('product_id');

        $existing = Favourite::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            $existing->delete();

            return response()->json([
                'success' => true,
                'on'      => false,
                'message' => 'Removed from favourites',
            ]);
        }

        // Nếu chưa có thì thêm (xác thực product active)
        $product = Product::active()->findOrFail($productId);

        Favourite::create([
            'user_id'    => $user->id,
            'product_id' => $product->id,
        ]);

        return response()->json([
            'success' => true,
            'on'      => true,
            'message' => 'Added to favourites',
        ], 201);
    }

    /**
     * DELETE /api/v1/favourites/{product}
     * Xóa favourite (idempotent).
     */
    public function destroy(Request $request, Product $product)
    {
        $user = $request->user();

        Favourite::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Removed from favourites',
        ]);
    }
}
