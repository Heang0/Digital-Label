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
        Schema::create('issue_reports', function (Blueprint $table) {
            $table->id();
            $table->string('label_id');
            $table->unsignedBigInteger('product_id')->nullable();
            $table->text('issue');
            $table->string('status')->default('open'); // open, in-progress, resolved
            $table->string('priority')->default('medium'); // high, medium, low
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('reported_by')->nullable();
            $table->string('reported_by_name')->nullable();
            $table->json('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issue_reports');
    }
};
