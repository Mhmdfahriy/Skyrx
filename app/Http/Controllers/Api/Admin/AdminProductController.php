<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;

class AdminProductController extends Controller
{
    // List semua produk (admin)
    public function index()
    {
        $products = Product::all();
        return response()->json($products);
    }

    // Tambah produk baru
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'category' => 'required|string|max:255',
            'image' => 'nullable|string',
        ]);

        $product = Product::create($request->all());
        return response()->json($product, 201);
    }

    // Update produk
    public function update(Request $request, Product $product)
    {
        $product->update($request->all());
        return response()->json($product);
    }

    // Hapus produk
    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }
}
 