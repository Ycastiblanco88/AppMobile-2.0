import { Injectable, signal, computed } from '@angular/core';
import { Task, TaskFilter } from '../models/index';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly STORAGE_KEY = 'tasks';
  private _tasks = signal<Task[]>([]);
  private _activeFilter = signal<TaskFilter>('all');
  private _activeCategoryFilter = signal<string | null>(null);
  private _searchQuery = signal<string>('');

  tasks = this._tasks.asReadonly();
  activeFilter = this._activeFilter.asReadonly();
  activeCategoryFilter = this._activeCategoryFilter.asReadonly();
  searchQuery = this._searchQuery.asReadonly();

  // Computed values for efficient filtering - only recomputes when dependencies change
  filteredTasks = computed(() => {
    let tasks = this._tasks();
    const filter = this._activeFilter();
    const categoryId = this._activeCategoryFilter();
    const query = this._searchQuery().toLowerCase().trim();

    if (filter === 'active') {
      tasks = tasks.filter(t => !t.completed);
    } else if (filter === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    if (categoryId) {
      tasks = tasks.filter(t => t.categoryId === categoryId);
    }

    if (query) {
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description?.toLowerCase().includes(query))
      );
    }

    // Sort: incomplete first, then by priority, then by creation date
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt - a.createdAt;
    });
  });

  stats = computed(() => {
    const tasks = this._tasks();
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      active: tasks.filter(t => !t.completed).length,
    };
  });

  constructor(private storage: StorageService) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = this.storage.get<Task[]>(this.STORAGE_KEY, []);
    this._tasks.set(stored);
  }

  private persist(): void {
    this.storage.set(this.STORAGE_KEY, this._tasks());
  }

  setFilter(filter: TaskFilter): void {
    this._activeFilter.set(filter);
  }

  setCategoryFilter(categoryId: string | null): void {
    this._activeCategoryFilter.set(categoryId);
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  addTask(title: string, options?: {
    description?: string;
    categoryId?: string | null;
    priority?: Task['priority'];
    dueDate?: number;
  }): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: options?.description?.trim(),
      completed: false,
      categoryId: options?.categoryId ?? null,
      priority: options?.priority ?? 'medium',
      createdAt: Date.now(),
      dueDate: options?.dueDate,
    };
    this._tasks.update(tasks => [task, ...tasks]);
    this.persist();
    return task;
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): void {
    this._tasks.update(tasks =>
      tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    );
    this.persist();
  }

  toggleComplete(id: string): void {
    this._tasks.update(tasks =>
      tasks.map(t => {
        if (t.id !== id) return t;
        const completed = !t.completed;
        return { ...t, completed, completedAt: completed ? Date.now() : undefined };
      })
    );
    this.persist();
  }

  deleteTask(id: string): void {
    this._tasks.update(tasks => tasks.filter(t => t.id !== id));
    this.persist();
  }

  deleteTasksByCategory(categoryId: string): void {
    this._tasks.update(tasks => tasks.filter(t => t.categoryId !== categoryId));
    this.persist();
  }

  clearCompleted(): void {
    this._tasks.update(tasks => tasks.filter(t => !t.completed));
    this.persist();
  }
}
