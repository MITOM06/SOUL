<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Continues;

/**
 * Seed the continues table.  Continues track user progress through ebooks
 * or podcasts.  Each record is created via the ContinuesFactory.
 */
class ContinuesSeeder extends Seeder
{
    public function run()
    {
        Continues::factory()->count(30)->create();
    }
}