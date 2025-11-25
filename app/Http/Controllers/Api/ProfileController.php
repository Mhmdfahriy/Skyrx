<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * @OA\Get(
     *      path="/api/profile",
     *      operationId="getProfile",
     *      tags={"Profile"},
     *      summary="Get user profile",
     *      description="Mendapatkan profil user yang sedang login beserta statistik order",
     *      security={{"sanctum":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(
     *                  property="user",
     *                  type="object",
     *                  @OA\Property(property="id", type="integer", example=1),
     *                  @OA\Property(property="name", type="string", example="John Doe"),
     *                  @OA\Property(property="email", type="string", example="john@example.com"),
     *                  @OA\Property(property="role", type="string", example="user"),
     *                  @OA\Property(property="balance", type="number", format="float", example=150000),
     *                  @OA\Property(property="avatar", type="string", example="1234567890_1.jpg")
     *              ),
     *              @OA\Property(
     *                  property="stats",
     *                  type="object",
     *                  @OA\Property(property="total_orders", type="integer", example=15),
     *                  @OA\Property(property="completed_orders", type="integer", example=12),
     *                  @OA\Property(property="total_spent", type="number", format="float", example=5000000)
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function show(Request $request)
    {
        $user = $request->user()->load('orders');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'balance' => $user->balance,
                // Kembalikan nama file saja, frontend yang handle URL building
                'avatar' => $user->avatar ?: 'default-avatar.png',
            ],
            'stats' => [
                'total_orders' => $user->orders()->count(),
                'completed_orders' => $user->orders()->where('status', 'completed')->count(),
                'total_spent' => $user->orders()->where('status', 'completed')->sum('total_price'),
            ]
        ]);
    }

    /**
     * @OA\Put(
     *      path="/api/profile",
     *      operationId="updateProfile",
     *      tags={"Profile"},
     *      summary="Update profile",
     *      description="Update nama dan email user",
     *      security={{"sanctum":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              @OA\Property(property="name", type="string", maxLength=255, example="John Doe Updated"),
     *              @OA\Property(property="email", type="string", format="email", example="newemail@example.com")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Profile updated successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Profile updated successfully"),
     *              @OA\Property(
     *                  property="user",
     *                  type="object",
     *                  @OA\Property(property="id", type="integer"),
     *                  @OA\Property(property="name", type="string"),
     *                  @OA\Property(property="email", type="string"),
     *                  @OA\Property(property="role", type="string"),
     *                  @OA\Property(property="balance", type="number"),
     *                  @OA\Property(property="avatar", type="string")
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error - email sudah digunakan",
     *          @OA\JsonContent(ref="#/components/schemas/ValidationError")
     *      )
     * )
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        Log::info('Profile updated', ['user_id' => $user->id, 'changes' => $validated]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'balance' => $user->balance,
                'avatar' => $user->avatar ?: 'default-avatar.png',
            ]
        ]);
    }

    /**
     * @OA\Put(
     *      path="/api/profile/password",
     *      operationId="updatePassword",
     *      tags={"Profile"},
     *      summary="Update password",
     *      description="Mengubah password user dengan verifikasi password lama",
     *      security={{"sanctum":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"current_password","new_password","new_password_confirmation"},
     *              @OA\Property(property="current_password", type="string", format="password", example="oldpassword123"),
     *              @OA\Property(property="new_password", type="string", format="password", minLength=8, example="newpassword123"),
     *              @OA\Property(property="new_password_confirmation", type="string", format="password", example="newpassword123")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Password updated successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Password berhasil diperbarui!")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error - password lama salah atau password baru tidak match",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Password lama tidak sesuai."),
     *              @OA\Property(
     *                  property="errors",
     *                  type="object",
     *                  @OA\Property(
     *                      property="current_password",
     *                      type="array",
     *                      @OA\Items(type="string", example="Password lama tidak sesuai.")
     *                  )
     *              )
     *          )
     *      )
     * )
     */
    public function updatePassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            $user = $request->user();

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Password lama tidak sesuai.',
                    'errors' => ['current_password' => ['Password lama tidak sesuai.']]
                ], 422);
            }

            $user->update(['password' => Hash::make($validated['new_password'])]);

            Log::info('Password updated', ['user_id' => $user->id]);

            return response()->json(['message' => 'Password berhasil diperbarui!']);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * @OA\Post(
     *      path="/api/profile/topup",
     *      operationId="topupBalance",
     *      tags={"Profile"},
     *      summary="Top up balance",
     *      description="Menambah saldo SkyRX user (minimum 10.000, maksimum 10.000.000)",
     *      security={{"sanctum":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"amount"},
     *              @OA\Property(
     *                  property="amount",
     *                  type="number",
     *                  format="float",
     *                  minimum=10000,
     *                  maximum=10000000,
     *                  example=100000,
     *                  description="Jumlah top up (min: 10.000, max: 10.000.000)"
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Top up successful",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Top up berhasil!"),
     *              @OA\Property(property="balance", type="number", format="float", example=250000)
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error - amount di luar range",
     *          @OA\JsonContent(ref="#/components/schemas/ValidationError")
     *      )
     * )
     */
    public function topup(Request $request)
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:10000|max:10000000',
            ]);

            $user = $request->user();
            $balanceBefore = $user->balance;
            $balanceAfter = $balanceBefore + $validated['amount'];

            $user->update(['balance' => $balanceAfter]);

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'topup',
                'amount' => $validated['amount'],
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => 'Top up saldo'
            ]);

            return response()->json([
                'message' => 'Top up berhasil!',
                'balance' => $balanceAfter
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * @OA\Get(
     *      path="/api/profile/transactions",
     *      operationId="getTransactions",
     *      tags={"Profile"},
     *      summary="Get transaction history",
     *      description="Mendapatkan riwayat transaksi user (top up, payment, refund) dengan pagination",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="page",
     *          in="query",
     *          description="Page number",
     *          required=false,
     *          @OA\Schema(type="integer", example=1)
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(property="current_page", type="integer", example=1),
     *              @OA\Property(
     *                  property="data",
     *                  type="array",
     *                  @OA\Items(ref="#/components/schemas/Transaction")
     *              ),
     *              @OA\Property(property="per_page", type="integer", example=20),
     *              @OA\Property(property="total", type="integer", example=45)
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function transactions(Request $request)
    {
        $transactions = $request->user()
            ->transactions()
            ->with('order.product')
            ->latest()
            ->paginate(20);

        return response()->json($transactions);
    }

    /**
     * @OA\Post(
     *      path="/api/profile/avatar",
     *      operationId="uploadAvatar",
     *      tags={"Profile"},
     *      summary="Upload avatar",
     *      description="Upload foto profil user (jpeg, png, jpg, max 2MB)",
     *      security={{"sanctum":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\MediaType(
     *              mediaType="multipart/form-data",
     *              @OA\Schema(
     *                  required={"avatar"},
     *                  @OA\Property(
     *                      property="avatar",
     *                      type="string",
     *                      format="binary",
     *                      description="Image file (jpeg, png, jpg, max 2MB)"
     *                  )
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Avatar uploaded successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Avatar berhasil diupload!"),
     *              @OA\Property(property="avatar", type="string", example="1640000000_1.jpg"),
     *              @OA\Property(property="avatar_url", type="string", example="http://localhost:8000/storage/avatar/1640000000_1.jpg")
     *          )
     *      ),
     *      @OA\Response(
     *          response=400,
     *          description="Bad request - file tidak ditemukan atau tidak valid",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="File tidak ditemukan")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error - file bukan image atau terlalu besar",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Validation failed"),
     *              @OA\Property(
     *                  property="errors",
     *                  type="object",
     *                  @OA\Property(
     *                      property="avatar",
     *                      type="array",
     *                      @OA\Items(type="string", example="The avatar must be an image.")
     *                  )
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=500,
     *          description="Server error - gagal menyimpan file",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Gagal mengupload avatar: error message")
     *          )
     *      )
     * )
     */
    public function uploadAvatar(Request $request)
    {
        try {
            // Validasi file
            $request->validate([
                'avatar' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            $user = $request->user();

            if (!$request->hasFile('avatar')) {
                return response()->json(['message' => 'File tidak ditemukan'], 400);
            }

            $file = $request->file('avatar');

            if (!$file->isValid()) {
                return response()->json(['message' => 'File tidak valid'], 400);
            }

            // Hapus avatar lama jika ada (kecuali default)
            if ($user->avatar && $user->avatar !== 'default-avatar.png') {
                $oldPath = storage_path('app/public/avatar/' . $user->avatar);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                    Log::info('Old avatar deleted', ['path' => $oldPath]);
                }
            }

            // Generate nama file unik
            $fileName = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();
            
            // Path tujuan
            $destinationPath = storage_path('app/public/avatar');
            
            // Pastikan folder ada
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
                Log::info('Created directory', ['path' => $destinationPath]);
            }

            // Pindahkan file dengan move() bawaan PHP
            $moved = $file->move($destinationPath, $fileName);

            if (!$moved) {
                Log::error('Failed to move file');
                return response()->json(['message' => 'Gagal menyimpan file'], 500);
            }

            // Verifikasi file benar-benar tersimpan
            $fullPath = $destinationPath . DIRECTORY_SEPARATOR . $fileName;
            if (!file_exists($fullPath)) {
                Log::error('File not found after move', ['path' => $fullPath]);
                return response()->json(['message' => 'File tidak tersimpan'], 500);
            }

            Log::info('File saved successfully', [
                'path' => $fullPath,
                'size' => filesize($fullPath),
                'exists' => file_exists($fullPath)
            ]);

            // Update database
            $user->update(['avatar' => $fileName]);

            Log::info('Avatar uploaded successfully', [
                'user_id' => $user->id,
                'avatar' => $fileName,
                'full_path' => $fullPath
            ]);

            return response()->json([
                'message' => 'Avatar berhasil diupload!',
                'avatar' => $fileName,
                'avatar_url' => url('storage/avatar/' . $fileName)
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Avatar upload error', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);
            return response()->json([
                'message' => 'Gagal mengupload avatar: ' . $e->getMessage(),
            ], 500);
        }
    }
}