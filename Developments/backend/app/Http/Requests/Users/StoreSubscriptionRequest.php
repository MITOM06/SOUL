<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubscriptionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'plan_key'    => ['required','string','max:50'], // ví dụ: basic|premium|vip
            'price_cents' => ['required','integer','min:0'],
            'start_date'  => ['required','date'],
            'end_date'    => ['required','date','after:start_date'],
            'status'      => ['nullable','string','in:active,expired,canceled,pending'],
            'payment_id'  => ['nullable','integer','exists:payments,id'],
        ];
    }
}
