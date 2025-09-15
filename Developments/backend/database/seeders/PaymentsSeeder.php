<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Payment;

/**
 * Seed the payments table.  Payments may be linked to orders and users; the
 * factory defines these relationships.
 */
class PaymentsSeeder extends Seeder
{
    public function run()
    {
        Payment::factory()->count(30)->create();
    }
}