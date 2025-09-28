<?php
namespace App\Http\Controllers\Api\V1\Library;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ContinueLiteController extends Controller
{
    /** Lấy user id: ưu tiên Sanctum, fallback X-User-Id (cho dev demo) */
    private function currentUserId(Request $r): int
    {
        if (auth()->check()) return (int) auth()->id();
        $h = (int) $r->header('X-User-Id', 0);
        return $h > 0 ? $h : 1; // fallback demo = 1
    }

    /** (Tuỳ chọn) GET /api/v1/continues -> list các product đang dở */
    public function index(Request $r)
    {
        $userId = $this->currentUserId($r);
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

        // validate tối thiểu
        $data = $r->validate([
            'current_page'         => ['nullable','integer','min:0'],
            'current_chapter'      => ['nullable','integer','min:0'],
            'current_time_seconds' => ['nullable','integer','min:0'],
            'is_active'            => ['nullable','boolean'],
        ]);

        $payload = [
            'current_chapter'      => $data['current_chapter']      ?? null,
            'current_page'         => $data['current_page']         ?? null,
            'current_time_seconds' => $data['current_time_seconds'] ?? null,
            'is_active'            => array_key_exists('is_active', $data) ? (bool)$data['is_active'] : true,
            'updated_at'           => now(),
        ];

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
}
