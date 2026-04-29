# Angular for React Devs — Mental Model Translation

Each concept mapped to its React equivalent.

---

## 1. Modules (`@NgModule`)

**React equivalent:** None. React has no concept of modules — you just import what you need.

**What it is:** A "registration system." You tell Angular: "these components, directives, and pipes belong together, and these are the things they can use."

```ts
@NgModule({
  declarations: [TaskListComponent, TaskFormComponent], // components I own
  imports: [CommonModule, FormsModule],                  // features I want to use
  providers: [],                                          // services I want to register
  exports: []                                             // things other modules can use
})
```

**Why does it exist?** Historically, Angular needed to know what's available where for AOT compilation. (Angular 14+ has "standalone components" that skip modules — like React's import model.)

**Mental model:** Think of it as `package.json` for components instead of npm packages.

---

## 2. Components (`@Component`)

**React equivalent:** Class components with decorators glueing template + class together.

```tsx
// React
function TaskList() {
  const [tasks, setTasks] = useState([]);
  return <ul>...</ul>;
}
```
```ts
// Angular
@Component({
  selector: 'app-task-list',          // the HTML tag: <app-task-list>
  templateUrl: './task-list.html',    // separate HTML file
  styleUrls: ['./task-list.scss']     // separate CSS
})
export class TaskListComponent {
  tasks: Task[] = [];                 // class property = state
}
```

**Differences:**
- Template lives in a separate `.html` file (or inline `template: '...'`).
- No JSX — Angular uses HTML with special syntax.
- Class properties replace `useState`. Angular auto-detects changes — no `setState`.

---

## 3. Services (`@Injectable`)

**React equivalent:** A combination of custom hooks + Context — but singleton, no need to wrap in providers.

```tsx
// React custom hook
function useTaskApi() {
  const fetchTasks = () => fetch('/api/tasks');
  return { fetchTasks };
}
```
```ts
// Angular service
@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}
  getTasks() { return this.http.get('/api/tasks'); }
}
```

**Key difference:** `providedIn: 'root'` = the service is a **singleton across the entire app**. Same instance everywhere. No need to wrap with `<Provider>`.

**When to use:** Anywhere you'd reach for a custom hook, Context, Zustand, or Redux for shared state — services replace all of these.

---

## 4. Dependency Injection

**React equivalent:** None directly. You'd use Context or just `import` to wire dependencies.

```tsx
// React: explicit imports
import { taskApi } from './taskApi';
function MyComp() { taskApi.fetch(); }
```
```ts
// Angular: ask for what you need in constructor
class MyComp {
  constructor(private taskService: TaskService) {} // Angular gives it to you
}
```

**The shift:** Instead of importing concrete dependencies, you **declare** what you need (by type) and Angular provides it. Big win for testing — you swap `TaskService` for a mock without touching the component.

---

## 5. HttpClient

**React equivalent:** `fetch` / `axios`, but returns Observables (think async iterators) instead of Promises.

```tsx
// React
const res = await fetch('/api/tasks').then(r => r.json());
```
```ts
// Angular
this.http.get<Task[]>('/api/tasks').subscribe(tasks => {
  this.tasks = tasks;
});
```

**Why Observables?** They're cancellable (huge for race conditions on search-as-you-type), composable, and emit multiple values over time.

---

## 6. Observables / RxJS

**React equivalent:** Promises + async iterators on steroids. Most React devs don't use them — Angular forces you to.

```ts
this.http.get('/tasks')
  .pipe(
    map(res => res.data),          // transform
    filter(tasks => tasks.length), // filter
    debounceTime(300)              // wait
  )
  .subscribe(tasks => { /* use them */ });
```

**Mental model:**
- Promise = one value, eventually.
- Observable = stream of values, cancellable.
- `.pipe()` = `.then().then().then()` but more powerful operators.
- `.subscribe()` = `.then(callback)` but stays open for future emissions.

**Gotcha:** Forgetting to `.subscribe()` means **nothing happens**. Promises auto-execute; Observables don't.

---

## 7. Routing

**React equivalent:** React Router — but config-driven instead of JSX-driven.

```tsx
// React Router
<Routes>
  <Route path="/tasks" element={<TaskList />} />
</Routes>
```
```ts
// Angular Router
const routes: Routes = [
  { path: 'tasks', component: TaskListComponent }
];
```

**Template equivalents:**

| React | Angular |
|---|---|
| `<Link to="/tasks">` | `<a routerLink="/tasks">` |
| `<Outlet />` | `<router-outlet></router-outlet>` |
| `useNavigate()` | `inject(Router).navigate(['/tasks'])` |
| `useParams()` | `inject(ActivatedRoute).params` |

---

## 8. Forms — Template-driven

**React equivalent:** Controlled components, but Angular makes it 1 line vs React's 3.

```tsx
// React
<input value={title} onChange={e => setTitle(e.target.value)} />
```
```html
<!-- Angular -->
<input [(ngModel)]="title" name="title" />
```

`[(ngModel)]` = "two-way binding." Reads value AND writes back on change. The "banana in a box" syntax `[()]` = property binding `[]` + event binding `()`.

**Reactive forms** (the other flavor) are closer to React Hook Form — building form objects in TypeScript.

---

## 9. Data Binding — 4 Types

**React equivalent:** All done via `{}` and props. Angular has 4 distinct syntaxes.

```html
<div>{{ title }}</div>                  <!-- {title} interpolation -->
<button [disabled]="loading">           <!-- disabled={loading} prop binding -->
<button (click)="save()">               <!-- onClick={save} event binding -->
<input [(ngModel)]="name">              <!-- two-way (no React equivalent) -->
```

| Angular | React |
|---|---|
| `{{ value }}` | `{value}` |
| `[prop]="value"` | `prop={value}` |
| `(event)="handler($event)"` | `onEvent={handler}` |
| `[(ngModel)]="value"` | `value={x} onChange={...}` |

---

## 10. Structural Directives

**React equivalent:** `&&` for conditionals, `.map()` for lists.

```tsx
// React
{loading && <Spinner />}
{tasks.map(t => <TaskItem key={t.id} task={t} />)}
{showHeader ? <Header /> : <Footer />}
```
```html
<!-- Angular -->
<div *ngIf="loading">Loading</div>
<div *ngFor="let t of tasks">{{ t.title }}</div>
<div *ngIf="showHeader; else footer">Header</div>
<ng-template #footer>Footer</ng-template>
```

The `*` is Angular's syntactic sugar for "this directive adds/removes elements from the DOM."

**Class binding:**
```tsx
className={completed ? 'done' : ''}      // React
[class.done]="completed"                  // Angular
```

---

## 11. `@Input` / `@Output` / `EventEmitter`

**React equivalent:** Props (`@Input`) and callback props (`@Output`).

```tsx
// React
function TaskForm({ initialTitle, onCreated }) {
  // ...
  onCreated(newTask);
}
<TaskForm initialTitle="" onCreated={loadTasks} />
```
```ts
// Angular
class TaskFormComponent {
  @Input() initialTitle = '';
  @Output() created = new EventEmitter<Task>();
  // ...
  this.created.emit(newTask);
}
```
```html
<app-task-form [initialTitle]="''" (created)="loadTasks()"></app-task-form>
```

**Mental model:**
- `@Input` = a prop coming in (parent to child data).
- `@Output` + `EventEmitter` = a callback prop going out (child to parent events).
- `[prop]` reads from input, `(event)` listens for output.

---

## 12. Lifecycle Hooks

**React equivalent:** `useEffect` — but split into specific named methods.

```tsx
// React
useEffect(() => {
  loadTasks();         // mount
  return () => { /* cleanup */ };  // unmount
}, []);
```
```ts
// Angular
ngOnInit() {
  this.loadTasks();   // after first render, like useEffect with []
}

ngOnDestroy() {
  // cleanup, like useEffect cleanup
}
```

**Common hooks:**

| React | Angular |
|---|---|
| `useEffect(() => {}, [])` | `ngOnInit()` |
| `useEffect(() => () => cleanup, [])` | `ngOnDestroy()` |
| `useEffect(() => {}, [prop])` | `ngOnChanges()` |
| `useLayoutEffect` | `ngAfterViewInit()` |

**Gotcha:** Don't put init logic in the constructor. Constructor = "I'm being created"; `ngOnInit` = "my inputs are ready."

---

## 13. Component Composition

**React equivalent:** Identical. Components nest inside components.

```tsx
// React
<TaskList>
  <TaskForm onCreated={refetch} />
  {tasks.map(t => <TaskItem task={t} />)}
</TaskList>
```
```html
<!-- Angular -->
<app-task-list>
  <app-task-form (created)="refetch()"></app-task-form>
</app-task-list>
```

**Children projection** (React's `{children}`):
```tsx
<Card>{children}</Card>            // React
<app-card><ng-content></ng-content></app-card>  // Angular: ng-content
```

---

## 14. Feature Module Pattern

**React equivalent:** Folder-by-feature + barrel `index.ts` files.

```
React: src/features/tasks/index.ts (re-exports)
Angular: src/app/tasks/tasks.module.ts (declares + exports)
```

Both encourage grouping by domain (`/tasks`, `/users`) instead of by type (`/components`, `/services`).

---

## 15. Environment Configuration

**React equivalent:** `.env` files + `process.env.REACT_APP_*` (CRA) or `import.meta.env.VITE_*` (Vite).

```tsx
// React (Vite)
const apiUrl = import.meta.env.VITE_API_URL;
```
```ts
// Angular
import { environment } from '@env/environment';
const apiUrl = environment.serverUrl;
```

**Difference:** Angular uses **separate TS files** per environment (`environment.ts`, `environment.prod.ts`) and swaps them at build time via `angular.json` "fileReplacements." More type-safe, but no `.env` parsing.

---

## 16. Dev Proxy / CORS

**React equivalent:** Identical. CRA has a `proxy` field in `package.json`; Vite has `server.proxy` in `vite.config.ts`.

```js
// Vite
server: { proxy: { '/api': 'http://localhost:3000' } }
```
```js
// Angular (proxy.conf.js)
{ '/api': { target: 'http://localhost:3000' } }
```

Same concept: dev server intercepts `/api/*` calls and forwards them server-side, so the browser sees same-origin and CORS doesn't kick in.

---

## Big Mental Shifts from React

1. **Templates instead of JSX** — HTML files with magic syntax. Forces designer/dev separation.
2. **DI instead of imports** — declare what you need, Angular provides it. Better testing, more boilerplate.
3. **Observables instead of Promises** — streams over single values. Powerful but a learning curve.
4. **Modules instead of just imports** — extra registration step (going away with standalone components).
5. **No `setState`** — mutate properties directly. Angular's change detection auto-updates the view.
6. **Two-way binding exists** — `[(ngModel)]` is something React explicitly avoids.
7. **Decorators everywhere** — `@Component`, `@Injectable`, `@Input` instead of plain functions.
8. **Strong opinions on structure** — Angular dictates how you organize; React is library, not framework.

---

## TL;DR Cheat Sheet

| You'd reach for... | Angular gives you... |
|---|---|
| `useState` | Class property |
| `useEffect(fn, [])` | `ngOnInit()` |
| `useEffect cleanup` | `ngOnDestroy()` |
| Custom hook | Service |
| Context Provider | `providedIn: 'root'` |
| Props | `@Input` |
| Callback props | `@Output` + `EventEmitter` |
| `fetch` / `axios` | `HttpClient` |
| Promise | Observable |
| `.then()` | `.subscribe()` |
| React Router | `RouterModule` |
| `<Link>` | `routerLink` |
| `<Outlet />` | `<router-outlet>` |
| Controlled input | `[(ngModel)]` |
| `&&` rendering | `*ngIf` |
| `.map()` | `*ngFor` |
| `className` ternary | `[class.x]="..."` |
| `{children}` | `<ng-content>` |
| `.env` | `environment.ts` |
