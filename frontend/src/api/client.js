/**
 * API client for communicating with the Node.js API Gateway
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function checkNodeHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}
