import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { CategoryService } from '../../services/category.service';
import { TaskService } from '../../services/task.service';
import { Category } from '../../models/index';

const AVAILABLE_COLORS = [
  '#6C63FF', '#FF6584', '#43D9AD', '#FF9F43',
  '#54A0FF', '#EE5A24', '#009432', '#FDA7DF',
  '#1289A7', '#C4E538', '#ED4C67', '#F79F1F',
];

const AVAILABLE_ICONS = [
  'person-outline', 'briefcase-outline', 'cart-outline', 'heart-outline',
  'home-outline', 'school-outline', 'fitness-outline', 'airplane-outline',
  'book-outline', 'musical-notes-outline', 'restaurant-outline', 'car-outline',
  'game-controller-outline', 'leaf-outline', 'star-outline', 'trophy-outline',
];

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {
  categoryService = inject(CategoryService);
  private taskService = inject(TaskService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  get categories() { return this.categoryService.categories(); }
  get stats() { return this.taskService.stats(); }

  trackByCatId = (i: number, c: Category) => c.id;

  getTaskCountForCategory(catId: string): number {
    return this.taskService.tasks().filter(t => t.categoryId === catId).length;
  }

  async addCategory() {
    await this.openCategoryDialog();
  }

  async editCategory(cat: Category) {
    await this.openCategoryDialog(cat);
  }

  private async openCategoryDialog(existing?: Category) {
    const isEdit = !!existing;
    const selectedColor = existing?.color ?? AVAILABLE_COLORS[0];
    const selectedIcon = existing?.icon ?? AVAILABLE_ICONS[0];

    const alert = await this.alertCtrl.create({
      header: isEdit ? 'Editar Categoría' : 'Nueva Categoría',
      cssClass: 'category-alert',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: existing?.name ?? '',
          placeholder: 'Nombre de la categoría *',
          attributes: { maxlength: 30 }
        },
        // Color options as radio
        ...AVAILABLE_COLORS.map(c => ({
          type: 'radio' as const,
          name: 'color',
          label: c,
          value: c,
          checked: c === selectedColor,
        })),
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: isEdit ? 'Guardar' : 'Crear',
          handler: (data) => {
            // data is the selected radio value (color)
            // We get name from a separate read
            return true;
          }
        }
      ]
    });

    // Because AlertController with mixed inputs (text + radio) is limited,
    // we use a two-step approach: first ask for name, then color/icon
    await this.askCategoryName(existing, selectedColor, selectedIcon, isEdit);
  }

  private async askCategoryName(existing: Category | undefined, selectedColor: string, selectedIcon: string, isEdit: boolean) {
    const nameAlert = await this.alertCtrl.create({
      header: isEdit ? 'Editar Categoría' : 'Nueva Categoría',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: existing?.name ?? '',
          placeholder: 'Nombre de la categoría *',
          attributes: { maxlength: 30 }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente →',
          handler: async (data) => {
            if (!data.name?.trim()) {
              this.showToast('El nombre es obligatorio', 'warning-outline');
              return false;
            }
            await this.askCategoryColor(data.name.trim(), existing, selectedColor, selectedIcon, isEdit);
            return true;
          }
        }
      ]
    });
    await nameAlert.present();
  }

  private async askCategoryColor(name: string, existing: Category | undefined, selectedColor: string, selectedIcon: string, isEdit: boolean) {
    const colorAlert = await this.alertCtrl.create({
      header: 'Elige un color',
      inputs: AVAILABLE_COLORS.map(c => ({
        type: 'radio' as const,
        label: c,
        value: c,
        checked: c === selectedColor,
      })),
      buttons: [
        { text: 'Atrás', handler: async () => { await this.askCategoryName(existing, selectedColor, selectedIcon, isEdit); } },
        {
          text: 'Siguiente →',
          handler: async (color: string) => {
            const chosenColor = color ?? selectedColor;
            await this.askCategoryIcon(name, existing, chosenColor, selectedIcon, isEdit);
          }
        }
      ]
    });
    await colorAlert.present();
  }

  private async askCategoryIcon(name: string, existing: Category | undefined, color: string, selectedIcon: string, isEdit: boolean) {
    const iconAlert = await this.alertCtrl.create({
      header: 'Elige un ícono',
      inputs: AVAILABLE_ICONS.map(i => ({
        type: 'radio' as const,
        label: i.replace('-outline', ''),
        value: i,
        checked: i === selectedIcon,
      })),
      buttons: [
        { text: 'Atrás', handler: async () => { await this.askCategoryColor(name, existing, color, selectedIcon, isEdit); } },
        {
          text: isEdit ? 'Guardar' : 'Crear',
          handler: (icon: string) => {
            const chosenIcon = icon ?? selectedIcon;
            if (isEdit) {
              this.categoryService.updateCategory(existing!.id, { name, color, icon: chosenIcon });
              this.showToast('Categoría actualizada', 'create-outline');
            } else {
              this.categoryService.addCategory(name, color, chosenIcon);
              this.showToast('Categoría creada', 'pricetag-outline');
            }
          }
        }
      ]
    });
    await iconAlert.present();
  }

  async deleteCategory(cat: Category) {
    const taskCount = this.getTaskCountForCategory(cat.id);
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Categoría',
      message: taskCount > 0
        ? `"${cat.name}" tiene ${taskCount} tarea(s). ¿Eliminar categoría y desvincular tareas?`
        : `¿Eliminar la categoría "${cat.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            // Unlink tasks from this category
            if (taskCount > 0) {
              this.taskService.tasks()
                .filter(t => t.categoryId === cat.id)
                .forEach(t => this.taskService.updateTask(t.id, { categoryId: null }));
            }
            this.categoryService.deleteCategory(cat.id);
            this.showToast('Categoría eliminada', 'trash-outline');
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2000, position: 'bottom', icon,
    });
    await toast.present();
  }
}
