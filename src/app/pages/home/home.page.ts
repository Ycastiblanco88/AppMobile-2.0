import {
  Component, ChangeDetectionStrategy,
  signal, inject
} from '@angular/core';
import { AlertController, ToastController, IonItemSliding } from '@ionic/angular';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { Task, TaskFilter } from '../../models/index';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  taskService = inject(TaskService);
  categoryService = inject(CategoryService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  searchVisible = signal(false);

  // Track-by function for ngFor performance
  trackByTaskId = (index: number, task: Task) => task.id;

  get filteredTasks() { return this.taskService.filteredTasks(); }
  get stats() { return this.taskService.stats(); }
  get categories() { return this.categoryService.categories(); }
  get activeFilter() { return this.taskService.activeFilter(); }
  get activeCategoryFilter() { return this.taskService.activeCategoryFilter(); }
  get searchQuery() { return this.taskService.searchQuery(); }

  setFilter(filter: TaskFilter) {
    this.taskService.setFilter(filter);
  }

  setCategoryFilter(id: string | null) {
    this.taskService.setCategoryFilter(id);
  }

  onSearchChange(event: any) {
    this.taskService.setSearchQuery(event.detail.value ?? '');
  }

  toggleSearch() {
    this.searchVisible.update(v => !v);
    if (!this.searchVisible()) {
      this.taskService.setSearchQuery('');
    }
  }

  toggleComplete(task: Task, slidingItem?: IonItemSliding) {
    this.taskService.toggleComplete(task.id);
    slidingItem?.close();
  }

  async deleteTask(task: Task, slidingItem?: IonItemSliding) {
    slidingItem?.close();
    const alert = await this.alertCtrl.create({
      header: 'Eliminar tarea',
      message: `¿Eliminar "${task.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.taskService.deleteTask(task.id);
            this.showToast('Tarea eliminada', 'trash-outline');
          }
        }
      ]
    });
    await alert.present();
  }

  async addTask() {
    await this.openTaskDialog();
  }

  async editTask(task: Task, slidingItem?: IonItemSliding) {
    slidingItem?.close();
    await this.openTaskDialog(task);
  }

  private async openTaskDialog(existing?: Task) {
    const isEdit = !!existing;
    const titleAlert = await this.alertCtrl.create({
      header: isEdit ? 'Editar Tarea' : 'Nueva Tarea',
      inputs: [
        {
          name: 'title',
          type: 'text',
          value: existing?.title ?? '',
          placeholder: 'Título de la tarea *',
          attributes: { maxlength: 100 }
        },
        {
          name: 'description',
          type: 'textarea',
          value: existing?.description ?? '',
          placeholder: 'Descripción (opcional)',
          attributes: { rows: 2, maxlength: 300 }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente →',
          handler: async (data) => {
            if (!data.title?.trim()) {
              this.showToast('El título es obligatorio', 'warning-outline');
              return false;
            }
            await this.askTaskPriority(data.title.trim(), data.description ?? '', existing);
            return true;
          }
        }
      ]
    });
    await titleAlert.present();
  }

  private async askTaskPriority(title: string, description: string, existing?: Task) {
    const currentPriority = existing?.priority ?? 'medium';
    const priorityAlert = await this.alertCtrl.create({
      header: 'Prioridad',
      inputs: [
        { type: 'radio' as const, label: '🔴 Alta', value: 'high', checked: currentPriority === 'high' },
        { type: 'radio' as const, label: '🟡 Media', value: 'medium', checked: currentPriority === 'medium' },
        { type: 'radio' as const, label: '🟢 Baja', value: 'low', checked: currentPriority === 'low' },
      ],
      buttons: [
        { text: 'Atrás', handler: async () => { await this.openTaskDialog(existing); } },
        {
          text: 'Siguiente →',
          handler: async (priority: string) => {
            await this.askTaskCategory(title, description, (priority ?? 'medium') as Task['priority'], existing);
          }
        }
      ]
    });
    await priorityAlert.present();
  }

  private async askTaskCategory(title: string, description: string, priority: Task['priority'], existing?: Task) {
    const cats = this.categories;
    const currentCatId = existing?.categoryId ?? null;

    if (cats.length === 0) {
      // No categories, save directly
      this.saveTask(title, description, priority, null, existing);
      return;
    }

    const catAlert = await this.alertCtrl.create({
      header: 'Categoría',
      inputs: [
        { type: 'radio' as const, label: 'Sin categoría', value: '', checked: !currentCatId },
        ...cats.map(c => ({
          type: 'radio' as const,
          label: c.name,
          value: c.id,
          checked: c.id === currentCatId,
        }))
      ],
      buttons: [
        { text: 'Atrás', handler: async () => { await this.askTaskPriority(title, description, existing); } },
        {
          text: existing ? 'Guardar' : 'Agregar',
          handler: (catId: string) => {
            this.saveTask(title, description, priority, catId || null, existing);
          }
        }
      ]
    });
    await catAlert.present();
  }

  private saveTask(title: string, description: string, priority: Task['priority'], categoryId: string | null, existing?: Task) {
    if (existing) {
      this.taskService.updateTask(existing.id, { title, description, priority, categoryId });
      this.showToast('Tarea actualizada', 'create-outline');
    } else {
      this.taskService.addTask(title, { description, categoryId, priority });
      this.showToast('¡Tarea agregada!', 'checkmark-circle-outline');
    }
  }

  async clearCompleted() {
    const count = this.stats.completed;
    if (count === 0) return;
    const alert = await this.alertCtrl.create({
      header: 'Limpiar completadas',
      message: `¿Eliminar las ${count} tarea(s) completada(s)?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.taskService.clearCompleted();
            this.showToast(`${count} tarea(s) eliminada(s)`, 'trash-outline');
          }
        }
      ]
    });
    await alert.present();
  }

  getCategoryForTask(categoryId: string | null) {
    if (!categoryId) return null;
    return this.categoryService.getCategoryById(categoryId);
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = { high: 'danger', medium: 'warning', low: 'success' };
    return map[priority] ?? 'medium';
  }

  private async showToast(message: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      icon,
      cssClass: 'app-toast',
    });
    await toast.present();
  }
}
