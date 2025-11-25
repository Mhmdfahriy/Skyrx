<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserBalanceController extends Controller
{
    /**
     * Mengambil saldo terbaru pengguna yang sedang terautentikasi.
     * Endpoint: GET /api/user/balance
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBalance(Request $request)
    {
        // Mendapatkan objek pengguna yang sedang login melalui auth:sanctum middleware
        $user = $request->user();

        // Pastikan kolom 'balance' sudah ada di tabel users (hasil dari migration)

        return response()->json([
            'success' => true,
            'message' => 'Saldo berhasil diambil',
            'balance' => (int) $user->balance,
            'user_id' => $user->id
        ], 200);
    }
}