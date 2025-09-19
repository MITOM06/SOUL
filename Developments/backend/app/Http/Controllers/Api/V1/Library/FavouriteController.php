<?php

namespace App\Http\Controllers\Api\V1\Library;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Favourite;
use App\Models\Product;
use App\Http\Requests\Library\FavouriteStoreRequest;

class FavouriteController extends Controller
{
    /**
     * List current user's favourites, grouped by type for convenience.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $products = $user->favouriteProducts()->get();

        $books = [];
        $podcasts = [];
        foreach ($products as $p) {
            $type = strtolower((string) ($p->type ?? ''));
            if (in_array($type, ['ebook','book'], true)) {
                $books[] = $p;
            } elseif ($type === 'podcast' || strtolower((string) ($p->metadata['kind'] ?? '')) === 'podcast') {
                $podcasts[] = $p;
            } else {
                // default bucket: books
                $books[] = $p;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'books' => $books,
                'podcasts' => $podcasts,
            ],
        ]);
    }

    /**
     * Add a favourite for the current user.
     */
    public function store(FavouriteStoreRequest $request)
    {
        $user = $request->user();
        $productId = (int) $request->validated('product_id');

        $fav = Favourite::firstOrCreate([
            'user_id'    => $user->id,
            'product_id' => $productId,
        ]);

        $product = Product::find($productId);

        return response()->json([
            'success' => true,
            'data' => [
                'favourite' => $fav,
                'product'   => $product,
            ],
            'message' => 'Added to favourites',
        ], 201);
    }

    /**
     * Remove a favourite by product id.
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