// src/app/models/category.model.ts
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
}

// src/app/models/task.model.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  categoryId: string | null;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
}

export type TaskFilter = 'all' | 'active' | 'completed';
