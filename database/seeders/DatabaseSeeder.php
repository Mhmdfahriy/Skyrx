<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin User
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '081234567890',
            'address' => 'Bandung, Indonesia'
        ]);

        User::create([
            'name' => 'Admin',
            'email' => 'skyrxstore@gmail.com',
            'password' => Hash::make('skyrx123!'),
            'role' => 'admin',
            'phone' => '088976707168',
            'address' => 'Jakarta, Indonesia'
        ]);

        // Create Regular User
        User::create([
            'name' => 'John Doe',
            'email' => 'user@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'phone' => '081234567891',
            'address' => 'Bandung, Indonesia'
        ]);

        // Create Sample Products
        Product::create([
            'name' => 'Laptop ASUS ROG',
            'description' => 'Laptop gaming dengan spesifikasi tinggi, RAM 16GB, SSD 512GB, RTX 3060',
            'price' => 15000000,
            'stock' => 10,
            'category' => 'Electronics',
            'image' => 'https://www.asus.com/media/Odin/Websites/global/ProductLine/20200824120814.jpg?webp'
        ]);

        Product::create([
            'name' => 'iPhone 15 Pro',
            'description' => 'Smartphone flagship Apple dengan chip A17 Pro, kamera 48MP',
            'price' => 18000000,
            'stock' => 15,
            'category' => 'Electronics',
            'image' => 'http://indodana-web.imgix.net/assets/iphone-15-pro-natural-thumbnail-fix.png?auto=compress&auto=format'
        ]);

        Product::create([
            'name' => 'Samsung Galaxy S24',
            'description' => 'Smartphone Android terbaru dengan AI features dan kamera 200MP',
            'price' => 12000000,
            'stock' => 20,
            'category' => 'Electronics',
            'image' => 'https://indodana-web.imgix.net/assets/samsung-galaxy-s24-ultra-thumbnail-titanium-gray.png?auto=compress&auto=format'
        ]);

        Product::create([
            'name' => 'Mechanical Keyboard RGB',
            'description' => 'Keyboard gaming mechanical dengan RGB lighting dan switch red',
            'price' => 850000,
            'stock' => 30,
            'category' => 'Accessories',
            'image' => 'https://blossomzones.com/wp-content/uploads/2020/02/MX10.jpg'
        ]);

        Product::create([
            'name' => 'Gaming Mouse Wireless',
            'description' => 'Mouse gaming wireless dengan DPI hingga 16000 dan battery life 70 jam',
            'price' => 650000,
            'stock' => 25,
            'category' => 'Accessories',
            'image' => 'https://images-cdn.ubuy.co.id/66c668546d24bf002300d301-versiontech-wireless-gaming-mouse.jpg'
        ]);

        Product::create([
            'name' => 'Monitor 27 inch 144Hz',
            'description' => 'Monitor gaming IPS panel, 144Hz refresh rate, 1ms response time',
            'price' => 3500000,
            'stock' => 12,
            'category' => 'Electronics',
            'image' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGTqZwtxcbSMjlpZ9dtMsQxec_PaXMt8Z5Lw&s'
        ]);
    }
}