<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\XenditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    protected $xenditService;

    public function __construct(XenditService $xenditService)
    {
        $this->xenditService = $xenditService;
    }

    /**
     * @OA\Get(
     *      path="/api/orders",
     *      operationId="getOrdersList",
     *      tags={"Orders"},
     *      summary="Get list of orders",
     *      description="Admin: lihat semua order | User: lihat order milik sendiri",
     *      security={{"sanctum":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/Order")
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function index()
    {
        $user = Auth::user();

        // Admin: lihat semua order
        if ($user->role === 'admin') {
            return response()->json(
                Order::with(['items.product', 'user'])
                    ->latest()
                    ->get()
            );
        }

        // User biasa
        return response()->json(
            $user->orders()
                ->with('items.product')
                ->latest()
                ->get()
        );
    }

    /**
     * @OA\Post(
     *      path="/api/orders",
     *      operationId="createOrder",
     *      tags={"Orders"},
     *      summary="Create new order",
     *      description="Membuat pesanan baru dengan payment method (xendit atau balance)",
     *      security={{"sanctum":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"items","payment_method"},
     *              @OA\Property(
     *                  property="items",
     *                  type="array",
     *                  @OA\Items(
     *                      required={"product_id","quantity"},
     *                      @OA\Property(property="product_id", type="integer", example=1),
     *                      @OA\Property(property="quantity", type="integer", minimum=1, example=2)
     *                  )
     *              ),
     *              @OA\Property(
     *                  property="payment_method",
     *                  type="string",
     *                  enum={"xendit", "balance"},
     *                  example="xendit",
     *                  description="xendit: bayar via Xendit payment gateway | balance: bayar dengan saldo SkyRX"
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Order created successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Order berhasil dibuat"),
     *              @OA\Property(property="order", ref="#/components/schemas/Order"),
     *              @OA\Property(property="payment_url", type="string", nullable=true, example="https://checkout.xendit.co/web/abc123")
     *          )
     *      ),
     *      @OA\Response(
     *          response=400,
     *          description="Bad request - stok tidak cukup atau saldo kurang",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Stok produk Samsung Galaxy S23 tidak cukup")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error"
     *      )
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|in:xendit,balance',
        ]);

        $user = Auth::user();
        $itemsInput = $request->items;

        $productIds = collect($itemsInput)->pluck('product_id')->unique()->toArray();
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $totalPrice = 0;
        $xenditItems = [];

        foreach ($itemsInput as $item) {
            $pid = $item['product_id'];
            $qty = $item['quantity'];

            if (!isset($products[$pid])) {
                return response()->json(['message' => 'Produk tidak ditemukan'], 400);
            }

            $product = $products[$pid];

            if ($product->stock < $qty) {
                return response()->json(['message' =>
                    "Stok produk {$product->name} tidak cukup"
                ], 400);
            }

            $lineTotal = $product->price * $qty;
            $totalPrice += $lineTotal;

            $xenditItems[] = [
                'name' => $product->name,
                'quantity' => $qty,
                'price' => (float)$product->price,
            ];
        }

        DB::beginTransaction();

        try {
            $order = Order::create([
                'user_id' => $user->id,
                'total_price' => $totalPrice,
                'payment_method' => $request->payment_method,
                'payment_status' => 'pending',
                'status' => 'pending',
            ]);

            foreach ($itemsInput as $item) {
                $product = $products[$item['product_id']];
                $qty = $item['quantity'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'price' => $product->price,
                    'total_price' => $product->price * $qty,
                ]);
            }

            // Jika pakai Xendit
            if ($request->payment_method === 'xendit') {
                $externalId = 'ORDER_' . $order->id . '_' . rand(1000, 9999);

                $invoice = $this->xenditService->createInvoice([
                    'external_id' => $externalId,
                    'amount' => (float)$totalPrice,
                    'payer_email' => $user->email,
                    'description' => 'Pembayaran Order #' . $order->id,
                    'items' => $xenditItems,
                ]);

                $order->update([
                    'invoice_id' => $invoice['id'] ?? null,
                    'invoice_url' => $invoice['invoice_url'] ?? null,
                ]);

                DB::commit();

                return response()->json([
                    'message' => 'Order berhasil dibuat',
                    'order' => $order->load('items.product'),
                    'payment_url' => $invoice['invoice_url'] ?? null,
                ], 201);
            }

            // Pembayaran SALDO
            if ($user->balance < $totalPrice) {
                DB::rollBack();
                return response()->json(['message' => 'Saldo tidak mencukupi'], 400);
            }

            $user->decrement('balance', $totalPrice);

            foreach ($itemsInput as $item) {
                $product = $products[$item['product_id']];
                $product->decrement('stock', $item['quantity']);
            }

            $order->update([
                'payment_status' => 'paid',
                'status' => 'processing',
                'paid_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Order berhasil dibuat dan dibayar',
                'order' => $order->load('items.product'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Get(
     *      path="/api/orders/{order}",
     *      operationId="getOrderById",
     *      tags={"Orders"},
     *      summary="Get order by ID",
     *      description="Mendapatkan detail pesanan. User hanya bisa lihat order sendiri, Admin bisa lihat semua",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="order",
     *          in="path",
     *          required=true,
     *          @OA\Schema(type="integer", example=1)
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/Order")
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Forbidden - not your order"
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Order not found"
     *      )
     * )
     */
    public function show(Order $order)
    {
        if ($order->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($order->load(['items.product', 'user']));
    }

    /**
     * @OA\Delete(
     *      path="/api/orders/{order}",
     *      operationId="deleteOrder",
     *      tags={"Orders"},
     *      summary="Delete order",
     *      description="Menghapus pesanan. User hanya bisa hapus order sendiri, Admin bisa hapus semua",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="order",
     *          in="path",
     *          required=true,
     *          @OA\Schema(type="integer", example=1)
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Order deleted successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Order dihapus")
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Forbidden"
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Order not found"
     *      )
     * )
     */
    public function destroy(Order $order)
    {
        if ($order->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $order->delete();
        return response()->json(['message' => 'Order dihapus']);
    }

    /**
     * @OA\Post(
     *      path="/api/orders/{order}/check-payment",
     *      operationId="checkPaymentStatus",
     *      tags={"Orders"},
     *      summary="Check payment status from Xendit",
     *      description="Mengecek status pembayaran order yang menggunakan Xendit. Jika sudah paid, otomatis update stok dan status order",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="order",
     *          in="path",
     *          required=true,
     *          @OA\Schema(type="integer", example=1)
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Payment status checked",
     *          @OA\JsonContent(
     *              @OA\Property(property="order", ref="#/components/schemas/Order"),
     *              @OA\Property(property="invoice_status", type="string", enum={"PENDING", "PAID", "EXPIRED"}, example="PAID")
     *          )
     *      ),
     *      @OA\Response(
     *          response=400,
     *          description="Order tidak menggunakan Xendit"
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Forbidden"
     *      )
     * )
     */
    public function checkPaymentStatus(Order $order)
    {
        if ($order->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$order->invoice_id) {
            return response()->json(['message' => 'Order tidak menggunakan Xendit'], 400);
        }

        try {
            $invoice = $this->xenditService->getInvoice($order->invoice_id);

            if (($invoice['status'] ?? null) === 'PAID' && $order->payment_status !== 'paid') {

                foreach ($order->items as $item) {
                    $product = $item->product;
                    if ($product && $product->stock >= $item->quantity) {
                        $product->decrement('stock', $item->quantity);
                    }
                }

                $order->update([
                    'payment_status' => 'paid',
                    'status' => 'processing',
                    'paid_at' => $invoice['paid_at'] ?? now()
                ]);
            }

            return response()->json([
                'order' => $order->fresh()->load('items.product'),
                'invoice_status' => $invoice['status'] ?? null,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *      path="/api/orders/{order}/pay",
     *      operationId="payOrder",
     *      tags={"Orders"},
     *      summary="Pay for order",
     *      description="Melakukan pembayaran order dengan metode SkyRX Balance atau Xendit (Bank/E-wallet)",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="order",
     *          in="path",
     *          required=true,
     *          @OA\Schema(type="integer", example=1)
     *      ),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"method"},
     *              @OA\Property(
     *                  property="method",
     *                  type="string",
     *                  enum={"SkyRX", "BCA", "MANDIRI", "BNI", "BRI", "DANA", "OVO", "SHOPEEPAY"},
     *                  example="BCA",
     *                  description="Payment method: SkyRX (balance) atau Xendit payment channels"
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Payment successful atau invoice created",
     *          @OA\JsonContent(
     *              @OA\Property(property="success", type="boolean", example=true),
     *              @OA\Property(property="message", type="string", example="Pembayaran berhasil"),
     *              @OA\Property(property="order", ref="#/components/schemas/Order"),
     *              @OA\Property(property="payment_url", type="string", nullable=true, example="https://checkout.xendit.co/web/abc123")
     *          )
     *      ),
     *      @OA\Response(
     *          response=400,
     *          description="Bad request - order sudah paid atau saldo kurang",
     *          @OA\JsonContent(
     *              @OA\Property(property="success", type="boolean", example=false),
     *              @OA\Property(property="message", type="string", example="Saldo SkyRX tidak mencukupi")
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Forbidden"
     *      )
     * )
     */
    public function pay(Request $request, Order $order)
    {
        if ($order->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Order sudah dibayar'], 400);
        }

        $request->validate([
            'method' => 'required|string'
        ]);

        $user = Auth::user();
        $method = $request->method;

        DB::beginTransaction();

        try {
            // PAY WITH BALANCE
            if ($method === 'SkyRX') {
                if ($user->balance < $order->total_price) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Saldo SkyRX tidak mencukupi'
                    ], 400);
                }

                $user->decrement('balance', $order->total_price);

                foreach ($order->items as $item) {
                    $product = $item->product;
                    if ($product && $product->stock >= $item->quantity) {
                        $product->decrement('stock', $item->quantity);
                    }
                }

                $order->update([
                    'payment_method' => 'balance',
                    'payment_status' => 'paid',
                    'status' => 'processing',
                    'paid_at' => now(),
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Pembayaran berhasil',
                    'order' => $order->fresh()->load('items.product'),
                ]);
            }

            // PAY WITH XENDIT
            if (in_array($method, ['BCA', 'MANDIRI', 'BNI', 'BRI', 'DANA', 'OVO', 'SHOPEEPAY'])) {

                if ($order->invoice_url) {
                    DB::commit();
                    return response()->json([
                        'success' => true,
                        'message' => 'Silakan lanjutkan pembayaran',
                        'payment_url' => $order->invoice_url,
                    ]);
                }

                $externalId = 'ORDER_' . $order->id . '_' . rand(1000, 9999);

                $xenditItems = [];
                foreach ($order->items as $item) {
                    $xenditItems[] = [
                        'name' => $item->product->name,
                        'quantity' => $item->quantity,
                        'price' => (float)$item->price,
                    ];
                }

                $invoice = $this->xenditService->createInvoice([
                    'external_id' => $externalId,
                    'amount' => (float)$order->total_price,
                    'payer_email' => $user->email,
                    'description' => 'Pembayaran Order #' . $order->id,
                    'items' => $xenditItems,
                ]);

                $order->update([
                    'payment_method' => 'xendit',
                    'invoice_id' => $invoice['id'] ?? null,
                    'invoice_url' => $invoice['invoice_url'] ?? null,
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Invoice berhasil dibuat',
                    'payment_url' => $invoice['invoice_url'],
                ]);
            }

            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Metode pembayaran tidak valid'], 400);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *      path="/api/orders/{order}/status",
     *      operationId="getOrderStatus",
     *      tags={"Orders"},
     *      summary="Get order status",
     *      description="Mendapatkan status pesanan dan pembayaran",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="order",
     *          in="path",
     *          required=true,
     *          @OA\Schema(type="integer", example=1)
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(property="order", ref="#/components/schemas/Order"),
     *              @OA\Property(property="status", type="string", enum={"pending", "processing", "completed", "cancelled"}, example="processing"),
     *              @OA\Property(property="payment_status", type="string", enum={"pending", "paid", "failed"}, example="paid"),
     *              @OA\Property(property="paid_at", type="string", format="date-time", nullable=true)
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Forbidden"
     *      )
     * )
     */
    public function getStatus(Order $order)
    {
        // Check authorization
        if ($order->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'order' => $order->load('items.product'),
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'paid_at' => $order->paid_at,
        ]);
    }
}