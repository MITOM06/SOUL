<?php

namespace App\Http\Requests\Commerce;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            // Cho phép gửi items [] để server tính total_cents
            'items'                   => ['required','array','min:1'],
            'items.*.product_id'      => ['required','integer','exists:products,id'],
            'items.*.quantity'        => ['required','integer','min:1','max:20'],
            // total_cents sẽ do server tính — nếu cho phép gửi từ client thì:
            // 'total_cents'          => ['sometimes','integer','min:0'],
            'payment_method'          => ['nullable','string','max:100'], // 'stripe_test'...
        ];
    }
}
