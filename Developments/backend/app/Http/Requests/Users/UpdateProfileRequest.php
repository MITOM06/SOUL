<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => ['required','string','max:150'],
            // Email đổi sau sẽ cần xác minh — ở đây không cho đổi email cho đơn giản
        ];
    }
}
