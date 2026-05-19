<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'name',
        'code',
        'logo_url',
        'status',
        'subscription',
        'owner_id',
        'phone',
        'address'
    ];

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function labels(): HasMany
    {
        return $this->hasMany(Label::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
