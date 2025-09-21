<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // MySQL enum update: add 'youtube' to file_type
        // Keep the column nullable as before
        DB::statement("ALTER TABLE `product_files` MODIFY COLUMN `file_type` ENUM('pdf','epub','mobi','mp3','mp4','image','youtube','other') NULL");
    }

    public function down(): void
    {
        // Revert to previous enum set (will fail if rows contain 'youtube')
        DB::statement("ALTER TABLE `product_files` MODIFY COLUMN `file_type` ENUM('pdf','epub','mobi','mp3','mp4','image','other') NULL");
    }
};

