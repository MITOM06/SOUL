<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

/**
 * The User model stores application users.  It uses password_hash rather than
 * password for storing credential digests.  Hidden and cast properties
 * reflect the structure of the users table.
 */
class User extends Authenticatable
{
    use HasFactory, HasApiTokens, Notifiable;

    protected $fillable = [
        'email',
        'password_hash',
        'role',
        'name',
        'is_active',
    ];

    /**
     * Hide sensitive fields when serialising to arrays.
     */
    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function subscriptions()
    {
        return $this->hasMany(UserSubscription::class, 'user_id');
    }

    public function favourites()
    {
        return $this->hasMany(Favourite::class, 'user_id');
    }

    /**
     * Products that this user has favourited.
     */
    public function favouriteProducts()
    {
        return $this->belongsToMany(Product::class, 'favourites', 'user_id', 'product_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'user_id');
    }

    public function continues()
    {
        return $this->hasMany(Continues::class, 'user_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}