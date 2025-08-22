// src/services/InventoryService.ts

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  minStock: number;
  maxStock: number;
  supplier: string | null;
  location: string | null;
  description: string | null;
  imageUrl: string | null;
  lastUpdated: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class InventoryService {
  // 🔥 Hardcoded backend URL — no Vite or .env needed
  private baseUrl = 'http://localhost:5001/api'; // ← Your Express server

  async getInventoryItems(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory/items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<InventoryItem[]> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'API returned success: false');
      }

      return result.data;
    } catch (error) {
      console.error('Fetch failed:', error);
      throw error;
    }
  }
}

export default new InventoryService();