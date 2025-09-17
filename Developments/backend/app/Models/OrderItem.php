<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * A line item within an order.  Captures the unit price at time of purchase
 * and quantity.  Uses cents for pricing to avoid floating point errors.
 */
class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'unit_price_cents',
        'quantity',
    ];

    protected $casts = [
        'unit_price_cents' => 'integer',
        'quantity'         => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

  

}