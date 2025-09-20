<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserSubscription extends Model
{
    use HasFactory;

    protected $table = 'user_subscriptions';

    protected $fillable = [
        'user_id',
        'plan_key',     // 👈 dùng đúng cột DB
        'status',
        'start_date',
        'end_date',
        'price_cents',
        'payment_id',
    ];

    protected $casts = [
        'start_date'  => 'datetime',
        'end_date'    => 'datetime',
        'price_cents' => 'integer',
    ];

    public function user()  { return $this->belongsTo(User::class); }
    public function payment(){ return $this->belongsTo(Payment::class, 'payment_id'); }

    // (Tuỳ chọn) alias để đọc cho tiện: $sub->plan
    public function getPlanAttribute()
    {
        return $this->plan_key;
    }
}
