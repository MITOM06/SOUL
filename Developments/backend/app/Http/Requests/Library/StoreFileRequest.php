<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;

class StoreFileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'product_id'     => ['required','integer','exists:products,id'],
            'file_type'      => ['nullable','in:pdf,epub,mobi,mp3,mp4,image,other'],
            'file_url'       => ['required','url','max:1000'],
            'filesize_bytes' => ['nullable','integer','min:0'],
            'is_preview'     => ['boolean'],
            'meta'           => ['nullable','array'],
        ];
    }
}
