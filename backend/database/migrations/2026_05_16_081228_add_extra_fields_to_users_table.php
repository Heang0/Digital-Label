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
            $table->string('role')->default('staff'); // admin, vendor, staff
            $table->string('company_id')->nullable();
            $table->string('branch_id')->nullable();
            $table->string('position')->nullable();
            $table->string('photo_url')->nullable();
            $table->string('status')->default('active'); // active, suspended, pending
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'company_id', 'branch_id', 'position', 'photo_url', 'status']);
        });
    }
};
