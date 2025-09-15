<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Represents a payment transaction.  Payments may belong to an order and a
 * user, and may also be associated with a user subscription.  The raw
 * response is cast to an array for easy access.
 */
class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'user_id',
        'provider',
        'amount_cents',
        'currency',
        'status',
        'provider_payment_id',
        'raw_response',
    ];

    protected $casts = [
        'amount_cents' => 'integer',
        'raw_response' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function subscription()
    {
        return $this->hasOne(UserSubscription::class, 'payment_id');
    }
}