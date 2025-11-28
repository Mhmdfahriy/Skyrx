<?php

namespace Database\Seeders;

use App\Models\FlashSaleBanner;
use Illuminate\Database\Seeder;

class FlashSaleBannerSeeder extends Seeder
{
    public function run(): void
    {
        $banners = [
            [
                'title' => 'Flash Sale Hari Ini!',
                'subtitle' => 'Diskon hingga 50% untuk produk pilihan',
                'image' => 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'Gratis Ongkir Se-Indonesia!',
                'subtitle' => 'Belanja minimal Rp100.000',
                'image' => 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop',
                'order' => 2,
                'is_active' => true,
            ],
            [
                'title' => 'Promo Spesial Member!',
                'subtitle' => 'Cashback hingga 100rb untuk member setia',
                'image' => 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=1200&h=400&fit=crop',
                'order' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($banners as $banner) {
            FlashSaleBanner::create($banner);
        }
    }
}