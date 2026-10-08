<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_packages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('category', 10)->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('passing_score');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            $table->index(['category', 'is_published']);
        });

        Schema::create('practice_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practice_package_id')->constrained('practice_packages')->cascadeOnDelete();
            $table->text('question');
            $table->text('explanation')->nullable();
            $table->unsignedInteger('weight')->default(1);
            $table->unsignedInteger('order');
            $table->timestamps();
            $table->index(['practice_package_id', 'order']);
        });

        Schema::create('practice_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practice_question_id')->constrained()->cascadeOnDelete();
            $table->char('label', 1);
            $table->text('answer');
            $table->decimal('score', 6, 2)->default(0);
            $table->boolean('is_correct')->default(false);
            $table->unsignedInteger('order');
            $table->timestamps();
            $table->unique(['practice_question_id', 'label']);
            $table->index(['practice_question_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_options');
        Schema::dropIfExists('practice_questions');
        Schema::dropIfExists('practice_packages');
    }
};
