<?php
namespace App\Http\Controllers\Api\V1\Library;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ContinueLiteController extends Controller
{
    /**
     * Helper to get current user id (from auth() if available, else X-User-Id header or 1)
     */
    private function currentUserId(Request $r): int
    {
        if (auth()->check()) return (int) auth()->id();
        $h = $r->header('X-User-Id');
        return $h ? (int) $h : 1;
    }

    /**
     * GET /api/v1/continues/{product}
     */
    public function show(Request $r, $productId)
    {
        $userId = $this->currentUserId($r);
        $row = DB::table('continues')->where('product_id',$productId)->where('user_id',$userId)->first();
        return response()->json(['success'=>true,'data'=>$row ?: null]);
    }

    /**
     * POST /api/v1/continues/{product}
     * body: current_chapter?, current_page?, current_time_seconds?
     */
    public function store(Request $r, $productId)
    {
        $userId = $this->currentUserId($r);
        $payload = [
            'current_chapter' => $r->input('current_chapter'),
            'current_page' => $r->input('current_page'),
            'current_time_seconds' => $r->input('current_time_seconds'),
            'updated_at' => now(),
        ];

        $exists = DB::table('continues')->where('product_id',$productId)->where('user_id',$userId)->first();
        if ($exists) {
            DB::table('continues')->where('id',$exists->id)->update($payload);
        } else {
            $payload['product_id'] = (int) $productId;
            $payload['user_id'] = (int) $userId;
            DB::table('continues')->insert($payload);
        }
        return response()->json(['success'=>true,'message'=>'Progress saved']);
    }
}
