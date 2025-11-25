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
    Route::post('/orders/{order}/pay', [OrderController::class, 'pay']); // ✅ Payment endpoint
    Route::post('/orders/{order}/check-payment', [OrderController::class, 'checkPaymentStatus']);
    Route::get('/orders/{order}/status', [OrderController::class, 'getStatus']); // ✅ USER status endpoint
    
    // Payment methods
    Route::get('/payment-methods', [PaymentController::class, 'getPaymentMethods']);

    // Payment simulation untuk Bank/E-wallet (testing only)
    Route::post('/payment/simulate/{invoice_number}', [PaymentController::class, 'simulate']);

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
    Route::put('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']); // ✅ ADMIN update status
    Route::delete('/orders/{order}', [AdminOrderController::class, 'destroy']);
});