<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignUuid('section_id')->constrained('seat_sections')->cascadeOnDelete();
            $table->string('label');
            $table->string('status')->default('available');
            $table->timestamps();

            $table->unique(['section_id', 'label']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE seats ADD CONSTRAINT chk_seat_status CHECK (status IN ('available','reserved','sold','blocked'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('seats');
    }
};
