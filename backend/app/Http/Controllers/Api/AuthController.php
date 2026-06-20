<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'company_name' => 'nullable|string',
            'subscription' => 'nullable|string',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        // Create company
        $companyCount = \App\Models\Company::count() + 1;
        $vendorCode = 'VND' . str_pad($companyCount, 4, '0', STR_PAD_LEFT);
        
        $company = \App\Models\Company::create([
            'name' => $request->company_name ?? ($request->name . ' Store'),
            'code' => $vendorCode,
            'status' => 'pending',
            'subscription' => $request->subscription ?? 'basic',
            'phone' => $request->phone ?? '',
            'address' => $request->address ?? '',
        ]);

        // Create user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'vendor',
            'company_id' => $company->id,
            'status' => 'pending',
        ]);

        // Update company owner
        $company->owner_id = $user->id;
        $company->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function login(Request $request)
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid login details'], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if ($user->status === 'pending') {
            return response()->json(['message' => 'Your account is pending approval from an Administrator.'], 403);
        }

        if ($user->status === 'suspended') {
            return response()->json(['message' => 'Your account has been suspended by an Administrator.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function googleLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'required|string',
            'photo_url' => 'nullable|string',
            'uid' => 'required|string'
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            if ($request->photo_url && !$user->photo_url) {
                $user->photo_url = $request->photo_url;
                $user->save();
            }
        } else {
            // Auto register social user
            $companyCount = \App\Models\Company::count() + 1;
            $vendorCode = 'VND' . str_pad($companyCount, 4, '0', STR_PAD_LEFT);
            
            $company = \App\Models\Company::create([
                'name' => $request->name . ' Store',
                'code' => $vendorCode,
                'status' => 'pending',
                'subscription' => 'basic',
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make(\Illuminate\Support\Str::random(24)),
                'role' => 'vendor',
                'company_id' => $company->id,
                'status' => 'pending',
                'photo_url' => $request->photo_url
            ]);

            $company->owner_id = $user->id;
            $company->save();
        }

        if ($user->status === 'pending') {
            return response()->json(['message' => 'Your account is pending approval from an Administrator.'], 403);
        }

        if ($user->status === 'suspended') {
            return response()->json(['message' => 'Your account has been suspended by an Administrator.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'name' => 'nullable|string',
            'photo_url' => 'nullable|string',
        ]);

        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('photo_url')) {
            $user->photo_url = $request->photo_url;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }
}
