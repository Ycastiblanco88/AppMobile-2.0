import { Injectable, signal, computed } from '@angular/core';
import { Category } from '../models/index';
import { StorageService } from './storage.service';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'personal', name: 'Personal', color: '#6C63FF', icon: 'person-outline', createdAt: Date.now() },
  { id: 'work', name: 'Trabajo', color: '#FF6584', icon: 'briefcase-outline', createdAt: Date.now() },
  { id: 'shopping', name: 'Compras', color: '#43D9AD', icon: 'cart-outline', createdAt: Date.now() },
  { id: 'health', name: 'Salud', color: '#FF9F43', icon: 'heart-outline', createdAt: Date.now() },
];

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly STORAGE_KEY = 'categories';
  private _categories = signal<Category[]>([]);

  categories = this._categories.asReadonly();

  constructor(private storage: StorageService) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = this.storage.get<Category[]>(this.STORAGE_KEY, DEFAULT_CATEGORIES);
    this._categories.set(stored);
  }

  private persist(): void {
    this.storage.set(this.STORAGE_KEY, this._categories());
  }

  getCategoryById(id: string): Category | undefined {
    return this._categories().find(c => c.id === id);
  }

  addCategory(name: string, color: string, icon: string): Category {
    const category: Category = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
      icon,
      createdAt: Date.now()
    };
    this._categories.update(cats => [...cats, category]);
    this.persist();
    return category;
  }

  updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): void {
    this._categories.update(cats =>
      cats.map(c => c.id === id ? { ...c, ...updates } : c)
    );
    this.persist();
  }

  deleteCategory(id: string): void {
    this._categories.update(cats => cats.filter(c => c.id !== id));
    this.persist();
  }
}
