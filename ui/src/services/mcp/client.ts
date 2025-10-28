// MCP Client for communicating with the Todo MCP Server
// This is a simplified HTTP-based client for the MVP
// TODO: Implement WebSocket support for real-time updates

export interface MCPRequest {
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse<T = unknown> {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

class MCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async call<T = unknown>(method: string, params?: Record<string, unknown> | unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MCPResponse<T> = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.result as T;
    } catch (error) {
      console.error(`MCP call failed for ${method}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const mcpClient = new MCPClient(
  import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3000'
);
