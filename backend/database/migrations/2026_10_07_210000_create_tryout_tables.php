<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tryouts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('tryout_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tryout_id')->constrained()->cascadeOnDelete();
            $table->string('name', 20);
            $table->string('category', 10);
            $table->unsignedInteger('duration');
            $table->unsignedInteger('passing_grade');
            $table->unsignedInteger('order');
            $table->timestamps();
            $table->unique(['tryout_id', 'category']);
            $table->index(['tryout_id', 'order']);
        });

        Schema::create('tryout_section_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tryout_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('practice_question_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('order');
            $table->timestamps();
            $table->unique(['tryout_section_id', 'practice_question_id'], 'tryout_section_question_unique');
            $table->index(['tryout_section_id', 'order']);
        });

        Schema::create('tryout_attempts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tryout_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('in_progress');
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('total_score')->default(0);
            $table->unsignedInteger('max_score')->default(0);
            $table->boolean('passed')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        Schema::create('tryout_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tryout_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('practice_question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('practice_option_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();
            $table->unique(['tryout_attempt_id', 'practice_question_id'], 'tryout_attempt_question_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tryout_attempt_answers');
        Schema::dropIfExists('tryout_attempts');
        Schema::dropIfExists('tryout_section_questions');
        Schema::dropIfExists('tryout_sections');
        Schema::dropIfExists('tryouts');
    }
};
