<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Models\ProductFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $r)
    {
        $q = Product::with('category','files')->where('is_published', true);
        if ($r->has('category')) $q->where('category_id',$r->category);
        if ($r->has('brand')) $q->where('brand',$r->brand);
        if ($r->has('q')) $q->where('title','like','%'.$r->q.'%');
        $perPage = $r->get('per_page', 12);
        return response()->json(['success'=>true,'data'=>$q->paginate($perPage)]);
    }

    public function show(Request $r, Product $product)
    {
        $user = $r->user();
        if (!$product->is_published) {
            // only admin or owner can view unpublished
            if (!$user || !$user->hasRole('admin')) {
                return response()->json(['success'=>false,'message'=>'Not found'],404);
            }
        }
        if ($product->access_level !== 'free') {
            if (!$user || !$user->canAccessProduct($product)) {
                return response()->json(['success'=>false,'message'=>'Access denied to this product'],403);
            }
        }
        $product->load('files','category');
        return response()->json(['success'=>true,'data'=>$product]);
    }

    public function store(ProductRequest $request)
    {
        $data = $request->validated();
        $product = Product::create($data);
        // handle uploaded files
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('products','public');
                $product->files()->create([
                    'filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'type' => $file->getClientMimeType(),
                    'size' => $file->getSize()
                ]);
            }
        }
        return response()->json(['success'=>true,'data'=>$product],201);
    }

    public function update(ProductRequest $request, Product $product)
    {
        $product->update($request->validated());
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('products','public');
                $product->files()->create([
                    'filename'=>$file->getClientOriginalName(),
                    'path'=>$path,
                    'type'=>$file->getClientMimeType(),
                    'size'=>$file->getSize()
                ]);
            }
        }
        return response()->json(['success'=>true,'data'=>$product]);
    }

    public function destroy(Product $product)
    {
        // delete files physically
        foreach ($product->files as $f) {
            if ($f->path && Storage::disk('public')->exists($f->path)) {
                Storage::disk('public')->delete($f->path);
            }
            $f->delete();
        }
        $product->delete();
        return response()->json(['success'=>true,'message'=>'Deleted']);
    }

    // Download file
    public function downloadFile(Product $product, ProductFile $file)
    {
        if ($file->product_id !== $product->id) {
            return response()->json(['success'=>false,'message'=>'Not found'],404);
        }
        $disk = Storage::disk('public');
        if (!$disk->exists($file->path)) {
            return response()->json(['success'=>false,'message'=>'File missing'],404);
        }
        return response()->download(storage_path('app/public/'.$file->path), $file->filename);
    }
}
