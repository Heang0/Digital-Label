<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Helper to upload file directly to ImageKit.io
     */
    private function uploadToImageKit($file, $folder)
    {
        $publicKey = env('IMAGEKIT_PUBLIC_KEY');
        $privateKey = env('IMAGEKIT_PRIVATE_KEY');
        
        if (!$publicKey || !$privateKey) {
            return [
                'success' => false,
                'message' => 'ImageKit credentials not configured in Laravel .env file.'
            ];
        }

        // Read file contents and convert to base64
        $base64File = base64_encode(file_get_contents($file->getRealPath()));
        $filename = $folder . '_' . Str::random(10) . '_' . time() . '.' . $file->getClientOriginalExtension();

        // ImageKit authorization requires Private Key + ":" encoded in base64
        $authHeader = 'Basic ' . base64_encode($privateKey . ':');

        // Post request directly to ImageKit API
        $response = Http::withHeaders([
            'Authorization' => $authHeader,
        ])->attach(
            'file', base64_decode($base64File), $filename
        )->attach(
            'fileName', $filename
        )->attach(
            'folder', '/' . $folder
        )->post('https://upload.imagekit.io/api/v1/files/upload');

        if ($response->successful()) {
            $data = $response->json();
            return [
                'success' => true,
                'url' => $data['url'],
                'fileId' => $data['fileId']
            ];
        }

        return [
            'success' => false,
            'message' => $response->body()
        ];
    }

    /**
     * Handle Profile Image Upload
     */
    public function uploadProfile(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            
            // Upload to ImageKit in the "profiles" folder
            $result = $this->uploadToImageKit($file, 'profiles');

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'url' => $result['url'],
                    'fileId' => $result['fileId']
                ]);
            }

            return response()->json([
                'error' => 'ImageKit upload failed',
                'details' => $result['message']
            ], 500);
        }

        return response()->json(['error' => 'No image file uploaded'], 400);
    }

    /**
     * Handle Product Image Upload
     */
    public function uploadProduct(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            
            // Upload to ImageKit in the "products" folder
            $result = $this->uploadToImageKit($file, 'products');

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'url' => $result['url'],
                    'fileId' => $result['fileId']
                ]);
            }

            return response()->json([
                'error' => 'ImageKit upload failed',
                'details' => $result['message']
            ], 500);
        }

        return response()->json(['error' => 'No image file uploaded'], 400);
    }
}
