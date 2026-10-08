<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            MaterialsSeeder::class,
            PracticePackagesSeeder::class,
            TiuSyncPackageSeeder::class,
            TryoutsSeeder::class,
            NewsSeeder::class,
        ]);
    }
}
