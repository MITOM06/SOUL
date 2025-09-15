<?php

namespace App\Http\Requests\Commerce;

use Illuminate\Foundation\Http\FormRequest;

class OrderItemStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'product_id'       => ['required','integer','exists:products,id'],
            'quantity'         => ['required','integer','min:1','max:20'],
            // unit_price_cents sẽ lấy theo product ở thời điểm tạo đơn
        ];
    }
}
