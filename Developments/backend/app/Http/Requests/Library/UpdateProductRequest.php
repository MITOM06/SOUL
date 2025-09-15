<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = (int) $this->route('id'); // routes dùng products/{id}

        return [
            'type'          => ['sometimes','in:ebook,podcast'],
            'title'         => ['sometimes','string','max:300'],
            'description'   => ['nullable','string'],
            'price_cents'   => ['sometimes','integer','min:0'],
            'thumbnail_url' => ['nullable','url','max:1000'],
            'category'      => ['nullable','string','max:120'],
            'slug'          => ['sometimes','string','max:300', Rule::unique('products','slug')->ignore($id)],
            'metadata'      => ['nullable','array'],
            'is_active'     => ['sometimes','boolean'],
        ];
    }
}
