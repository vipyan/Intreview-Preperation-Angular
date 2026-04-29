import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TasksRoutingModule } from './tasks-routing.module';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskFormComponent } from './task-form/task-form.component';

@NgModule({
  imports: [CommonModule, FormsModule, TasksRoutingModule],
  declarations: [TaskListComponent, TaskFormComponent]
})
export class TasksModule { }
