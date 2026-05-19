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
        Schema::table('users', function (Blueprint $table) {
            $table->index('company_id');
            $table->index('branch_id');
            $table->index('role');
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->index('company_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('company_id');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->index('company_id');
        });

        Schema::table('labels', function (Blueprint $table) {
            $table->index('company_id');
            $table->index('branch_id');
            $table->index('product_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['company_id']);
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['role']);
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->dropIndex(['company_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['company_id']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['company_id']);
        });

        Schema::table('labels', function (Blueprint $table) {
            $table->dropIndex(['company_id']);
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['product_id']);
            $table->dropIndex(['status']);
        });
    }
};
