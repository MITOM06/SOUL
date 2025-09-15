<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate(['file'=>'required|file|max:10240']); // 10MB
        $file = $request->file('file');
        $path = $file->store('uploads','public');
        return response()->json(['success'=>true,'data'=>[
            'path' => $path,
            'url' => asset('storage/'.$path),
            'filename' => $file->getClientOriginalName()
        ]],201);
    }
}
