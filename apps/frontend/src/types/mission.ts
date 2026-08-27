export interface Mission {
  id: string;
  name: string;
  status: "pending" | "active" | "completed" | "aborted";
  image_count: number;
  date?: string;
}
