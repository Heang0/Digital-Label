<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Product::create([
            'name' => 'Vital Water 500ml',
            'sku' => 'VITAL001',
            'price' => 0.50,
            'category' => 'Water',
            'description' => 'Clean mineral water',
        ]);

        \App\Models\Product::create([
            'name' => 'Coca Cola 330ml',
            'sku' => 'COKE001',
            'price' => 1.00,
            'category' => 'Soda',
            'description' => 'Refreshing soft drink',
        ]);
    }
}
