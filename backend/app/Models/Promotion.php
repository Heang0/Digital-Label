<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $fillable = [
        'name',
        'description',
        'type',
        'value',
        'apply_to',
        'selected_products',
        'selected_branches',
        'start_date',
        'end_date',
        'status',
        'company_id',
        'branch_id'
    ];

    protected $casts = [
        'selected_products' => 'array',
        'selected_branches' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime'
    ];
}
