import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Task } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly baseUrl = `${environment.serverUrl}/v1/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<{ data: Task[] }>(this.baseUrl).pipe(map((res) => res.data));
  }

  createTask(title: string, description: string): Observable<Task> {
    return this.http.post<{ data: Task }>(this.baseUrl, { title, description }).pipe(map((res) => res.data));
  }

  toggleTask(id: number): Observable<Task> {
    return this.http.patch<{ data: Task }>(`${this.baseUrl}/${id}`, {}).pipe(map((res) => res.data));
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
