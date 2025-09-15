<?php

namespace App\Http\Requests\Library;

use Illuminate\Foundation\Http\FormRequest;

class ContinueUpsertRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'product_id'           => ['required','integer','exists:products,id'],
            'current_chapter'      => ['nullable','integer','min:1'],
            'current_page'         => ['nullable','integer','min:1'],
            'current_time_seconds' => ['nullable','integer','min:0'],
            'is_active'            => ['nullable','boolean'],
            // bắt buộc có ít nhất 1 trường progress
            // (Laravel chưa có sẵn rule "at_least_one", giải quyết ở Controller nếu muốn)
        ];
    }
}
