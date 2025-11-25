<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Order::with(['user', 'items.product'])
                ->orderBy('created_at', 'desc');

            // Filter status
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter payment status
            if ($request->filled('payment_status') && $request->payment_status !== 'all') {
                $query->where('payment_status', $request->payment_status);
            }

            // Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($uq) use ($search) {
                          $uq->where('name', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Pagination
            $orders = ($request->paginate === "false")
                ? $query->get()
                : $query->paginate($request->per_page ?? 20);

            return response()->json($orders);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error loading orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Order $order)
    {
        try {
            $order->load(['user', 'items.product']);

            return response()->json([
                'order' => $order
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error loading order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateStatus(Request $request, Order $order)
{
    $request->validate([
        'status' => 'required|in:pending,processing,completed,cancelled'
    ]);

    try {
        $order->update([
            'status' => $request->status
        ]);

        return response()->json([
            'message' => 'Status order berhasil diperbarui',
            'order' => $order->fresh()->load(['user', 'items.product'])
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error: ' . $e->getMessage()
        ], 500);
    }
}

    public function destroy(Order $order)
    {
        try {
            $order->items()->delete();
            $order->delete();

            return response()->json([
                'message' => 'Order deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting order',
                'error' => $e->getMessage()
            ], 500);
        }
    }


}
