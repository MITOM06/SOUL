<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
}
