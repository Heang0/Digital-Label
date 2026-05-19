<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = [
        'name',
        'address',
        'phone',
        'manager_id',
        'company_id',
        'status',
        'location'
    ];

    public function products(): HasMany
    {
        return $this->hasMany(BranchProduct::class);
    }

    public function labels(): HasMany
    {
        return $this->hasMany(Label::class);
    }
}
