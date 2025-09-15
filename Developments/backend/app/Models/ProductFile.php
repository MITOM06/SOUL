<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Each ProductFile represents a downloadable asset or media file for a
 * product.  The 'meta' column can store additional JSON information such
 * as page count or duration.
 */
class ProductFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'file_type',
        'file_url',
        'filesize_bytes',
        'is_preview',
        'meta',
    ];

    protected $casts = [
        'filesize_bytes' => 'integer',
        'is_preview'     => 'boolean',
        'meta'           => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}