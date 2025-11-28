<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * @OA\Get(
     *      path="/api/payment/methods",
     *      operationId="getPaymentMethods",
     *      tags={"Payment"},
     *      summary="Get available payment methods",
     *      description="Returns list of available payment methods",
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(property="virtualAccount", type="array", @OA\Items(
     *                  @OA\Property(property="id", type="string", example="BCA"),
     *                  @OA\Property(property="name", type="string", example="BCA"),
     *                  @OA\Property(property="logo", type="string", example="http://localhost/Payments/BCA-icon.svg"),
     *                  @OA\Property(property="popular", type="boolean", example=true)
     *              )),
     *              @OA\Property(property="ewallet", type="array", @OA\Items(
     *                  @OA\Property(property="id", type="string", example="DANA"),
     *                  @OA\Property(property="name", type="string", example="DANA"),
     *                  @OA\Property(property="logo", type="string", example="http://localhost/Payments/Dana-icon.svg")
     *              )),
     *              @OA\Property(property="Point", type="array", @OA\Items(
     *                  @OA\Property(property="id", type="string", example="SkyRX"),
     *                  @OA\Property(property="name", type="string", example="SkyRX ID"),
     *                  @OA\Property(property="logo", type="string", example="http://localhost/Payments/SkyRX-icon.svg")
     *              ))
     *          )
     *      )
     * )
     */
    public function getPaymentMethods()
{
    // Gunakan asset() helper untuk path yang benar
    $baseUrl = asset('Payments');

    $methods = [
        'virtualAccount' => [
            [
                'id' => 'BCA',
                'name' => 'BCA',
                'logo' => $baseUrl . '/BCA-icon.svg',
                'popular' => true,
            ],
            [
                'id' => 'MANDIRI',
                'name' => 'Mandiri',
                'logo' => $baseUrl . '/Mandiri-icon.svg',
            ],
            [
                'id' => 'BNI',
                'name' => 'BNI',
                'logo' => $baseUrl . '/BNI-icon.svg',
            ],
            [
                'id' => 'BRI',
                'name' => 'BRI',
                'logo' => $baseUrl . '/BRI-icon.svg',
            ],
        ],
        'ewallet' => [
            [
                'id' => 'DANA',
                'name' => 'DANA',
                'logo' => $baseUrl . '/Dana-icon.svg',
            ],
            [
                'id' => 'OVO',
                'name' => 'OVO',
                'logo' => $baseUrl . '/Ovo-icon.svg',
            ],
            [
                'id' => 'SHOPEEPAY',
                'name' => 'ShopeePay',
                'logo' => $baseUrl . '/ShopeePay-icon.svg',
            ],
        ],
        'Point' => [
            [
                'id' => 'SkyRX',
                'name' => 'SkyRX ID',
                'logo' => $baseUrl . '/SkyRX-icon.svg',
            ],
        ],
    ];

    return response()->json($methods);
}

    /**
     * @OA\Post(
     *      path="/api/payment/simulate/{invoice_number}",
     *      operationId="simulatePayment",
     *      tags={"Payment"},
     *      summary="Simulate Xendit payment",
     *      description="Simulate pembayaran untuk QA testing. Copy invoice_id dari order lalu paste di sini",
     *      @OA\Parameter(
     *          name="invoice_number",
     *          in="path",
     *          description="Invoice ID dari Xendit",
     *          required=true,
     *          @OA\Schema(type="string", example="69269a49cd1cd15c100f1d18")
     *      ),
     *      @OA\RequestBody(
     *          required=false,
     *          description="Optional simulation parameters",
     *          @OA\JsonContent(
     *              @OA\Property(property="simulate_delay", type="boolean", example=false, description="Simulate processing delay"),
     *              @OA\Property(property="force_status", type="string", example="paid", description="Force specific status")
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Payment simulated successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="success", type="boolean", example=true),
     *              @OA\Property(property="message", type="string", example="Payment simulation successful"),
     *              @OA\Property(
     *                  property="order",
     *                  type="object",
     *                  @OA\Property(property="id", type="integer", example=15),
     *                  @OA\Property(property="invoice_id", type="string", example="69269a49cd1cd15c100f1d18"),
     *                  @OA\Property(property="payment_status", type="string", example="paid"),
     *                  @OA\Property(property="status", type="string", example="processing"),
     *                  @OA\Property(property="paid_at", type="string", format="date-time")
     *              )
     *          )
     *      )
     * )
     */

    public function simulate($invoiceNumber, Request $request)
    {
        // Set timeout untuk prevent hanging
        set_time_limit(30);
        
        try {
            // Optional: Simulate delay if requested
            if ($request->get('simulate_delay', false)) {
                sleep(2);
            }

            // Cari order
            $order = Order::where('invoice_id', $invoiceNumber)->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found',
                    'invoice_id' => $invoiceNumber
                ], 404);
            }

            // Cek apakah sudah dibayar
            if ($order->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment already processed',
                    'order_id' => $order->id,
                    'current_status' => $order->payment_status
                ], 400);
            }

            // Update payment status
            $order->payment_status = 'paid';
            $order->status = 'processing';
            $order->paid_at = now();
            $order->save();

            // Kurangi stok (tanpa load relationship dulu)
            $items = DB::table('order_items')
                ->where('order_id', $order->id)
                ->get();

            foreach ($items as $item) {
                DB::table('products')
                    ->where('id', $item->product_id)
                    ->where('stock', '>=', $item->quantity)
                    ->decrement('stock', $item->quantity);
            }

            // Log successful simulation
            Log::info('Payment simulation successful', [
                'order_id' => $order->id,
                'invoice_id' => $invoiceNumber,
                'simulated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment simulation successful',
                'order' => [
                    'id' => $order->id,
                    'invoice_id' => $order->invoice_id,
                    'payment_status' => $order->payment_status,
                    'status' => $order->status,
                    'paid_at' => $order->paid_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Payment simulation failed', [
                'invoice_id' => $invoiceNumber,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Simulation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}