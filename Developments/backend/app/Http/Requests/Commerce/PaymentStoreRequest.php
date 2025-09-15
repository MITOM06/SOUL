<?php

namespace App\Http\Requests\Commerce;

use Illuminate\Foundation\Http\FormRequest;

class PaymentStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'order_id'            => ['required','integer','exists:orders,id'],
            'provider'            => ['required','string','max:100'],   // stripe_test | momo | paypal ...
            'amount_cents'        => ['required','integer','min:1'],
            'currency'            => ['nullable','string','max:10'],
            'provider_payment_id' => ['nullable','string','max:255'],
        ];
    }
}
