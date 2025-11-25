<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request; // <-- tambahkan ini!

Route::get('/', function () {
    return view('welcome');
});

Route::get('/reset-password/{token}', function ($token, Request $request) {
    return redirect("http://localhost:5173/reset-password?token={$token}&email={$request->email}");
})->name('password.reset');
