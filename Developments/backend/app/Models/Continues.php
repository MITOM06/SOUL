<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Tracks a user's progress through an ebook or podcast.  Because "continue"
 * is a PHP keyword, the model name is plural (Continues) matching the
 * underlying continues table.
 */
class Continues extends Model
{
    use HasFactory;

    protected $table = 'continues';

    protected $fillable = [
        'user_id',
        'product_id',
        'current_chapter',
        'current_page',
        'current_time_seconds',
        'is_active',
    ];

    protected $casts = [
        'current_chapter'      => 'integer',
        'current_page'         => 'integer',
        'current_time_seconds' => 'integer',
        'is_active'            => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}