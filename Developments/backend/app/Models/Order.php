<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Represents a customer order.  An order may have multiple items and
 * multiple associated payments.  Totals are stored in cents to avoid
 * floating point issues.
 */
class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'total_cents',
        'status',
        'payment_method',
    ];

    protected $casts = [
        'total_cents' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * There may be multiple payments for a single order (e.g. retries).
     */

     
    public function payments()
    {
        return $this->hasMany(Payment::class, 'order_id');
    }
}