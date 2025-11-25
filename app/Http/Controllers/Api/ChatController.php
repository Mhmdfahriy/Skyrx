<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * @OA\Post(
     *      path="/api/chat",
     *      operationId="sendChatMessage",
     *      tags={"Chat"},
     *      summary="Send chat message to AI",
     *      description="Mengirim pesan chat ke AI Customer Service (Gemini) yang akan memberikan informasi produk dan bantuan",
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"message"},
     *              @OA\Property(
     *                  property="message",
     *                  type="string",
     *                  maxLength=1000,
     *                  example="Halo, produk apa saja yang sedang promo?"
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Chat message processed successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Halo, produk apa saja yang sedang promo?"),
     *              @OA\Property(
     *                  property="response",
     *                  type="string",
     *                  example="Halo, selamat datang di MinSkyrx! Berikut beberapa produk yang sedang promo:\nSamsung Galaxy S23 - Rp 12.999.000\niPhone 14 Pro - Rp 16.999.000"
     *              ),
     *              @OA\Property(property="created_at", type="string", format="date-time", example="2024-01-15T10:30:00.000000Z")
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
     *                      property="message",
     *                      type="array",
     *                      @OA\Items(type="string", example="The message field is required.")
     *                  )
     *              )
     *          )
     *      )
     * )
     */
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000'
        ]);

        $message = $validated['message'];
        $userId = $request->user()?->id;

        // Jika pertanyaan berisi kata "promo" atau "diskon", gunakan jawaban khusus
        if ($this->isPromoQuestion($message)) {
            $response = $this->getPromoResponse();
        } else {
            // Ambil context dari database
            $context = $this->getContextFromDatabase();

            // Panggil Gemini API
            $response = $this->callGeminiAPI($message, $context);
        }

        // Tambahkan prefix MinSkyrx jika belum ada ucapan selamat datang
        $response = $this->prependMinSkyrx($response);

        // Simpan chat history jika user login
        if ($userId) {
            ChatHistory::create([
                'user_id' => $userId,
                'message' => $message,
                'response' => $response
            ]);
        }

        return response()->json([
            'message' => $message,
            'response' => $response,
            'created_at' => now()
        ]);
    }

    /**
 * @OA\Get(
 *     path="/chat/history",
 *     summary="Get user chat history",
 *     tags={"Chat"},
 *
 *     @OA\Response(
 *         response=200,
 *         description="List chat history",
 *         @OA\JsonContent(
 *             type="array",
 *             @OA\Items(ref="#/components/schemas/ChatHistory")
 *         )
 *     )
 * )
 */
    public function history(Request $request)
    {
        if ($request->user()) {
            $history = ChatHistory::where('user_id', $request->user()->id)
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();
        } else {
            $history = [];
        }

        return response()->json($history);
    }

    /**
     * @OA\Delete(
     *      path="/api/chat/history",
     *      operationId="deleteChatHistory",
     *      tags={"Chat"},
     *      summary="Delete all chat history",
     *      description="Menghapus semua riwayat chat user yang sedang login",
     *      security={{"sanctum":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Chat history cleared successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Chat history cleared successfully")
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthorized",
     *          @OA\JsonContent(
     *              @OA\Property(property="error", type="string", example="Unauthorized")
     *          )
     *      )
     * )
     */
    public function clearHistory(Request $request)
    {
        if ($request->user()) {
            ChatHistory::where('user_id', $request->user()->id)->delete();
            return response()->json(['message' => 'Chat history cleared successfully']);
        }

        return response()->json(['error' => 'Unauthorized'], 401);
    }

    private function isPromoQuestion($message)
    {
        $messageLower = strtolower($message);
        return str_contains($messageLower, 'promo') || str_contains($messageLower, 'diskon');
    }

    private function getPromoResponse()
    {
        $products = Product::where('stock', '>', 0)
            ->whereNotNull('price')
            ->take(10)
            ->get();

        if ($products->isEmpty()) {
            return "Saat ini tidak ada produk promo.";
        }

        $lines = [];
        foreach ($products as $p) {
            $lines[] = "{$p->name} - Rp " . number_format($p->price, 0, ',', '.');
        }

        return "Berikut beberapa produk yang sedang promo:\n" . implode("\n", $lines);
    }

    private function prependMinSkyrx($text)
    {
        $prefix = "Halo, selamat datang di MinSkyrx! ";

        // Jangan prepend jika teks sudah ada ucapan selamat datang
        if (!str_contains(strtolower($text), 'selamat datang')) {
            $text = $prefix . $text;
        }

        return $text;
    }

    private function getContextFromDatabase()
    {
        $products = Product::select('name', 'description', 'price', 'stock', 'category')
            ->where('stock', '>', 0)
            ->get();
        
        $categories = Product::distinct()->pluck('category')->toArray();

        $context = "Anda adalah Customer Service profesional untuk toko e-commerce.\n\n";
        $context .= "INFORMASI PRODUK:\n";
        $context .= "Kategori: " . implode(', ', $categories) . "\n\n";

        foreach ($products as $product) {
            $context .= "- {$product->name}\n";
            $context .= "  Kategori: {$product->category}\n";
            $context .= "  Harga: Rp " . number_format($product->price, 0, ',', '.') . "\n";
            $context .= "  Stok: {$product->stock} unit\n";
            $context .= "  Deskripsi: {$product->description}\n\n";
        }

        $context .= "\nPANDUAN:\n";
        $context .= "- Jawab dalam Bahasa Indonesia yang sopan dan profesional\n";
        $context .= "- Format jawaban harus RAPI dan MUDAH DIBACA\n";
        $context .= "- JANGAN gunakan markdown (*,**) atau bullet point kompleks\n";
        $context .= "- Gunakan format sederhana dengan line break yang jelas\n";
        $context .= "- Jika tanya daftar produk, tampilkan dalam format sederhana tanpa formatting berlebihan\n";
        $context .= "- Gunakan emoji secukupnya (1-2 emoji maksimal)\n";
        $context .= "- Jangan menambahkan ucapan selamat datang sendiri; backend yang menambahkan MinSkyrx\n";
        $context .= "- Fokus pada informasi yang ditanyakan\n";

        return $context;
    }

    private function callGeminiAPI($message, $context)
    {
        $apiKey = env('GEMINI_API_KEY');
        
        if (!$apiKey) {
            Log::error('Gemini API key not configured');
            return 'API key tidak dikonfigurasi.';
        }

        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";
            
            $data = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $context . "\n\nPertanyaan Customer: " . $message]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.5,
                    'maxOutputTokens' => 400,
                ]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($curlError) {
                Log::error('CURL Error', ['error' => $curlError]);
                return 'Maaf, terjadi kesalahan koneksi.';
            }

            if ($httpCode == 200) {
                $json = json_decode($response, true);
                
                if (isset($json['candidates'][0]['content']['parts'][0]['text'])) {
                    $aiResponse = $json['candidates'][0]['content']['parts'][0]['text'];
                    $aiResponse = $this->cleanupResponse($aiResponse);
                    return $aiResponse;
                }
            }

            Log::error('Gemini API Error', [
                'http_code' => $httpCode,
                'response' => $response
            ]);

            return 'Maaf, tidak dapat memproses permintaan.';

        } catch (\Exception $e) {
            Log::error('Gemini API Exception', ['message' => $e->getMessage()]);
            return 'Maaf, terjadi kesalahan sistem.';
        }
    }

    private function cleanupResponse($text)
    {
        $text = preg_replace('/\*\*(.*?)\*\*/', '$1', $text);
        $text = preg_replace('/\*(.*?)\*/', '$1', $text);
        $text = preg_replace('/^\s*[\*\-]\s+/m', '• ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        return trim($text);
    }
}