<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchProduct extends Model
{
    protected $fillable = [
        'branch_id',
        'product_id',
        'company_id',
        'current_price',
        'stock',
        'min_stock',
        'status',
        'last_updated'
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
