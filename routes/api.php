<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\OtpPasswordController;
use App\Http\Controllers\Api\ProfileController; 
use App\Http\Controllers\Api\PaymentController; 
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\UserBalanceController;
use App\Http\Controllers\Api\FlashSaleBannerController; // TAMBAHKAN INI

// --------------------
// PUBLIC ROUTES
// --------------------
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/auth/google', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::post('/chat', [ChatController::class, 'chat']);

Route::post('/forgot-password', [OtpPasswordController::class, 'sendOtp']);
Route::post('/reset-password', [OtpPasswordController::class, 'verifyOtp']);

// Payment simulation untuk Bank/E-wallet (testing only) - PUBLIC FOR TESTING
Route::post('/payment/simulate/{invoice_number}', [PaymentController::class, 'simulate']);

// Flash Sale Banner - PUBLIC
Route::get('/flash-sale-banners', [FlashSaleBannerController::class, 'index']);

// --------------------
// PROTECTED ROUTES (AUTH)
// --------------------
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Profile Management
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'updateProfile']);
        Route::put('/password', [ProfileController::class, 'updatePassword']);
        Route::post('/topup', [ProfileController::class, 'topup']);
        Route::get('/transactions', [ProfileController::class, 'transactions']);
        Route::post('/avatar', [ProfileController::class, 'uploadAvatar']);
    });

    // User Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::delete('/orders/{order}', [OrderController::class, 'destroy']);
    Route::post('/orders/{order}/pay', [OrderController::class, 'pay']);
    Route::post('/orders/{order}/check-payment', [OrderController::class, 'checkPaymentStatus']);
    Route::get('/orders/{order}/status', [OrderController::class, 'getStatus']); 
    
    // Payment methods
    Route::get('/payment-methods', [PaymentController::class, 'getPaymentMethods']);

    // Chat history
    Route::get('/chat/history', [ChatController::class, 'history']);
    Route::delete('/chat/history', [ChatController::class, 'clearHistory']);

    // Balance Saldo
    Route::get('/user/balance', [UserBalanceController::class, 'getBalance']);
});

// --------------------
// ADMIN ROUTES
// --------------------
Route::prefix('admin')->middleware(['auth:sanctum', \App\Http\Middleware\AdminMiddleware::class])->group(function () {
    // Products
    Route::get('/products', [AdminProductController::class, 'index']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::put('/products/{product}', [AdminProductController::class, 'update']);
    Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);

    // Orders
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
    Route::delete('/orders/{order}', [AdminOrderController::class, 'destroy']);

    // Flash Sale Banners - TAMBAHKAN INI
    Route::get('/flash-sale-banners', [FlashSaleBannerController::class, 'adminIndex']);
    Route::post('/flash-sale-banners', [FlashSaleBannerController::class, 'store']);
    Route::post('/flash-sale-banners/{id}', [FlashSaleBannerController::class, 'update']); // POST karena ada file
    Route::delete('/flash-sale-banners/{id}', [FlashSaleBannerController::class, 'destroy']);
    Route::patch('/flash-sale-banners/{id}/toggle', [FlashSaleBannerController::class, 'toggleActive']);
    Route::post('/flash-sale-banners/update-order', [FlashSaleBannerController::class, 'updateOrder']);
});