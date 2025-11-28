<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Product; 
use App\Models\Order;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'product_id', 'quantity',
        'price', 'total_price'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
