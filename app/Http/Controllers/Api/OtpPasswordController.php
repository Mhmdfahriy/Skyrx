<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\User;

class OtpPasswordController extends Controller
{
    /**
     * @OA\Post(
     *      path="/api/forgot-password",
     *      operationId="sendOtp",
     *      tags={"Password Reset"},
     *      summary="Send OTP to email",
     *      description="Mengirim kode OTP 6 digit ke email untuk reset password. OTP berlaku 10 menit",
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email"},
     *              @OA\Property(
     *                  property="email",
     *                  type="string",
     *                  format="email",
     *                  example="john@example.com",
     *                  description="Email user yang terdaftar"
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="OTP sent successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Kode OTP telah dikirim ke email Anda.")
     *          )
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Email not found",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Email tidak ditemukan.")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error",
     *          @OA\JsonContent(ref="#/components/schemas/ValidationError")
     *      )
     * )
     */
    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak ditemukan.'], 404);
        }

        $otp = rand(100000, 999999);

        DB::table('password_reset_otps')->updateOrInsert(
            ['email' => $request->email],
            ['otp' => $otp, 'created_at' => Carbon::now()]
        );

        // Kirim OTP ke email
        Mail::raw("Kode OTP reset password Anda adalah: $otp", function ($message) use ($request) {
            $message->to($request->email)
                    ->subject('Kode OTP Reset Password');
        });

        return response()->json(['message' => 'Kode OTP telah dikirim ke email Anda.']);
    }

    /**
     * @OA\Post(
     *      path="/api/reset-password",
     *      operationId="verifyOtpAndResetPassword",
     *      tags={"Password Reset"},
     *      summary="Verify OTP and reset password",
     *      description="Verifikasi kode OTP dan mengubah password baru. OTP harus digunakan dalam 10 menit setelah dikirim",
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email","otp","password","password_confirmation"},
     *              @OA\Property(
     *                  property="email",
     *                  type="string",
     *                  format="email",
     *                  example="john@example.com"
     *              ),
     *              @OA\Property(
     *                  property="otp",
     *                  type="string",
     *                  pattern="^\d{6}$",
     *                  example="123456",
     *                  description="Kode OTP 6 digit yang dikirim ke email"
     *              ),
     *              @OA\Property(
     *                  property="password",
     *                  type="string",
     *                  format="password",
     *                  minLength=6,
     *                  example="newpassword123",
     *                  description="Password baru (minimal 6 karakter)"
     *              ),
     *              @OA\Property(
     *                  property="password_confirmation",
     *                  type="string",
     *                  format="password",
     *                  example="newpassword123",
     *                  description="Konfirmasi password baru (harus sama dengan password)"
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Password reset successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Password berhasil direset.")
     *          )
     *      ),
     *      @OA\Response(
     *          response=400,
     *          description="Bad request - OTP salah atau expired",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Kode OTP salah atau sudah kadaluarsa.")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="The given data was invalid."),
     *              @OA\Property(
     *                  property="errors",
     *                  type="object",
     *                  @OA\Property(
     *                      property="otp",
     *                      type="array",
     *                      @OA\Items(type="string", example="The otp must be 6 digits.")
     *                  ),
     *                  @OA\Property(
     *                      property="password",
     *                      type="array",
     *                      @OA\Items(type="string", example="The password confirmation does not match.")
     *                  )
     *              )
     *          )
     *      )
     * )
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6',
            'password' => 'required|confirmed|min:6'
        ]);

        $record = DB::table('password_reset_otps')
            ->where('email', $request->email)
            ->where('otp', $request->otp)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Kode OTP salah atau sudah kadaluarsa.'], 400);
        }

        // Periksa apakah OTP masih valid (misal 10 menit)
        if (Carbon::parse($record->created_at)->addMinutes(10)->isPast()) {
            DB::table('password_reset_otps')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Kode OTP telah kadaluarsa.'], 400);
        }

        // Update password user
        User::where('email', $request->email)->update([
            'password' => Hash::make($request->password)
        ]);

        DB::table('password_reset_otps')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password berhasil direset.']);
    }
}