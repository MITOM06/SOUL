<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BlockUserRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->role === 'admin' || $this->user()?->hasRole('admin'); }

    public function rules(): array
    {
        return [
            'is_active' => ['required','boolean'], // false = block, true = unblock
        ];
    }
}
