# Angular Frontend — Complete Walkthrough

A file-by-file explanation of the Tasks feature, covering every Angular concept used.

---

## Project structure

```
src/app/tasks/
├── task.model.ts                  # Data interface
├── task.service.ts                # Business logic + HTTP
├── tasks.module.ts                # Feature module
├── tasks-routing.module.ts        # Feature routes
├── task-form/
│   ├── task-form.component.ts     # Form logic
│   └── task-form.component.html   # Form template
└── task-list/
    ├── task-list.component.ts     # List logic
    └── task-list.component.html   # List template
```

Plus modifications to:
- `src/app/app.module.ts` — register feature module
- `src/app/shell/header/header.component.html` — add nav link
- `proxy.conf.js` — proxy `/api` calls to Express

---

## 1. `task.model.ts` — TypeScript Interface

```ts
export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
}
```

### Concepts
- **TypeScript interface** — describes the shape of an object. It's compile-time only (no runtime cost).
- **Union type** (`string | null`) — description can be a string OR null.
- **Why use it?** Type-safety. If you typo `task.titlee` anywhere, TypeScript yells.

---

## 2. `task.service.ts` — Service Layer

```ts
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly baseUrl = `${environment.serverUrl}/v1/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<{ data: Task[] }>(this.baseUrl)
      .pipe(map((res) => res.data));
  }
  // ... other methods
}
```

### Concepts

**`@Injectable` decorator**
- Marks a class as injectable into other classes.
- `providedIn: 'root'` = singleton, available app-wide. Angular creates one instance and shares it.

**Dependency Injection (DI)**
- `constructor(private http: HttpClient)` — Angular reads the type and automatically gives you an `HttpClient` instance. You never `new HttpClient()` yourself.
- The `private` keyword auto-creates `this.http`. It's TypeScript shorthand.

**`HttpClient`**
- Angular's built-in HTTP service.
- `.get<Type>()`, `.post()`, `.patch()`, `.delete()` — typed methods.
- Returns an **Observable** instead of a Promise.

**Observables (RxJS)**
- A stream of values over time. Like a Promise, but can emit multiple values, can be cancelled, and supports operators.
- **Cold by default** — nothing happens until you `.subscribe()`.

**`.pipe()` and `map()`**
- `pipe` chains operators. `map` transforms each emitted value (like `Array.map`).
- We use it to unwrap `{ data: [...] }` from the API into just `[...]`.

**Why a service?**
- Separation of concerns: components handle UI, services handle data/business logic.
- Reusable across components.
- Testable in isolation.

---

## 3. `tasks-routing.module.ts` — Feature Routing

```ts
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
```

### Concepts

**Angular Router**
- Maps URL paths to components.
- `path: 'tasks'` → URL `/tasks` renders `TaskListComponent`.

**`RouterModule.forChild(routes)`**
- Used in **feature modules**. Adds these routes to the router config.
- `forRoot()` is only used once in `AppRoutingModule` to set up the router globally.

**`Shell.childRoutes()` pattern**
- Wraps the route in `{ path: '', component: ShellComponent, children: [...] }`.
- This means `ShellComponent` (the navbar/layout) renders, and the `TaskListComponent` slots into its `<router-outlet>`.

**`data` property**
- Custom metadata attached to the route. Used here for the page title.

**Route configuration**
- `Routes` is just `Route[]` — typed array of route objects.

---

## 4. `tasks.module.ts` — Feature Module

```ts
@NgModule({
  imports: [CommonModule, FormsModule, TasksRoutingModule],
  declarations: [TaskListComponent, TaskFormComponent]
})
export class TasksModule { }
```

### Concepts

**NgModule**
- A container that groups related components, directives, pipes, and services.
- Tells Angular "these things belong together."

**`imports`** — other modules whose features we use:
- `CommonModule` — gives us `*ngIf`, `*ngFor` and other common directives. (Always import in feature modules; `BrowserModule` only goes in `AppModule`.)
- `FormsModule` — gives us `[(ngModel)]` for two-way binding.
- `TasksRoutingModule` — registers our routes.

**`declarations`** — components that belong to **this** module.
- A component can only be declared in **one** module.

**Why feature modules?**
- Code organization (group related features).
- Lazy loading possible.
- Encapsulation (declarations are private to the module unless exported).

---

## 5. `task-form.component.ts` — Form Component Logic

```ts
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
    if (!this.title.trim()) {
      this.error = 'Title is required.';
      return;
    }

    this.isSubmitting = true;
    this.taskService.createTask(this.title.trim(), this.description.trim())
      .subscribe({
        next: () => {
          this.title = '';
          this.description = '';
          this.isSubmitting = false;
          this.taskCreated.emit();
        },
        error: () => { /* ... */ }
      });
  }
}
```

### Concepts

**`@Component` decorator**
- `selector` — the HTML tag name. `<app-task-form></app-task-form>`.
- `templateUrl` — the HTML file path.
- (`templateUrl` vs `template` — file vs inline string.)

**Component class**
- A regular TS class. Properties become available in the template.
- `title`, `description`, `error` are bound to the template.

**`@Output` and `EventEmitter`**
- Lets a child component emit events to its parent.
- `taskCreated` is an event channel. The parent listens via `(taskCreated)="..."`.
- `EventEmitter<void>` — emits with no payload.

**`.subscribe()`**
- Activates the Observable. Without this, the HTTP call doesn't happen.
- `next` callback runs on success, `error` on failure.

**Component state**
- `isSubmitting`, `error` are just instance properties — Angular re-renders the template when they change (via change detection).

---

## 6. `task-form.component.html` — Form Template

```html
<form (ngSubmit)="submit()">
  <input
    type="text"
    class="form-control"
    [(ngModel)]="title"
    name="title"
  />
  <textarea
    [(ngModel)]="description"
    name="description"
  ></textarea>
  <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
  <button type="submit" [disabled]="isSubmitting">
    {{ isSubmitting ? 'Adding...' : 'Add Task' }}
  </button>
</form>
```

### Concepts

**Template syntax — 4 binding types:**

| Syntax | Type | Direction | Example |
|---|---|---|---|
| `{{ value }}` | Interpolation | TS to DOM | `{{ error }}` |
| `[prop]="value"` | Property binding | TS to DOM | `[disabled]="isSubmitting"` |
| `(event)="handler()"` | Event binding | DOM to TS | `(ngSubmit)="submit()"` |
| `[(ngModel)]="value"` | Two-way | Both | `[(ngModel)]="title"` |

**`(ngSubmit)`**
- Special form event. Fires when the form is submitted (Enter key OR submit button).

**`[(ngModel)]` — the "banana in a box"**
- Combines `[ngModel]="title"` (read) and `(ngModelChange)="title=$event"` (write).
- Requires `FormsModule` to be imported.
- `name` attribute is required for ngModel inside a `<form>`.

**`*ngIf`**
- **Structural directive** (the `*` is shorthand for adding/removing the element from DOM).
- `*ngIf="error"` — renders the div only when `error` is truthy.

**Ternary in interpolation**
- `{{ isSubmitting ? 'Adding...' : 'Add Task' }}` — full JS expressions work inside `{{ }}`.

---

## 7. `task-list.component.ts` — List Component Logic

```ts
@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html'
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  isLoading = true;
  error = '';

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() { /* ... */ }
  toggleTask(task: Task) { /* ... */ }
  deleteTask(id: number) { /* ... */ }
}
```

### Concepts

**Lifecycle Hooks**
- `OnInit` interface, `ngOnInit()` method — called once after the component is created and inputs are set.
- **Don't put initialization logic in the constructor.** Constructors are for DI; `ngOnInit` is for setup.
- Other hooks: `OnDestroy`, `OnChanges`, `AfterViewInit`, etc.

**Why `implements OnInit`?**
- Just tells TypeScript you intend to implement the interface. Optional but good practice.

---

## 8. `task-list.component.html` — List Template

```html
<app-task-form (taskCreated)="loadTasks()"></app-task-form>

<div *ngIf="isLoading">Loading...</div>

<ul *ngIf="!isLoading && tasks.length > 0" class="list-group">
  <li
    *ngFor="let task of tasks"
    [class.list-group-item-secondary]="task.completed"
  >
    <input
      type="checkbox"
      [checked]="task.completed"
      (change)="toggleTask(task)"
    />
    <div [class.text-decoration-line-through]="task.completed">
      {{ task.title }}
    </div>
    <button (click)="deleteTask(task.id)">Delete</button>
  </li>
</ul>
```

### Concepts

**Component composition**
- `<app-task-form>` is the form component used as a child here.
- `(taskCreated)="loadTasks()"` — listening to the form's `@Output`.

**`*ngFor`**
- Structural directive that loops. `let task of tasks` defines the iteration variable.
- Other variables available: `index`, `first`, `last`, `even`, `odd`.

**`[class.x]="condition"`**
- Conditional class binding. Adds the CSS class when condition is true.
- Cleaner than `[ngClass]` for single classes.

**`(click)="deleteTask(task.id)"`**
- DOM event binding. Any standard DOM event works: `click`, `change`, `input`, `keyup`, etc.

---

## 9. `app.module.ts` — Root Module

```ts
@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule,
    NgbModule,
    ShellModule,
    HomeModule,
    TasksModule,         // <-- we added this
    AppRoutingModule
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class AppModule {}
```

### Concepts

**`bootstrap`** — the root component Angular renders into `<app-root>` in `index.html`.

**`provideHttpClient`** — registers `HttpClient` for injection app-wide. Required for the service to work.

**Module ordering** — `AppRoutingModule` should usually be last so its catch-all route doesn't override others.

---

## 10. `proxy.conf.js` — Dev Server Proxy

```js
module.exports = {
  '/api': {
    target: 'http://localhost:3000',
    pathRewrite: { '^/api': '' },
    changeOrigin: true,
    secure: false
  }
};
```

### Concepts

**Why a proxy?**
- Angular runs on `:4200`, Express on `:3000`. Browsers block cross-origin requests (CORS).
- The Angular dev server intercepts `/api/*` calls and forwards them server-side, so the browser sees same-origin.

**`pathRewrite`** — strips the `/api` prefix before forwarding.
- `/api/v1/tasks` becomes `/v1/tasks` on `localhost:3000`.

**Format note** — Angular 18 uses Vite/esbuild and requires the **object format** (`{ '/api': {...} }`), not the older webpack array format.

---

## Big-picture Angular concepts

### 1. Module-Component Architecture
```
AppModule
  ├─ ShellModule (navbar)
  ├─ HomeModule (home page)
  └─ TasksModule
       ├─ TaskListComponent (parent, manages state)
       └─ TaskFormComponent (child, emits events up)
```

### 2. Data flow (one-way down, events up)
- Parent to Child: via `@Input`
- Child to Parent: via `@Output` + `EventEmitter`
- This pattern enforces **predictable data flow**.

### 3. Service pattern
- Components are "dumb" — they handle UI.
- Services hold business logic, state, HTTP calls.
- DI keeps everything testable.

### 4. Reactive programming with RxJS
- HTTP returns Observables, not Promises.
- You can compose, transform, cancel, retry.
- We used `pipe(map(...))` here — many more operators exist.

### 5. Change Detection
- Angular automatically re-renders when component properties change.
- Triggered by: events, HTTP responses, timers, `setTimeout`, etc.
- You don't manually call "render."

### 6. Forms — two flavors:
- **Template-driven** (what we used): `[(ngModel)]`, simple, declarative in HTML.
- **Reactive forms**: `FormGroup`, `FormControl` in TS — more power for complex forms.

### 7. Routing
- URL changes don't reload the page.
- Router swaps components into `<router-outlet>`.
- Lazy loading: feature modules can be loaded on demand (we didn't do this, but `loadChildren` in routes enables it).

---

## Checklist of concepts to know

- Modules (`@NgModule`) — `imports`, `declarations`, `providers`
- Components (`@Component`) — selector, template, lifecycle
- Services (`@Injectable`) — `providedIn: 'root'`
- Dependency Injection — constructor injection
- HttpClient — typed HTTP requests
- Observables / RxJS — `subscribe`, `pipe`, `map`
- Routing — `RouterModule`, `Routes`, `routerLink`, `<router-outlet>`
- Forms — Template-driven, `[(ngModel)]`, `FormsModule`
- Data binding — interpolation, property, event, two-way
- Directives — `*ngIf`, `*ngFor`, `[class.x]`
- `@Input` / `@Output` / `EventEmitter`
- Lifecycle hooks — `OnInit`
- Component composition (parent/child)
- Feature module pattern
- Environment configuration (`environment.ts`)
- Dev proxy / CORS
