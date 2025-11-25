<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    // Kirim kode OTP ke email
    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $otp = rand(100000, 999999);

        // Simpan OTP ke tabel password_resets
        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $otp,
                'created_at' => Carbon::now()
            ]
        );

        // Kirim email OTP
        Mail::raw("Kode OTP Anda untuk reset password adalah: {$otp}", function ($message) use ($request) {
            $message->to($request->email)
                    ->subject('Kode OTP Reset Password - SkyrX Store');
        });

        return response()->json(['message' => 'Kode OTP telah dikirim ke email Anda.']);
    }

    // Verifikasi OTP dan ubah password
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|numeric',
            'password' => 'required|confirmed|min:6',
        ]);

        $record = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'OTP salah atau tidak valid.'], 422);
        }

        // Cek apakah OTP kadaluarsa (>15 menit)
        if (Carbon::parse($record->created_at)->addMinutes(15)->isPast()) {
            return response()->json(['message' => 'Kode OTP telah kadaluarsa.'], 422);
        }

        // Ubah password user
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Hapus OTP setelah digunakan
        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password berhasil direset.']);
    }
}
