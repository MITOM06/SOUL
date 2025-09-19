<?php

namespace App\Http\Controllers\Api\V1\Library;

use App\Http\Controllers\Controller;
use App\Http\Requests\Library\FavouriteStoreRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavouriteController extends Controller
{
    public function index(Request $r)
    {
        $uid = (int) $r->user()->id;
        $ids = DB::table('favourites')
            ->where('user_id',$uid)
            ->orderByDesc('id')
            ->pluck('product_id');
        return response()->json(['success'=>true,'data'=>['product_ids'=>$ids]]);
    }

    public function store(FavouriteStoreRequest $r)
    {
        $uid = (int) $r->user()->id;
        $pid = (int) $r->validated()['product_id'];
        $exists = DB::table('favourites')->where(['user_id'=>$uid,'product_id'=>$pid])->exists();
        if (!$exists) {
            DB::table('favourites')->insert([
                'user_id'=>$uid,'product_id'=>$pid,'created_at'=>now(),'updated_at'=>now(),
            ]);
        }
        return response()->json(['success'=>true,'message'=>'Favourited']);
    }

    public function destroy(Request $r, $productId)
    {
        $uid = (int) $r->user()->id;
        DB::table('favourites')->where(['user_id'=>$uid,'product_id'=>$productId])->delete();
        return response()->json(['success'=>true,'message'=>'Unfavourited']);
    }

    public function toggle(FavouriteStoreRequest $r)
    {
        $uid = (int) $r->user()->id;
        $pid = (int) $r->validated()['product_id'];
        $row = DB::table('favourites')->where(['user_id'=>$uid,'product_id'=>$pid])->first();
        if ($row) {
            DB::table('favourites')->where('id',$row->id)->delete();
            return response()->json(['success'=>true,'data'=>['favourited'=>false]]);
        }
        DB::table('favourites')->insert([
            'user_id'=>$uid,'product_id'=>$pid,'created_at'=>now(),'updated_at'=>now(),
        ]);
        return response()->json(['success'=>true,'data'=>['favourited'=>true]]);
    }
}
