<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;

class FavouriteStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'product_id' => ['required','integer','exists:products,id'],
        ];
    }
}
