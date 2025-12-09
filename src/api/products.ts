import apiClient from './client';
import { Product } from '../../types';

export const productsApi = {
    async getAll(storeId?: string): Promise<Product[]> {
        const params = storeId ? { storeId } : {};
        const response = await apiClient.get('/products', { params });
        return response.data;
    },

    async create(product: Product): Promise<{ message: string; productId: string }> {
        const response = await apiClient.post('/products', product);
        return response.data;
    },

    async update(id: string, product: Partial<Product>): Promise<{ message: string }> {
        const response = await apiClient.put(`/products/${id}`, product);
        return response.data;
    },

    async updateStock(id: string, delta: number): Promise<{ message: string; newStock: number }> {
        const response = await apiClient.patch(`/products/${id}/stock`, { delta });
        return response.data;
    },

    async delete(id: string): Promise<{ message: string }> {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
    },
};
