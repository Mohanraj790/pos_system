import apiClient from './client';
import { Category } from '../../types';

export const categoriesApi = {
    async getAll(storeId?: string): Promise<Category[]> {
        const params = storeId ? { storeId } : {};
        const response = await apiClient.get('/categories', { params });
        return response.data;
    },

    async create(category: Category): Promise<{ message: string; categoryId: string }> {
        const response = await apiClient.post('/categories', category);
        return response.data;
    },

    async update(id: string, category: Partial<Category>): Promise<{ message: string }> {
        const response = await apiClient.put(`/categories/${id}`, category);
        return response.data;
    },

    async delete(id: string): Promise<{ message: string }> {
        const response = await apiClient.delete(`/categories/${id}`);
        return response.data;
    },
};
