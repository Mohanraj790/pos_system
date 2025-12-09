import apiClient from './client';
import { Store } from '../../types';

export const storesApi = {
    async getAll(): Promise<Store[]> {
        const response = await apiClient.get('/stores');
        return response.data;
    },

    async getById(id: string): Promise<Store> {
        const response = await apiClient.get(`/stores/${id}`);
        return response.data;
    },

    async create(store: Store): Promise<{ message: string; storeId: string }> {
        const response = await apiClient.post('/stores', store);
        return response.data;
    },

    async update(id: string, store: Partial<Store>): Promise<{ message: string }> {
        const response = await apiClient.put(`/stores/${id}`, store);
        return response.data;
    },
};
