export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface HealthStatus {
  status: string;
  version: string;
  active_port?: string;
  port_connected: boolean;
  rag_ready: boolean;
}
