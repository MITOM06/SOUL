<?php

namespace App\Http\Controllers\Api\V1\Library;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContinueLiteController extends Controller
{
    /** Lấy user id: ưu tiên Sanctum, fallback X-User-Id (demo) */
    private function userId(Request $r): ?int
    {
        if ($u = auth()->id()) return (int)$u;
        $h = (int) $r->header('X-User-Id', 0);
        return $h > 0 ? $h : null;
    }

    /** GET /api/v1/continues/{product} — trả tiến độ hiện tại của user cho product */
    public function show(Request $r, int $product)
    {
        $uid = $this->userId($r);
        if (!$uid) {
            // Không đăng nhập: cứ trả null để FE hiển thị 0
            return response()->json(['success' => true, 'data' => null]);
        }

        $row = DB::table('continues')
            ->where('user_id', $uid)
            ->where('product_id', $product)
            ->first();

        return response()->json(['success' => true, 'data' => $row]);
    }

    /** POST /api/v1/continues/{product} — upsert tiến độ */
    public function store(Request $r, int $product)
    {
        $uid = $this->userId($r);
        if (!$uid) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // chỉ lưu current_page như FE đang gửi
        $currentPage = max(0, (int) $r->input('current_page', 0));
        $now = now();

        $exists = DB::table('continues')
            ->where('user_id', $uid)
            ->where('product_id', $product)
            ->first();

        if ($exists) {
            DB::table('continues')->where('id', $exists->id)->update([
                'current_page' => $currentPage,
                'updated_at'   => $now,
            ]);
        } else {
            DB::table('continues')->insert([
                'user_id'      => $uid,
                'product_id'   => $product,
                'current_page' => $currentPage,
                'created_at'   => $now,
                'updated_at'   => $now,
            ]);
        }

        $row = DB::table('continues')
            ->where('user_id', $uid)
            ->where('product_id', $product)
            ->first();

        return response()->json(['success' => true, 'data' => $row]);
    }
}
