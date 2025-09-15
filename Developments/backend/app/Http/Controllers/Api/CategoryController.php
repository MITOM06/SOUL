<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $r)
    {
        $q = Category::query();
        if ($r->has('type')) $q->where('type',$r->type);
        return response()->json(['success'=>true,'data'=>$q->paginate(20)]);
    }

    public function show(Category $category)
    {
        return response()->json(['success'=>true,'data'=>$category]);
    }

    public function store(CategoryRequest $request)
    {
        $data = $request->validated();
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('categories','public');
            $data['image'] = $path;
        }
        $category = Category::create($data);
        return response()->json(['success'=>true,'data'=>$category],201);
    }

    public function update(CategoryRequest $request, Category $category)
    {
        $data = $request->validated();
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('categories','public');
            $data['image'] = $path;
        }
        $category->update($data);
        return response()->json(['success'=>true,'data'=>$category]);
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(['success'=>true,'message'=>'Deleted']);
    }
}
