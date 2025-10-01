<?php
namespace App\Http\Controllers\Api\V1\Library;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Laravel\Sanctum\PersonalAccessToken;

class ContinueLiteController extends Controller
{
    /** Resolve current user id from Sanctum Bearer token or X-User-Id. No demo fallback. */
    private function currentUserId(Request $r): ?int
    {
        if (auth()->check()) return (int) auth()->id();
        // Try Bearer token (when route is public but FE sends token)
        $token = $r->bearerToken();
        if ($token) {
            $pat = PersonalAccessToken::findToken($token);
            if ($pat && $pat->tokenable) return (int) $pat->tokenable->id;
        }
        // Optional header for trusted internal calls
        $h = (int) $r->header('X-User-Id', 0);
        return $h > 0 ? $h : null;
    }

    /** (Tuỳ chọn) GET /api/v1/continues -> list các product đang dở */
    public function index(Request $r)
    {
        $userId = $this->currentUserId($r);
        if (!$userId) return response()->json(['message' => 'Unauthenticated'], 401);
        $rows = DB::table('continues')
            ->where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->limit(200)
            ->get();

        return response()->json(['data' => $rows], 200);
    }

    /** GET /api/v1/continues/{productId} -> lấy tiến độ của 1 product */
    public function show(Request $r, int $product)
    {
        $userId = $this->currentUserId($r);
        if (!$userId) return response()->json(['message' => 'Unauthenticated'], 401);
        $row = DB::table('continues')
            ->where('user_id', $userId)
            ->where('product_id', $product)
            ->first();

        return response()->json(['data' => $row], 200);
    }

    /** POST /api/v1/continues/{productId} -> upsert tiến độ */
    public function store(Request $r, int $product)
    {
        $userId = $this->currentUserId($r);
        if (!$userId) return response()->json(['message' => 'Unauthenticated'], 401);

        // validate tối thiểu
        $data = $r->validate([
            'current_page'         => ['nullable','integer','min:0'],
            'current_chapter'      => ['nullable','integer','min:0'],
            'current_time_seconds' => ['nullable','integer','min:0'],
            'is_active'            => ['nullable','boolean'],
        ]);

        // Only set fields that are present to avoid unintentionally nulling others
        $payload = [ 'updated_at' => now() ];
        if ($r->has('current_chapter'))      $payload['current_chapter']      = $data['current_chapter'] ?? null;
        if ($r->has('current_page'))         $payload['current_page']         = $data['current_page'] ?? null;
        if ($r->has('current_time_seconds')) $payload['current_time_seconds'] = $data['current_time_seconds'] ?? null;
        if ($r->has('is_active'))            $payload['is_active']            = (bool)($data['is_active'] ?? true);
        if (count($payload) <= 1) { // only updated_at
            return response()->json(['message' => 'No progress fields provided'], 422);
        }

        // upsert theo (user_id, product_id)
        $exists = DB::table('continues')
            ->where('user_id', $userId)
            ->where('product_id', $product)
            ->first();

        if ($exists) {
            DB::table('continues')->where('id', $exists->id)->update($payload);
        } else {
            $payload['user_id']    = $userId;
            $payload['product_id'] = $product;
            $payload['created_at'] = now();
            DB::table('continues')->insert($payload);
        }

        // Trả lại bản ghi mới nhất
        $row = DB::table('continues')
            ->where('user_id', $userId)
            ->where('product_id', $product)
            ->first();

        return response()->json(['data' => $row, 'message' => 'Progress saved'], 200);
    }

    /** DELETE /api/v1/continues/{productId} -> xoá tiến độ của 1 product */
    public function destroy(Request $r, int $product)
    {
        $userId = $this->currentUserId($r);
        if (!$userId) return response()->json(['message' => 'Unauthenticated'], 401);
        $deleted = DB::table('continues')
            ->where('user_id', $userId)
            ->where('product_id', $product)
            ->delete();

        return response()->json([
            'success' => true,
            'deleted' => $deleted > 0,
            'message' => $deleted > 0 ? 'Progress removed' : 'No progress to remove',
        ], 200);
    }
}
