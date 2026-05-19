<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Label extends Model
{
    protected $fillable = [
        'label_id',
        'label_code',
        'product_id',
        'branch_id',
        'current_price',
        'base_price',
        'final_price',
        'discount_percent',
        'discount_price',
        'battery',
        'status',
        'last_sync',
        'location',
        'company_id'
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
