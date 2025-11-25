<?php

namespace App\Http\Controllers\Api;

/**
 * @OA\Schema(
 *     schema="User",
 *     type="object",
 *     title="User",
 *     required={"id", "name", "email"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="John Doe"),
 *     @OA\Property(property="email", type="string", format="email", example="john@example.com"),
 *     @OA\Property(property="phone", type="string", nullable=true, example="+628123456789"),
 *     @OA\Property(property="address", type="string", nullable=true, example="Jakarta"),
 *     @OA\Property(property="role", type="string", enum={"user", "admin"}, example="user"),
 *     @OA\Property(property="balance", type="number", format="float", example=100000),
 *     @OA\Property(property="avatar", type="string", nullable=true, example="avatar.jpg"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="Product",
 *     type="object",
 *     title="Product",
 *     required={"id", "name", "price", "stock"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Samsung Galaxy S23"),
 *     @OA\Property(property="description", type="string", example="Latest Samsung flagship"),
 *     @OA\Property(property="price", type="number", format="float", example=12999000),
 *     @OA\Property(property="stock", type="integer", example=50),
 *     @OA\Property(property="category", type="string", example="Electronics"),
 *     @OA\Property(property="image", type="string", nullable=true, example="product.jpg"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="OrderItem",
 *     type="object",
 *     title="OrderItem",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="order_id", type="integer", example=1),
 *     @OA\Property(property="product_id", type="integer", example=1),
 *     @OA\Property(property="quantity", type="integer", example=2),
 *     @OA\Property(property="price", type="number", format="float", example=12999000),
 *     @OA\Property(property="total_price", type="number", format="float", example=25998000),
 *     @OA\Property(property="product", ref="#/components/schemas/Product")
 * )
 *
 * @OA\Schema(
 *     schema="Order",
 *     type="object",
 *     title="Order",
 *     description="Order model. Untuk Bank/E-wallet payment, gunakan invoice_id untuk simulasi payment di /payment/simulate/{invoice_id}",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="total_price", type="number", format="float", example=25998000),
 *     @OA\Property(property="payment_method", type="string", example="xendit"),
 *     @OA\Property(property="payment_status", type="string", enum={"pending", "paid", "failed"}, example="paid"),
 *     @OA\Property(property="status", type="string", enum={"pending", "processing", "completed", "cancelled"}, example="processing"),
 *     @OA\Property(property="invoice_id", type="string", nullable=true, example="692551709101a99ffd9eebae", description="Gunakan ini untuk simulasi payment"),
 *     @OA\Property(property="invoice_url", type="string", nullable=true, example="https://checkout.xendit.co/web/abc123"),
 *     @OA\Property(property="paid_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(
 *         property="items",
 *         type="array",
 *         @OA\Items(ref="#/components/schemas/OrderItem")
 *     ),
 *     @OA\Property(property="user", ref="#/components/schemas/User")
 * )
 *
 * @OA\Schema(
 *     schema="Transaction",
 *     type="object",
 *     title="Transaction",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="type", type="string", enum={"topup", "payment", "refund"}, example="topup"),
 *     @OA\Property(property="amount", type="number", format="float", example=100000),
 *     @OA\Property(property="balance_before", type="number", format="float", example=50000),
 *     @OA\Property(property="balance_after", type="number", format="float", example=150000),
 *     @OA\Property(property="description", type="string", example="Top up saldo"),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="ChatHistory",
 *     type="object",
 *     title="ChatHistory",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="message", type="string", example="Halo, ada promo?"),
 *     @OA\Property(property="response", type="string", example="Halo, selamat datang di MinSkyrx!"),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="ValidationError",
 *     type="object",
 *     title="ValidationError",
 *     @OA\Property(property="message", type="string", example="The given data was invalid."),
 *     @OA\Property(
 *         property="errors",
 *         type="object",
 *         @OA\AdditionalProperties(
 *             type="array",
 *             @OA\Items(type="string")
 *         )
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="PaymentMethod",
 *     type="object",
 *     title="PaymentMethod",
 *     @OA\Property(property="id", type="string", example="BCA"),
 *     @OA\Property(property="name", type="string", example="BCA"),
 *     @OA\Property(property="logo", type="string", example="http://localhost:8000/Payments/BCA-icon.svg"),
 *     @OA\Property(property="popular", type="boolean", example=true)
 * )
 */
class Schemas
{
    // This class is only for Swagger documentation
}