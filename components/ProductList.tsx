import React from 'react';
import { useListProductsQuery } from './src/dataconnect-generated/react';

/**
 * Example Product List Component
 * Demonstrates how to use Firebase Data Connect with React
 */
export function ProductList() {
    const { data, loading, error } = useListProductsQuery();

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse">Loading products...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800">Error loading products: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.products.map((product) => (
                    <div
                        key={product.id}
                        className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow"
                    >
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {product.sku && (
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        )}
                        {product.description && (
                            <p className="text-gray-600 mt-2">{product.description}</p>
                        )}
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-2xl font-bold text-green-600">
                                ${product.price.toFixed(2)}
                            </span>
                            {product.stockQuantity !== null && (
                                <span className={`text-sm ${product.stockQuantity > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                                    Stock: {product.stockQuantity}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {(!data?.products || data.products.length === 0) && (
                <p className="text-gray-500 text-center py-8">
                    No products found. Add some products using the Data Connect emulator UI.
                </p>
            )}
        </div>
    );
}

export default ProductList;
