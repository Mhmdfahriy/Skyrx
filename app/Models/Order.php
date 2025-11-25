<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'total_price', 'payment_method',
        'payment_status', 'status', 'invoice_id',
        'invoice_url', 'paid_at'
    ];

    protected function casts(): array {
        return [
            'total_price' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function user(){
        return $this->belongsTo(User::class);
    }

    public function items(){
        return $this->hasMany(OrderItem::class);
    }
}

