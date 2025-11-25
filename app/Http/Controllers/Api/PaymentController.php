<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * @OA\Get(
     *      path="/api/payment-methods",
     *      operationId="getPaymentMethods",
     *      tags={"Payment"},
     *      summary="Get available payment methods",
     *      description="Mendapatkan daftar metode pembayaran yang tersedia (Virtual Account, E-wallet, dan SkyRX Balance). Untuk SkyRX langsung dibayar, untuk Bank/E-wallet perlu simulasi payment via /payment/simulate/{invoice_id}",
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(
     *                  property="virtualAccount",
     *                  type="array",
     *                  description="Virtual Account payment methods (butuh simulasi payment)",
     *                  @OA\Items(
     *                      @OA\Property(property="id", type="string", example="BCA"),
     *                      @OA\Property(property="name", type="string", example="BCA"),
     *                      @OA\Property(property="logo", type="string", example="http://localhost:8000/Payments/BCA-icon.svg"),
     *                      @OA\Property(property="popular", type="boolean", example=true)
     *                  )
     *              ),
     *              @OA\Property(
     *                  property="ewallet",
     *                  type="array",
     *                  description="E-wallet payment methods (butuh simulasi payment)",
     *                  @OA\Items(
     *                      @OA\Property(property="id", type="string", example="DANA"),
     *                      @OA\Property(property="name", type="string", example="DANA"),
     *                      @OA\Property(property="logo", type="string", example="http://localhost:8000/Payments/Dana-icon.svg")
     *                  )
     *              ),
     *              @OA\Property(
     *                  property="Point",
     *                  type="array",
     *                  description="Point/Balance payment methods (langsung sukses)",
     *                  @OA\Items(
     *                      @OA\Property(property="id", type="string", example="SkyRX"),
     *                      @OA\Property(property="name", type="string", example="SkyRX ID"),
     *                      @OA\Property(property="logo", type="string", example="http://localhost:8000/Payments/SkyRX-icon.svg")
     *                  )
     *              )
     *          )
     *      )
     * )
     */
    public function getPaymentMethods()
    {
        $baseUrl = url('/Payments/');

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
     *      path="/payment/simulate/{invoice_number}",
     *      operationId="simulatePayment",
     *      tags={"Payment"},
     *      summary="Simulate Xendit payment (Bank/E-wallet)",
     *      description="Simulate pembayaran untuk Bank Transfer dan E-wallet. Gunakan invoice_id yang didapat dari response POST /api/orders/{order}/pay. Endpoint ini hanya untuk testing, di production akan otomatis dari Xendit webhook.",
     *      @OA\Parameter(
     *          name="invoice_number",
     *          in="path",
     *          description="Invoice ID dari Xendit (didapat dari response order->invoice_id)",
     *          required=true,
     *          @OA\Schema(type="string", example="692551709101a99ffd9eebae")
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Payment simulated successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Payment simulation successful"),
     *              @OA\Property(
     *                  property="order",
     *                  type="object",
     *                  @OA\Property(property="id", type="integer", example=34),
     *                  @OA\Property(property="payment_status", type="string", example="paid"),
     *                  @OA\Property(property="status", type="string", example="processing"),
     *                  @OA\Property(property="paid_at", type="string", format="date-time")
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Invoice not found",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Invoice not found")
     *          )
     *      ),
     *      @OA\Response(
     *          response=400,
     *          description="Payment already processed",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Payment already processed")
     *          )
     *      )
     * )
     */
    public function simulate($invoiceNumber)
    {
        // Cari order berdasarkan invoice_id
        $order = Order::where('invoice_id', $invoiceNumber)->first();

        if (!$order) {
            return response()->json([
                'message' => 'Invoice not found'
            ], 404);
        }

        // Cek apakah sudah dibayar
        if ($order->payment_status === 'paid') {
            return response()->json([
                'message' => 'Payment already processed',
                'order' => $order->load('items.product')
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Update status pembayaran
            $order->update([
                'payment_status' => 'paid',
                'status' => 'processing',
                'paid_at' => now(),
            ]);

            // Kurangi stok produk
            foreach ($order->items as $item) {
                $product = $item->product;
                if ($product && $product->stock >= $item->quantity) {
                    $product->decrement('stock', $item->quantity);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Payment simulation successful',
                'order' => $order->fresh()->load('items.product')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Simulation failed: ' . $e->getMessage()
            ], 500);
        }
    }
}