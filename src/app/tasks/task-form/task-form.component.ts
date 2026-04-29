import { Component, EventEmitter, Output } from '@angular/core';
import { TaskService } from '../task.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent {
  @Output() taskCreated = new EventEmitter<void>();

  title = '';
  description = '';
  isSubmitting = false;
  error = '';

  constructor(private taskService: TaskService) {}

  submit() {
    this.error = '';
    if (!this.title.trim()) {
      this.error = 'Title is required.';
      return;
    }

    this.isSubmitting = true;
    this.taskService.createTask(this.title.trim(), this.description.trim()).subscribe({
      next: () => {
        this.title = '';
        this.description = '';
        this.isSubmitting = false;
        this.taskCreated.emit();
      },
      error: () => {
        this.error = 'Failed to create task. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
