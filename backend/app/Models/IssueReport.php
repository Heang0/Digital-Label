<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssueReport extends Model
{
    protected $fillable = [
        'label_id',
        'product_id',
        'issue',
        'status',
        'priority',
        'branch_id',
        'company_id',
        'reported_by',
        'reported_by_name',
        'notes'
    ];

    protected $casts = [
        'notes' => 'array'
    ];
}
