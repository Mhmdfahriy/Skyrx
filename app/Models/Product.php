<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'stock',
        'image',
        'category',
    ];

    protected function castc(): array
    {
        return[
            'price' => 'decimal:2',
        ];
    }
}
