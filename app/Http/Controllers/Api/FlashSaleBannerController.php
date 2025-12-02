<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FlashSaleBanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FlashSaleBannerController extends Controller
{
    /**
     * PUBLIC - Tampilkan banner aktif untuk customer
     */
    public function index()
    {
        $banners = FlashSaleBanner::active()
            ->ordered()
            ->get()
            ->map(function($banner) {
                if ($banner->image && !str_starts_with($banner->image, 'http')) {
                    $banner->image = url($banner->image);
                }
                return $banner;
            });

        return response()->json($banners);
    }

    /**
     * ADMIN - Tampilkan semua banner
     */
    public function adminIndex()
    {
        $banners = FlashSaleBanner::ordered()
            ->get()
            ->map(function($banner) {
                if ($banner->image && !str_starts_with($banner->image, 'http')) {
                    $banner->image = url($banner->image);
                }
                return $banner;
            });

        return response()->json($banners);
    }

    /**
     * ADMIN - Tambah banner baru (Support JSON Base64)
     */
    public function store(Request $request)
    {
        // Deteksi apakah pakai form-data atau JSON
        $isJson = $request->isJson() || $request->has('image_base64');

        if ($isJson) {
            // Validasi untuk JSON (base64)
            $validator = Validator::make($request->all(), [
                'title' => 'nullable|string|max:255',
                'subtitle' => 'nullable|string|max:255',
                'image_base64' => 'required|string',
                'order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Decode base64 dan simpan sebagai file
            $imageBase64 = $request->image_base64;
            
            // Hapus prefix data:image/...;base64, jika ada
            if (preg_match('/^data:image\/(\w+);base64,/', $imageBase64, $matches)) {
                $extension = $matches[1];
                $imageBase64 = substr($imageBase64, strpos($imageBase64, ',') + 1);
            } else {
                $extension = 'png'; // default
            }

            $imageData = base64_decode($imageBase64);
            $fileName = 'banner_' . time() . '_' . Str::random(10) . '.' . $extension;
            $filePath = 'flash-sale-banners/' . $fileName;
            
            Storage::disk('public')->put($filePath, $imageData);
            $imagePath = Storage::url($filePath);

        } else {
            // Validasi untuk form-data (file upload)
            $validator = Validator::make($request->all(), [
                'title' => 'nullable|string|max:255',
                'subtitle' => 'nullable|string|max:255',
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Upload file biasa
            if ($request->hasFile('image')) {
                $filePath = $request->file('image')->store('flash-sale-banners', 'public');
                $imagePath = Storage::url($filePath);
            } else {
                $imagePath = null;
            }
        }

        $banner = FlashSaleBanner::create([
            'title' => $request->title ?? null,
            'subtitle' => $request->subtitle ?? null,
            'image' => $imagePath,
            'order' => $request->order ?? 0,
            'is_active' => $request->is_active ?? true,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        if ($banner->image && !str_starts_with($banner->image, 'http')) {
            $banner->image = url($banner->image);
        }

        return response()->json([
            'message' => 'Banner berhasil ditambahkan',
            'data' => $banner
        ], 201);
    }

    /**
     * ADMIN - Update banner (Support JSON Base64)
     */
    public function update(Request $request, $id)
    {
        $banner = FlashSaleBanner::findOrFail($id);
        $isJson = $request->isJson() || $request->has('image_base64');

        if ($isJson) {
            // Validasi JSON - UBAH: title dan subtitle jadi nullable
            $validator = Validator::make($request->all(), [
                'title' => 'nullable|string|max:255',
                'subtitle' => 'nullable|string|max:255',
                'image_base64' => 'nullable|string',
                'order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update image jika ada base64
            if ($request->has('image_base64') && $request->image_base64) {
                // Hapus gambar lama
                if ($banner->image) {
                    $oldPath = str_replace('/storage/', '', $banner->image);
                    Storage::disk('public')->delete($oldPath);
                }

                // Decode dan simpan gambar baru
                $imageBase64 = $request->image_base64;
                
                if (preg_match('/^data:image\/(\w+);base64,/', $imageBase64, $matches)) {
                    $extension = $matches[1];
                    $imageBase64 = substr($imageBase64, strpos($imageBase64, ',') + 1);
                } else {
                    $extension = 'png';
                }

                $imageData = base64_decode($imageBase64);
                $fileName = 'banner_' . time() . '_' . Str::random(10) . '.' . $extension;
                $filePath = 'flash-sale-banners/' . $fileName;
                
                Storage::disk('public')->put($filePath, $imageData);
                $banner->image = Storage::url($filePath);
            }

        } else {
            // Validasi form-data
            $validator = Validator::make($request->all(), [
                'title' => 'nullable|string|max:255',
                'subtitle' => 'nullable|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update file jika ada
            if ($request->hasFile('image')) {
                if ($banner->image) {
                    $oldPath = str_replace('/storage/', '', $banner->image);
                    Storage::disk('public')->delete($oldPath);
                }

                $filePath = $request->file('image')->store('flash-sale-banners', 'public');
                $banner->image = Storage::url($filePath);
            }
        }

        // PERUBAHAN UTAMA DI SINI - Update field lainnya dengan input() untuk terima null
        if ($request->has('title')) {
            $banner->title = $request->input('title'); // Bisa null
        }
        if ($request->has('subtitle')) {
            $banner->subtitle = $request->input('subtitle'); // Bisa null
        }
        if ($request->has('order')) {
            $banner->order = $request->order;
        }
        if ($request->has('is_active')) {
            $banner->is_active = $request->is_active;
        }
        if ($request->has('start_date')) {
            $banner->start_date = $request->input('start_date'); // Bisa null
        }
        if ($request->has('end_date')) {
            $banner->end_date = $request->input('end_date'); // Bisa null
        }

        $banner->save();

        if ($banner->image && !str_starts_with($banner->image, 'http')) {
            $banner->image = url($banner->image);
        }

        return response()->json([
            'message' => 'Banner berhasil diupdate',
            'data' => $banner
        ]);
    }

    /**
     * ADMIN - Hapus banner
     */
    public function destroy($id)
    {
        $banner = FlashSaleBanner::findOrFail($id);

        if ($banner->image) {
            $imagePath = str_replace('/storage/', '', $banner->image);
            Storage::disk('public')->delete($imagePath);
        }

        $banner->delete();

        return response()->json([
            'message' => 'Banner berhasil dihapus'
        ]);
    }

    /**
     * ADMIN - Toggle active status
     */
    public function toggleActive($id)
    {
        $banner = FlashSaleBanner::findOrFail($id);
        $banner->is_active = !$banner->is_active;
        $banner->save();

        return response()->json([
            'message' => 'Status banner berhasil diubah',
            'data' => $banner
        ]);
    }

    /**
     * ADMIN - Update order
     */
    public function updateOrder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'banners' => 'required|array',
            'banners.*.id' => 'required|exists:flash_sale_banners,id',
            'banners.*.order' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        foreach ($request->banners as $bannerData) {
            FlashSaleBanner::where('id', $bannerData['id'])
                ->update(['order' => $bannerData['order']]);
        }

        return response()->json([
            'message' => 'Urutan banner berhasil diupdate'
        ]);
    }
}