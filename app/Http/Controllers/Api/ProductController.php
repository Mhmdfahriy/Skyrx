<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * @OA\Get(
     *      path="/api/products",
     *      operationId="getProductsList",
     *      tags={"Products"},
     *      summary="Get list of products",
     *      description="Mendapatkan daftar semua produk",
     *      @OA\Parameter(
     *          name="search",
     *          in="query",
     *          description="Search by product name",
     *          required=false,
     *          @OA\Schema(type="string")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/Product")
     *          )
     *      )
     * )
     */
    public function index()
    {
        $products = Product::latest()->get();
        return response()->json($products);
    }

    /**
     * @OA\Post(
     *      path="/api/products",
     *      operationId="createProduct",
     *      tags={"Products"},
     *      summary="Create new product",
     *      description="Membuat produk baru (Admin only)",
     *      security={{"sanctum":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"name","description","price","stock","category"},
     *              @OA\Property(property="name", type="string", maxLength=255, example="Samsung Galaxy S23"),
     *              @OA\Property(property="description", type="string", example="Latest Samsung flagship smartphone with amazing camera"),
     *              @OA\Property(property="price", type="number", format="float", example=12999000),
     *              @OA\Property(property="stock", type="integer", minimum=0, example=50),
     *              @OA\Property(property="category", type="string", example="Electronics"),
     *              @OA\Property(property="image", type="string", nullable=true, example="https://example.com/images/galaxy-s23.jpg")
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Product created successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Product created successfully"),
     *              @OA\Property(property="product", ref="#/components/schemas/Product")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error",
     *          @OA\JsonContent(ref="#/components/schemas/ValidationError")
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'category' => 'required|string',
            'image' => 'nullable|string'
        ]);

        $product = Product::create($validated);
        
        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product
        ], 201);
    }

    /**
     * @OA\Get(
     *      path="/api/products/{product}",
     *      operationId="getProductById",
     *      tags={"Products"},
     *      summary="Get product by ID",
     *      description="Mendapatkan detail produk berdasarkan ID",
     *      @OA\Parameter(
     *          name="product",
     *          in="path",
     *          description="Product ID",
     *          required=true,
     *          @OA\Schema(type="integer", example=1)
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/Product")
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Product not found",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Product not found")
     *          )
     *      )
     * )
     */
    public function show(Product $product)
    {
        return response()->json($product);
    }

    /**
     * @OA\Put(
     *      path="/api/products/{product}",
     *      operationId="updateProduct",
     *      tags={"Products"},
     *      summary="Update product",
     *      description="Update data produk (Admin only)",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="product",
     *          in="path",
     *          description="Product ID",
     *          required=true,
     *          @OA\Schema(type="integer", example=1)
     *      ),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              @OA\Property(property="name", type="string", maxLength=255, example="Samsung Galaxy S23 Ultra"),
     *              @OA\Property(property="description", type="string", example="Updated description"),
     *              @OA\Property(property="price", type="number", format="float", example=15999000),
     *              @OA\Property(property="stock", type="integer", minimum=0, example=30),
     *              @OA\Property(property="category", type="string", example="Electronics"),
     *              @OA\Property(property="image", type="string", nullable=true, example="https://example.com/images/updated.jpg")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Product updated successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Product updated successfully"),
     *              @OA\Property(property="product", ref="#/components/schemas/Product")
     *          )
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Product not found"
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error",
     *          @OA\JsonContent(ref="#/components/schemas/ValidationError")
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'category' => 'sometimes|string',
            'image' => 'nullable|string'
        ]);

        $product->update($validated);
        
        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product
        ]);
    }

    /**
     * @OA\Delete(
     *      path="/api/products/{product}",
     *      operationId="deleteProduct",
     *      tags={"Products"},
     *      summary="Delete product",
     *      description="Menghapus produk (Admin only)",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="product",
     *          in="path",
     *          description="Product ID",
     *          required=true,
     *          @OA\Schema(type="integer", example=1)
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Product deleted successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Product deleted successfully")
     *          )
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Product not found"
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function destroy(Product $product)
    {
        $product->delete();
        
        return response()->json([
            'message' => 'Product deleted successfully'
        ]);
    }
}