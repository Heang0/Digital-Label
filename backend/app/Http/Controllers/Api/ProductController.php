<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Branch;
use App\Models\BranchProduct;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::all();
        return response()->json($products);
    }

    public function save(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'price' => 'required|numeric',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'id' => 'nullable'
        ]);

        if ($request->has('id') && $request->id) {
            $product = Product::where('company_id', $user->company_id)->find($request->id);
            if (!$product) {
                return response()->json(['message' => 'Product not found'], 404);
            }
        } else {
            $product = new Product();
            $product->company_id = $user->company_id;
        }

        $product->name = $request->name;
        $product->sku = $request->sku ?? ('SKU' . time());
        $product->price = $request->price;
        $product->category = $request->category ?? 'General';
        $product->description = $request->description;
        $product->image_url = $request->image_url;
        $product->save();

        // Sync with Branch Products
        $branches = Branch::where('company_id', $user->company_id)->get();

        foreach ($branches as $branch) {
            $branchProduct = BranchProduct::where('branch_id', $branch->id)
                ->where('product_id', $product->id)
                ->first();

            if (!$branchProduct) {
                $branchProduct = new BranchProduct();
                $branchProduct->branch_id = $branch->id;
                $branchProduct->product_id = $product->id;
                $branchProduct->company_id = $user->company_id;
                $branchProduct->stock = $request->stock ?? 10;
                $branchProduct->min_stock = $request->min_stock ?? 5;
            } else {
                if ($request->has('stock')) {
                    $branchProduct->stock = $request->stock;
                }
                if ($request->has('min_stock')) {
                    $branchProduct->min_stock = $request->min_stock;
                }
            }

            // Calculate status
            $stock = $branchProduct->stock;
            $minStock = $branchProduct->min_stock;
            if ($stock == 0) {
                $status = 'out-of-stock';
            } elseif ($stock <= $minStock) {
                $status = 'low-stock';
            } else {
                $status = 'in-stock';
            }

            $branchProduct->current_price = $product->price;
            $branchProduct->status = $status;
            $branchProduct->save();
        }

        // Sync with Labels
        $labels = \App\Models\Label::where('company_id', $user->company_id)
            ->where('product_id', $product->id)
            ->get();
            
        foreach ($labels as $label) {
            $label->base_price = $product->price;
            // Recalculate final price if there is a discount
            if ($label->discount_percent > 0) {
                $label->final_price = $label->base_price * (1 - ($label->discount_percent / 100));
            } else {
                $label->final_price = $label->base_price;
            }
            $label->status = 'syncing';
            $label->save();
        }

        return response()->json([
            'success' => true,
            'product' => $product
        ]);
    }

    public function delete($id, Request $request)
    {
        $user = $request->user();
        
        $product = Product::where('company_id', $user->company_id)->find($id);
        
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        // Delete from branch products too
        BranchProduct::where('product_id', $product->id)->delete();
        
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }
}
