<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'type'          => ['required','in:ebook,podcast'],
            'title'         => ['required','string','max:300'],
            'description'   => ['nullable','string'],
            'price_cents'   => ['required','integer','min:0'],
            'thumbnail_url' => ['nullable','url','max:1000'],
            'category'      => ['nullable','string','max:120'],
            'slug'          => ['required','string','max:300','unique:products,slug'],
            'metadata'      => ['nullable','array'], // gửi JSON => array
            'is_active'     => ['boolean'],
        ];
    }
}
