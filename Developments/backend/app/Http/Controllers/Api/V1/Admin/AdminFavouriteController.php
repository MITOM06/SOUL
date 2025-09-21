<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Favourite;

/**
 * Endpoints Admin để quản trị favourites.
 * - GET    /api/v1/admin/favourites          (filter: user_id, product_id, per_page)
 * - DELETE /api/v1/admin/favourites          (xóa theo id hoặc bulk theo user_id/product_id)
 */
class AdminFavouriteController extends Controller
{
    /**
     * Danh sách favourites cho admin (có filter & paginate).
     */
    public function index(Request $request)
    {
        $q = Favourite::query()
            ->with([
                'user:id,name,email',
                'product:id,title,type,slug,thumbnail_url',
            ]);

        if ($request->filled('user_id')) {
            $q->where('user_id', (int) $request->input('user_id'));
        }
        if ($request->filled('product_id')) {
            $q->where('product_id', (int) $request->input('product_id'));
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 15)));
        $rows    = $q->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'data' => $rows->items(),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'per_page'     => $rows->perPage(),
                'total'        => $rows->total(),
                'last_page'    => $rows->lastPage(),
            ],
        ]);
    }

    /**
     * Xóa theo id hoặc bulk theo user_id/product_id.
     */
    public function destroy(Request $request)
    {
        if ($request->filled('id')) {
            $deleted = Favourite::where('id', (int) $request->input('id'))->delete();
            return response()->json(['deleted' => $deleted > 0]);
        }

        $q = Favourite::query();
        $filters = 0;

        if ($request->filled('user_id')) {
            $q->where('user_id', (int) $request->input('user_id'));
            $filters++;
        }
        if ($request->filled('product_id')) {
            $q->where('product_id', (int) $request->input('product_id'));
            $filters++;
        }

        if ($filters === 0) {
            return response()->json(['message' => 'Provide id or user_id/product_id to delete'], 422);
        }

        $deleted = $q->delete();
        return response()->json(['deleted' => (int) $deleted]);
    }
}
