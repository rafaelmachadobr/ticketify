<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('venue');
            $table->string('city');
            $table->string('category');
            $table->timestampTz('date_from');
            $table->timestampTz('date_to')->nullable();
            $table->timestampTz('gates_open')->nullable();
            $table->decimal('min_price', 10, 2)->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
