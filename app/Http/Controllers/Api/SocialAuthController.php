<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    /**
     * @OA\Get(
     *      path="/api/auth/google",
     *      operationId="googleAuthRedirect",
     *      tags={"Social Auth"},
     *      summary="Redirect to Google OAuth",
     *      description="Mendapatkan URL untuk redirect ke halaman login Google OAuth",
     *      @OA\Response(
     *          response=200,
     *          description="Google OAuth URL returned",
     *          @OA\JsonContent(
     *              @OA\Property(
     *                  property="url",
     *                  type="string",
     *                  example="https://accounts.google.com/o/oauth2/auth?client_id=..."
     *              )
     *          )
     *      )
     * )
     */
    public function redirectToGoogle()
    {
        return response()->json([
            'url' => Socialite::driver('google')
                ->stateless()
                ->redirect()
                ->getTargetUrl()
        ]);
    }

    /**
     * @OA\Get(
     *      path="/api/auth/google/callback",
     *      operationId="googleAuthCallback",
     *      tags={"Social Auth"},
     *      summary="Handle Google OAuth callback",
     *      description="Callback endpoint yang dipanggil oleh Google setelah user authorize",
     *      @OA\Parameter(
     *          name="code",
     *          in="query",
     *          description="Authorization code dari Google",
     *          required=true,
     *          @OA\Schema(type="string")
     *      ),
     *      @OA\Response(
     *          response=302,
     *          description="Redirect to frontend with token"
     *      )
     * )
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();

            // Cari atau buat user
            $user = User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => Hash::make(Str::random(24)),
                    'role' => 'user',
                    'google_id' => $googleUser->getId(),
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            // Redirect ke frontend dengan token
            return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/auth/google/callback?token=' . $token);

        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?error=google_auth_failed');
        }
    }
}