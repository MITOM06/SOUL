<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'current_password'      => ['required','current_password'], // dùng guard mặc định
            'new_password'          => ['required', Password::min(8)->mixedCase()->numbers(), 'confirmed'],
            'new_password_confirmation' => ['required']
        ];
    }
}
