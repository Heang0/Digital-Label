<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'sku',
        'price',
        'category',
        'description',
        'image_url',
        'company_id'
    ];
}
