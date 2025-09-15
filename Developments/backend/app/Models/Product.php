<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * The Product model represents both ebooks and podcasts in the catalog.  It
 * exposes relationships to files, order items, favourites and progress
 * tracking (continues).  Metadata is cast to an array for convenient access.
 */
class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'description',
        'price_cents',
        'thumbnail_url',
        'category',
        'slug',
        'metadata',
        'is_active',
    ];

    protected $casts = [
        'price_cents' => 'integer',
        'metadata'    => 'array',
        'is_active'   => 'boolean',
    ];

    /**
     * Files (e.g. pdf, mp3, mp4) associated with this product.
     */
    public function files()
    {
        return $this->hasMany(ProductFile::class, 'product_id');
    }

    /**
     * Order items referencing this product.
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'product_id');
    }

    /**
     * Favourite records for this product.
     */
    public function favourites()
    {
        return $this->hasMany(Favourite::class, 'product_id');
    }

    /**
     * Progress tracking (continues) entries for this product.
     */
    public function continues()
    {
        return $this->hasMany(Continues::class, 'product_id');
    }

    /**
     * Users who have favourited this product.
     */
    public function favouritedByUsers()
    {
        return $this->belongsToMany(User::class, 'favourites', 'product_id', 'user_id');
    }

    /**
     * Scope to only active products.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}