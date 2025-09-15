<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ApprovePodcastRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->role === 'admin' || $this->user()?->hasRole('admin'); }

    public function rules(): array
    {
        return [
            'approved' => ['required','boolean'],
        ];
    }
}
