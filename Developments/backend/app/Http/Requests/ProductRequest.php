<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:products,slug,' . $this->route('product'),
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'brand' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'is_published' => 'boolean',
            'access_level' => 'in:free,basic,premium,vip'
        ];
    }
}
