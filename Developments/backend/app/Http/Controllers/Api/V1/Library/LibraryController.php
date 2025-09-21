<?php

namespace App\Http\Controllers\Api\V1\Library;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LibraryController extends Controller
{
    /**
     * GET /api/v1/library
     * Query: type=ebook|podcast, search, category
     * Returns products that the current user has purchased (orders.status=paid).
     */
    public function index(Request $r)
    {
        $u = $r->user();
        if (!$u) return response()->json(['success'=>false,'message'=>'Unauthenticated'], 401);

        $q = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->join('products as p', 'p.id', '=', 'oi.product_id')
            ->where('o.user_id', $u->id)
            ->where('o.status', 'paid')
            ->select(
                'p.id', 'p.type', 'p.title', 'p.description', 'p.price_cents',
                'p.thumbnail_url', 'p.category', 'p.slug', 'p.created_at', 'p.updated_at',
                DB::raw('MAX(o.created_at) as purchased_at')
            )
            ->groupBy('p.id','p.type','p.title','p.description','p.price_cents','p.thumbnail_url','p.category','p.slug','p.created_at','p.updated_at');

        if ($r->filled('type')) $q->where('p.type', $r->query('type'));
        if ($r->filled('category')) $q->where('p.category', $r->query('category'));
        if ($r->filled('search')) {
            $s = '%' . $r->query('search') . '%';
            $q->where('p.title', 'like', $s);
        }

        $items = $q->orderByDesc('purchased_at')->get();
        return response()->json(['success'=>true,'data'=>$items]);
    }
}

