<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('labels', function (Blueprint $table) {
            $table->id();
            $table->string('label_id')->unique();
            $table->string('label_code')->nullable();
            $table->string('product_id')->nullable();
            $table->string('branch_id')->nullable();
            $table->string('company_id')->nullable();
            $table->decimal('current_price', 10, 2)->nullable();
            $table->decimal('base_price', 10, 2)->nullable();
            $table->decimal('final_price', 10, 2)->nullable();
            $table->decimal('discount_percent', 5, 2)->nullable();
            $table->decimal('discount_price', 10, 2)->nullable();
            $table->integer('battery')->default(100);
            $table->string('status')->default('active'); // active, maintenance, offline, syncing
            $table->timestamp('last_sync')->nullable();
            $table->string('location')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('labels');
    }
};
