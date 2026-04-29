import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Shell } from '@app/shell/shell.service';
import { TaskListComponent } from './task-list/task-list.component';

const routes: Routes = [
  Shell.childRoutes([
    { path: 'tasks', component: TaskListComponent, data: { title: 'Tasks' } }
  ])
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TasksRoutingModule { }
