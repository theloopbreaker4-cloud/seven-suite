# 📚 Полное руководство по структуре проекта Seven

## Содержание
1. [Введение](#введение)
2. [Общая архитектура](#общая-архитектура)
3. [Backend (NestJS) - Детальный разбор](#backend-nestjs)
4. [Frontend (Angular) - Детальный разбор](#frontend-angular)
5. [Аутентификация - Полный flow](#аутентификация)
6. [WebSocket - Реальное время](#websocket)
7. [База данных MongoDB](#база-данных-mongodb)
8. [Routing и Navigation](#routing-и-navigation)
9. [Обучающие примеры](#обучающие-примеры)

---

## Введение

**Seven** - это full-stack приложение, построенное по принципу **монорепозитория**:
- **Backend**: NestJS 11 (Node.js framework)
- **Frontend**: Angular 20 с SSR (Server-Side Rendering)
- **Database**: MongoDB через Mongoose ODM
- **Real-time**: WebSocket через Socket.IO
- **Authentication**: JWT (JSON Web Tokens)

```
Проект Seven
│
├── backend/          # NestJS API сервер
├── frontend/         # Angular приложение
├── shared/           # Общий код (enums, interfaces)
└── gulpfile.js       # Автоматизация синхронизации
```

---

## Общая архитектура

### Как работают запросы от пользователя до базы данных

```
[Браузер пользователя]
       ↓
   HTTP Request
       ↓
[Angular Frontend :4200]
       │
       ├─→ REST API запросы → [NestJS Backend :3000]
       │                             │
       │                             ├─→ Controllers (принимают запросы)
       │                             │         ↓
       │                             ├─→ Services (бизнес-логика)
       │                             │         ↓
       │                             ├─→ MongoDB (сохранение/чтение данных)
       │                             │
       └─→ WebSocket соединение ─→ [WebSocket Gateway]
                                          ↓
                                    Real-time события
```

### Стек технологий

| Технология | Версия | Назначение |
|-----------|--------|------------|
| NestJS | 11.1.3 | Backend framework (похож на Angular, но для сервера) |
| Angular | 20.0.4 | Frontend framework (SPA) |
| MongoDB | latest | NoSQL база данных |
| Mongoose | 8.9.5 | ODM для работы с MongoDB |
| Socket.IO | 4.8.1 | WebSocket для реального времени |
| JWT | - | Токены для авторизации |
| bcrypt | 5.1.1 | Хеширование паролей |
| TypeScript | 5.8.3 | Типизированный JavaScript |

---

## Backend (NestJS)

### Что такое NestJS?

NestJS - это framework для Node.js, который использует архитектурные паттерны Angular:
- **Модули** (Modules) - группировка функциональности
- **Контроллеры** (Controllers) - обработка HTTP запросов
- **Сервисы** (Services) - бизнес-логика
- **Dependency Injection** - автоматическое внедрение зависимостей

### Структура Backend

```
backend/src/
│
├── main.ts                   # Точка входа приложения
├── app.module.ts             # Корневой модуль
│
├── app/                      # Основная логика приложения
│   │
│   ├── auth/                 # 🔐 Модуль аутентификации
│   │   ├── auth.module.ts         # Регистрация auth модуля
│   │   ├── auth.controller.ts     # Endpoints: /login, /register
│   │   ├── auth.service.ts        # Логика: validateUser(), login(), register()
│   │   ├── strategies/            # Passport стратегии
│   │   │   ├── jwt.strategy.ts         # Проверка JWT токенов
│   │   │   └── local.strategy.ts       # Проверка email/password
│   │   └── guards/                # Guards для защиты роутов
│   │       ├── jwt-auth.guard.ts       # Требует JWT токен
│   │       └── local-auth.guard.ts     # Требует login credentials
│   │
│   ├── websockets/           # 🔌 WebSocket модуль
│   │   ├── websocket.module.ts    # Регистрация WebSocket модуля
│   │   ├── websocket.gateway.ts   # Socket.IO gateway (главный файл)
│   │   └── services/
│   │       ├── chat.service.ts         # Логика чата
│   │       └── notification.service.ts # Логика уведомлений
│   │
│   ├── modules/              # 📦 Другие модули
│   │   └── user.module.ts         # User модуль
│   │
│   ├── controllers/          # 🎯 HTTP Controllers
│   │   ├── app.controller.ts      # Главный controller
│   │   └── users.controller.ts    # CRUD операции с users
│   │
│   ├── services/             # ⚙️ Сервисы (бизнес-логика)
│   │   ├── app.service.ts         # Главный сервис
│   │   └── user.service.ts        # Работа с пользователями в БД
│   │
│   ├── schemas/              # 🗄️ Mongoose схемы (структура данных в MongoDB)
│   │   └── user.schema.ts         # Схема пользователя
│   │
│   ├── models/               # 📋 TypeScript модели
│   │   └── user.model.ts          # User model с типами
│   │
│   ├── interfaces/           # 📝 TypeScript interfaces
│   │   └── user.interface.ts      # IUser interface
│   │
│   ├── middleware/           # 🔀 Middleware (промежуточная обработка)
│   │   └── logging.interceptor.ts # Логирование запросов
│   │
│   └── config/               # ⚙️ Конфигурация
│       └── app-config.module.ts   # Загрузка переменных окружения
│
└── .env                      # Переменные окружения (не в git!)
```

### Детальный разбор: Как работает NestJS

#### 1. Точка входа: `main.ts`

```typescript
// Этот файл запускается первым при старте backend
async function bootstrap() {
  // Создаем NestJS приложение
  const app = await NestFactory.create(AppModule);

  // Включаем CORS (чтобы frontend мог делать запросы)
  app.enableCors();

  // Запускаем сервер на порту 3000
  await app.listen(3000);
}
```

**Что происходит:**
1. NestJS создает экземпляр приложения
2. Загружает AppModule (корневой модуль)
3. Регистрирует все модули, контроллеры, сервисы
4. Запускает HTTP сервер

#### 2. Корневой модуль: `app.module.ts`

```typescript
@Module({
  imports: [
    // Подключение к MongoDB
    MongooseModule.forRoot(process.env.DATABASE_HOST + process.env.DATABASE_NAME),

    // Конфигурация
    ConfigModule.forRoot(),

    // Модули нашего приложения
    UserModule,      // Управление пользователями
    AuthModule,      // Аутентификация
    WebsocketModule  // WebSocket
  ],
  controllers: [AppController],  // HTTP endpoints
  providers: [AppService],        // Сервисы
})
export class AppModule {}
```

**Что такое модуль?**
- Модуль - это класс с декоратором `@Module()`
- Группирует связанную функциональность
- Содержит: controllers, services, imports, exports

**Imports** - подключение других модулей
**Controllers** - обработчики HTTP запросов
**Providers** - сервисы с бизнес-логикой

#### 3. Controllers - обработка запросов

**Пример: `auth.controller.ts`**

```typescript
@Controller('auth')  // Базовый путь: /api/v1/auth
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /api/v1/auth/login
  @Post('login')
  @UseGuards(LocalAuthGuard)  // Проверка email/password
  async login(@Request() req) {
    // req.user уже валидирован в LocalAuthGuard
    return this.authService.login(req.user);
  }

  // POST /api/v1/auth/register
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }
}
```

**Декораторы в NestJS:**
- `@Controller('path')` - определяет базовый путь
- `@Post()`, `@Get()`, `@Put()`, `@Delete()` - HTTP методы
- `@Body()` - получить тело запроса
- `@Param('id')` - получить параметр из URL
- `@Query('page')` - получить query параметр
- `@UseGuards()` - защита роута (требует авторизации)

**Как работает запрос:**
```
1. Клиент отправляет: POST /api/v1/auth/login { email, password }
2. NestJS находит AuthController
3. Вызывает метод login()
4. LocalAuthGuard проверяет credentials
5. Если OK → вызывается authService.login()
6. Возвращается JWT токен
```

#### 4. Services - бизнес-логика

**Пример: `auth.service.ts`**

```typescript
@Injectable()  // Можно внедрять в другие классы
export class AuthService {
  constructor(
    private userService: UserService,  // DI (Dependency Injection)
    private jwtService: JwtService
  ) {}

  // Проверка email и пароля
  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) return null;

    // bcrypt.compare - сравнение хешированных паролей
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) return null;

    // Возвращаем пользователя БЕЗ пароля
    const { password: _, ...result } = user;
    return result;
  }

  // Создание JWT токена
  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user._id,  // sub = subject (ID пользователя)
      firstName: user.firstName,
      lastName: user.lastName
    };

    return {
      access_token: this.jwtService.sign(payload),  // Генерация токена
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    };
  }

  // Регистрация нового пользователя
  async register(registerDto: RegisterDto) {
    // userService.create() автоматически хеширует пароль
    const user = await this.userService.create(registerDto);

    return {
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    };
  }
}
```

**Что такое Dependency Injection (DI)?**
```typescript
// NestJS автоматически создает и передает зависимости
constructor(
  private userService: UserService,    // ← NestJS создает и внедряет
  private jwtService: JwtService       // ← автоматически
) {}

// Теперь можно использовать:
this.userService.findByEmail(email);
```

**Без DI пришлось бы:**
```typescript
const userService = new UserService();
const jwtService = new JwtService();
// Нужно вручную создавать все зависимости
```

#### 5. MongoDB и Mongoose

**Схема (Schema)** - структура документа в MongoDB

**Пример: `user.schema.ts`**

```typescript
export const UserSchema = new Schema<User>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,      // Уникальный email
      lowercase: true,   // Автоматически в lowercase
      trim: true         // Убирает пробелы
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'admin'],  // Только эти значения
      default: 'user'
    },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true  // Автоматически добавляет createdAt, updatedAt
  }
);

// Экспорт модели
export const UserModel = model<User>('User', UserSchema);
```

**Работа с MongoDB через UserService:**

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private userModel: Model<User>
  ) {}

  // Найти всех пользователей
  async findAll(): Promise<User[]> {
    return this.userModel
      .find()              // Найти все
      .select('-password') // Исключить поле password
      .exec();             // Выполнить запрос
  }

  // Найти по email
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .exec();
  }

  // Создать пользователя
  async create(userData: Partial<User>): Promise<User> {
    // Проверка на существование
    const existing = await this.findByEmail(userData.email);
    if (existing) {
      throw new ConflictException('User already exists');
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Создание документа
    const user = new this.userModel({
      ...userData,
      password: hashedPassword
    });

    // Сохранение в MongoDB
    await user.save();

    // Возврат без пароля
    return this.findById(user._id.toString());
  }

  // Обновить пользователя
  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,              // ID документа
        updateData,      // Новые данные
        { new: true }    // Вернуть обновленный документ
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Удалить пользователя
  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return { deleted: true };
  }
}
```

**Mongoose методы:**
- `find()` - найти все документы
- `findOne({ email })` - найти один документ по условию
- `findById(id)` - найти по ID
- `findByIdAndUpdate()` - найти и обновить
- `findByIdAndDelete()` - найти и удалить
- `create()` или `new Model()` + `save()` - создать документ

#### 6. Guards и Strategies (Защита роутов)

**JWT Strategy** - проверка токена

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET
    });
  }

  // Вызывается автоматически после проверки токена
  async validate(payload: any) {
    // payload содержит данные из токена
    return {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.firstName
    };
  }
}
```

**Local Strategy** - проверка email/password

```typescript
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });  // Используем email вместо username
  }

  // Вызывается при логине
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;  // Передается в req.user
  }
}
```

**Guards** - используются в контроллерах

```typescript
// Защита роута JWT токеном
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;  // Доступ к пользователю из токена
}

// Защита роута email/password
@UseGuards(LocalAuthGuard)
@Post('login')
login(@Request() req) {
  return req.user;  // Пользователь уже валидирован
}
```

---

## Frontend (Angular)

### Что такое Angular?

Angular - это framework для создания SPA (Single Page Applications):
- **Components** - UI блоки
- **Services** - логика и HTTP запросы
- **Modules** - группировка компонентов
- **Routing** - навигация между страницами
- **Dependency Injection** - автоматическое внедрение сервисов

### Структура Frontend

```
frontend/src/
│
├── main.ts                        # Точка входа
├── app/
│   │
│   ├── app.component.ts           # Корневой компонент
│   ├── app.module.ts              # Корневой модуль
│   ├── app-routing.module.ts      # Роутинг
│   │
│   ├── components/                # 🎨 UI Компоненты
│   │   │
│   │   ├── accounts/              # Компоненты авторизации
│   │   │   ├── signin/
│   │   │   │   ├── signin.component.ts       # TypeScript логика
│   │   │   │   ├── signin.component.html     # HTML шаблон
│   │   │   │   └── signin.component.less     # Стили
│   │   │   └── signup/
│   │   │       ├── signup.component.ts
│   │   │       ├── signup.component.html
│   │   │       └── signup.component.less
│   │   │
│   │   ├── page-pieces/           # Части страницы
│   │   │   ├── header/                   # Шапка сайта
│   │   │   ├── footer/                   # Подвал
│   │   │   ├── navigation/               # Навигация
│   │   │   └── layout/                   # Общий layout
│   │   │
│   │   ├── modal/                 # Модальные окна
│   │   └── loading/               # Индикатор загрузки
│   │
│   ├── pages/                     # 📄 Страницы приложения
│   │   ├── main-page/                    # Главная страница
│   │   ├── account-page/                 # Личный кабинет
│   │   ├── error404-page/                # Страница 404
│   │   ├── faq-page/                     # FAQ
│   │   └── support-page/                 # Поддержка
│   │
│   ├── services/                  # ⚙️ Сервисы (логика)
│   │   ├── auth.service.ts               # Авторизация
│   │   ├── websocket.service.ts          # WebSocket
│   │   ├── http.service.ts               # HTTP запросы
│   │   └── user.service.ts               # Работа с пользователями
│   │
│   ├── guards/                    # 🛡️ Route Guards (защита роутов)
│   │   └── auth.guard.ts                 # Проверка авторизации
│   │
│   ├── interceptors/              # 🔀 HTTP Interceptors
│   │   └── auth.interceptor.ts           # Добавляет JWT к запросам
│   │
│   ├── models/                    # 📋 TypeScript модели
│   │   └── user.model.ts
│   │
│   └── shared/                    # Общие файлы
│       ├── enums/                        # Перечисления
│       └── interfaces/                   # Интерфейсы
│
└── environments/                  # Конфигурация окружений
    ├── environment.ts                    # Development
    └── environment.prod.ts               # Production
```

### Детальный разбор Angular

#### 1. Компонент - основа Angular

**Компонент = TypeScript класс + HTML шаблон + CSS стили**

**Пример: `signin.component.ts`**

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signin',        // Как использовать: <app-signin></app-signin>
  templateUrl: './signin.component.html',  // HTML шаблон
  styleUrls: ['./signin.component.less'],  // Стили
  standalone: false               // Не standalone компонент
})
export class SigninComponent implements OnInit {
  // Форма для логина
  signinForm!: FormGroup;

  // Состояния компонента
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  returnUrl = '/';

  // Dependency Injection
  constructor(
    private formBuilder: FormBuilder,   // Для создания форм
    private authService: AuthService,   // Для авторизации
    private router: Router,              // Для навигации
    private route: ActivatedRoute        // Для параметров роута
  ) {}

  // Жизненный цикл: вызывается при создании компонента
  ngOnInit(): void {
    // Получить URL для редиректа после логина
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Если уже авторизован - редирект
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }

    // Создать форму
    this.createForm();
  }

  // Создание reactive формы
  private createForm(): void {
    this.signinForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  // Обработка отправки формы
  onSubmit(): void {
    if (this.signinForm.invalid) {
      this.markFormGroupTouched(this.signinForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password, rememberMe } = this.signinForm.value;

    // Вызов сервиса авторизации
    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Сохранение токена
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('access_token', response.access_token);

        // Редирект
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Invalid email or password';
      }
    });
  }

  // Getter для доступа к контролам формы в шаблоне
  get f() {
    return this.signinForm.controls;
  }
}
```

**HTML шаблон: `signin.component.html`**

```html
<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <h1>Welcome Back</h1>
      <p>Sign in to continue to Seven</p>
    </div>

    <!-- Сообщение об ошибке (показывается если errorMessage не пустая) -->
    <div class="alert alert-error" *ngIf="errorMessage">
      {{ errorMessage }}
    </div>

    <!-- Reactive Form -->
    <form [formGroup]="signinForm" (ngSubmit)="onSubmit()" class="auth-form">

      <!-- Email поле -->
      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          type="email"
          id="email"
          formControlName="email"
          placeholder="Enter your email"
          [class.invalid]="f['email'].invalid && f['email'].touched"
        />

        <!-- Сообщения валидации -->
        <div class="error-message" *ngIf="f['email'].invalid && f['email'].touched">
          <span *ngIf="f['email'].errors?.['required']">Email is required</span>
          <span *ngIf="f['email'].errors?.['email']">Please enter a valid email</span>
        </div>
      </div>

      <!-- Password поле -->
      <div class="form-group">
        <label for="password">Password</label>
        <div class="password-input">
          <input
            [type]="hidePassword ? 'password' : 'text'"
            id="password"
            formControlName="password"
            placeholder="Enter your password"
            [class.invalid]="f['password'].invalid && f['password'].touched"
          />
          <button
            type="button"
            class="toggle-password"
            (click)="hidePassword = !hidePassword"
          >
            {{ hidePassword ? '👁️' : '🙈' }}
          </button>
        </div>
      </div>

      <!-- Remember Me -->
      <div class="form-options">
        <label class="remember-me">
          <input type="checkbox" formControlName="rememberMe" />
          Remember me
        </label>
        <a href="/forgot-password">Forgot Password?</a>
      </div>

      <!-- Submit кнопка -->
      <button
        type="submit"
        class="btn-primary"
        [disabled]="isLoading"
      >
        <span *ngIf="!isLoading">Sign In</span>
        <span *ngIf="isLoading">Signing In...</span>
      </button>

      <!-- Ссылка на регистрацию -->
      <div class="auth-footer">
        <p>Don't have an account? <a routerLink="/register">Create Account</a></p>
      </div>
    </form>
  </div>
</div>
```

**Angular директивы в шаблоне:**
- `*ngIf="condition"` - условный рендеринг
- `*ngFor="let item of items"` - цикл
- `[property]="value"` - binding свойства
- `(event)="handler()"` - обработка событий
- `[(ngModel)]="variable"` - two-way binding
- `[formGroup]="form"` - reactive форма
- `formControlName="name"` - контрол формы
- `routerLink="/path"` - навигация

#### 2. Сервисы - логика приложения

**Пример: `auth.service.ts`**

```typescript
@Injectable({
  providedIn: 'root'  // Singleton во всем приложении
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/v1/auth';

  // BehaviorSubject - Observable с начальным значением
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    // Инициализация пользователя из токена
    const token = this.getToken();
    const user = token ? this.decodeToken(token) : null;
    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Получить текущего пользователя
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Логин
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        map(response => {
          // Декодировать токен и обновить пользователя
          if (response.access_token) {
            const user = this.decodeToken(response.access_token);
            this.currentUserSubject.next(user);
          }
          return response;
        })
      );
  }

  // Регистрация
  register(data: RegisterData): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, data);
  }

  // Выход
  logout(): void {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
  }

  // Проверка авторизации
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  // Получить токен
  getToken(): string | null {
    return localStorage.getItem('access_token') ||
           sessionStorage.getItem('access_token');
  }

  // Декодирование JWT токена
  private decodeToken(token: string): User | null {
    try {
      const payload = token.split('.')[1];  // Средняя часть JWT
      const decoded = JSON.parse(atob(payload));  // base64 decode

      return {
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName
      };
    } catch (error) {
      return null;
    }
  }

  // Проверка истечения токена
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate < new Date();
    } catch {
      return true;
    }
  }
}
```

**RxJS Observables:**
```typescript
// Observable - поток данных
this.authService.login(email, password)
  .subscribe({
    next: (data) => {
      // Успех
    },
    error: (err) => {
      // Ошибка
    },
    complete: () => {
      // Завершение
    }
  });

// Операторы RxJS
import { map, filter, catchError } from 'rxjs/operators';

this.http.get('/api/users')
  .pipe(
    map(users => users.filter(u => u.isActive)),  // Преобразование
    catchError(error => of([]))                    // Обработка ошибок
  )
  .subscribe(activeUsers => {
    // Активные пользователи
  });
```

#### 3. Routing - навигация

**`app-routing.module.ts`**

```typescript
const routes: Routes = [
  { path: '', component: MainPageComponent },  // Главная страница

  // Публичные роуты
  { path: 'login', component: SigninComponent },
  { path: 'register', component: SignupComponent },
  { path: 'faq', component: FaqPageComponent },
  { path: 'support', component: SupportPageComponent },

  // Защищенные роуты (требуют авторизации)
  {
    path: 'account',
    component: AccountPageComponent,
    canActivate: [AuthGuard]  // Guard проверяет авторизацию
  },

  // 404 страница
  { path: '**', component: Error404PageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

**Guard - защита роутов:**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Проверка авторизации
    if (this.authService.isAuthenticated()) {
      return true;  // Разрешить доступ
    }

    // Редирект на логин с сохранением URL
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });

    return false;  // Запретить доступ
  }
}
```

**Навигация в коде:**

```typescript
// Простая навигация
this.router.navigate(['/account']);

// С параметрами
this.router.navigate(['/user', userId]);

// С query параметрами
this.router.navigate(['/search'], {
  queryParams: { q: 'angular', page: 1 }
});

// В шаблоне
<a routerLink="/account">Account</a>
<a [routerLink]="['/user', user.id]">User Profile</a>
```

---

## Аутентификация - Полный Flow

### 1. Регистрация нового пользователя

```
[Frontend]                          [Backend]                    [MongoDB]
    │                                   │                            │
    │ 1. Заполнение формы               │                            │
    │    signup.component.html          │                            │
    │                                   │                            │
    │ 2. Валидация формы                │                            │
    │    (Angular Validators)           │                            │
    │                                   │                            │
    │ 3. POST /api/v1/auth/register     │                            │
    │    { email, password,             │                            │
    │      firstName, lastName }        │                            │
    ├──────────────────────────────────>│                            │
    │                                   │ 4. AuthController.register │
    │                                   │                            │
    │                                   │ 5. AuthService.register    │
    │                                   │                            │
    │                                   │ 6. UserService.create      │
    │                                   │    - Проверка на дубликат  │
    │                                   │    - Хеширование пароля    │
    │                                   │    (bcrypt.hash)           │
    │                                   ├───────────────────────────>│
    │                                   │                            │ 7. Сохранение
    │                                   │                            │    user в БД
    │                                   │<───────────────────────────┤
    │                                   │ 8. Возврат user без пароля │
    │<──────────────────────────────────┤                            │
    │ 9. Успешное сообщение             │                            │
    │    Redirect на /login             │                            │
```

**Код Frontend (signup.component.ts):**

```typescript
onSubmit(): void {
  const { email, password, firstName, lastName } = this.signupForm.value;

  this.authService.register({ email, password, firstName, lastName }).subscribe({
    next: (response) => {
      this.successMessage = 'Registration successful!';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    },
    error: (error) => {
      this.errorMessage = error.error?.message || 'Registration failed';
    }
  });
}
```

**Код Backend (auth.controller.ts → auth.service.ts → user.service.ts):**

```typescript
// Controller
@Post('register')
async register(@Body() body: RegisterDto) {
  return this.authService.register(body);
}

// AuthService
async register(registerDto: RegisterDto) {
  const user = await this.userService.create(registerDto);
  return {
    message: 'User registered successfully',
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }
  };
}

// UserService
async create(userData: Partial<User>): Promise<User> {
  // Проверка дубликата
  const existing = await this.findByEmail(userData.email);
  if (existing) {
    throw new ConflictException('User already exists');
  }

  // Хеширование пароля
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Создание и сохранение
  const user = new this.userModel({
    ...userData,
    password: hashedPassword
  });

  await user.save();
  return user;
}
```

### 2. Вход (Login)

```
[Frontend]                          [Backend]                    [MongoDB]
    │                                   │                            │
    │ 1. POST /api/v1/auth/login        │                            │
    │    { email, password }            │                            │
    ├──────────────────────────────────>│                            │
    │                                   │ 2. LocalAuthGuard          │
    │                                   │    ↓                       │
    │                                   │ 3. LocalStrategy.validate  │
    │                                   │    ↓                       │
    │                                   │ 4. AuthService.validateUser│
    │                                   ├───────────────────────────>│
    │                                   │                            │ 5. Поиск user
    │                                   │<───────────────────────────┤    по email
    │                                   │ 6. bcrypt.compare          │
    │                                   │    (password, hash)        │
    │                                   │    ↓                       │
    │                                   │ 7. If OK → AuthService.login
    │                                   │    ↓                       │
    │                                   │ 8. JWT token generation    │
    │                                   │    jwtService.sign(payload)│
    │<──────────────────────────────────┤                            │
    │ 9. Получение { access_token }     │                            │
    │    ↓                              │                            │
    │ 10. Сохранение токена             │                            │
    │     localStorage/sessionStorage   │                            │
    │    ↓                              │                            │
    │ 11. Redirect на главную           │                            │
```

**Код Frontend:**

```typescript
this.authService.login(email, password).subscribe({
  next: (response) => {
    // Сохранение токена
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('access_token', response.access_token);

    // Редирект
    this.router.navigate([this.returnUrl]);
  },
  error: (error) => {
    this.errorMessage = 'Invalid email or password';
  }
});
```

**Код Backend:**

```typescript
// LocalStrategy проверяет credentials
async validate(email: string, password: string): Promise<any> {
  const user = await this.authService.validateUser(email, password);
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }
  return user;  // → req.user
}

// AuthService создает JWT
async login(user: any) {
  const payload = {
    email: user.email,
    sub: user._id,
    firstName: user.firstName,
    lastName: user.lastName
  };

  return {
    access_token: this.jwtService.sign(payload)
  };
}
```

### 3. Доступ к защищенным роутам

```
[Frontend]                                [Backend]
    │                                        │
    │ 1. HTTP Request с JWT токеном          │
    │    Authorization: Bearer <token>       │
    ├───────────────────────────────────────>│
    │                                        │ 2. JwtAuthGuard
    │                                        │    ↓
    │                                        │ 3. JwtStrategy.validate
    │                                        │    - Извлечение токена
    │                                        │    - Проверка подписи
    │                                        │    - Декодирование payload
    │                                        │    - Проверка exp (истечение)
    │                                        │    ↓
    │                                        │ 4. req.user = decoded payload
    │                                        │    ↓
    │                                        │ 5. Controller метод
    │<───────────────────────────────────────┤    Доступ к req.user
    │ 6. Защищенные данные                   │
```

**Добавление токена к запросам (Interceptor):**

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      // Клонируем запрос и добавляем Authorization header
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }
}
```

**Backend защита:**

```typescript
@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard)  // Требует JWT токен
  @Get('profile')
  getProfile(@Request() req) {
    // req.user доступен благодаря JwtStrategy
    return req.user;
  }
}
```

---

## WebSocket - Реальное время

### Архитектура WebSocket

```
[Frontend Client 1]                      [Backend]
        │                                    │
        │ 1. socket.io-client                │
        │    io('http://localhost:3000')     │
        ├───────────────────────────────────>│
        │                                    │ WebsocketGateway
        │                                    │ @WebSocketGateway()
        │<───────────────────────────────────┤
        │ 2. Connection established          │
        │    clientId = socket.id            │
        │                                    │
[Frontend Client 2]                        │
        │                                    │
        ├───────────────────────────────────>│
        │                                    │
        │<───────────────────────────────────┤
        │                                    │
        │                                    │
    [События]                           [События]
        │                                    │
        │ 3. socket.emit('chat:message', {}) │
        ├───────────────────────────────────>│
        │                                    │ @SubscribeMessage('chat:message')
        │                                    │ handleChatMessage(@MessageBody() data)
        │                                    │    ↓
        │                                    │ Broadcast to all clients
        │                                    │    ↓
        │<───────────────────────────────────┤ server.emit('chat:message', data)
[Client 2]                                  │
        │<───────────────────────────────────┤
```

### Backend WebSocket Gateway

**`websocket.gateway.ts`**

```typescript
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/'
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;  // Socket.IO server

  private logger: Logger = new Logger('WebsocketGateway');

  // Хранение подключенных клиентов
  private connectedClients: Map<string, Socket> = new Map();

  constructor(
    private chatService: ChatService,
    private notificationService: NotificationService
  ) {}

  // Событие: Новое подключение
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Отправка приветствия
    client.emit('connection:established', {
      clientId: client.id,
      message: 'Welcome to Seven WebSocket server'
    });
  }

  // Событие: Отключение
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  // Обработка сообщения чата
  @SubscribeMessage('chat:message')
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { message: string; username?: string; roomId?: string }
  ) {
    // Валидация и обработка через сервис
    const processedMessage = this.chatService.handleMessage(payload.message);

    const messageData = {
      from: client.id,
      username: payload.username || 'Anonymous',
      message: processedMessage,
      timestamp: new Date().toISOString()
    };

    if (payload.roomId) {
      // Отправка в комнату
      this.server.to(payload.roomId).emit('room:message', messageData);
    } else {
      // Broadcast всем клиентам
      this.server.emit('chat:message', messageData);
    }

    return { success: true };
  }

  // Приватное сообщение
  @SubscribeMessage('chat:private')
  handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetClientId: string; message: string }
  ) {
    const targetSocket = this.connectedClients.get(payload.targetClientId);

    if (targetSocket) {
      targetSocket.emit('chat:private', {
        from: client.id,
        message: payload.message,
        timestamp: new Date().toISOString()
      });

      return { success: true };
    }

    return { success: false, message: 'Target user not connected' };
  }

  // Вход в комнату
  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; username?: string }
  ) {
    await client.join(payload.roomId);

    this.logger.log(`Client ${client.id} joined room ${payload.roomId}`);

    // Уведомление всех в комнате
    this.server.to(payload.roomId).emit('room:user-joined', {
      clientId: client.id,
      username: payload.username || 'Anonymous',
      roomId: payload.roomId
    });

    return { success: true, roomId: payload.roomId };
  }

  // Выход из комнаты
  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string }
  ) {
    await client.leave(payload.roomId);

    this.server.to(payload.roomId).emit('room:user-left', {
      clientId: client.id,
      roomId: payload.roomId
    });

    return { success: true };
  }

  // Отправка уведомления
  @SubscribeMessage('notification:send')
  async handleSendNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      targetClientId: string;
      title: string;
      message: string;
      type?: NotificationType;
    }
  ) {
    const notification = await this.notificationService.createNotification({
      from: client.id,
      ...payload,
      timestamp: new Date().toISOString()
    });

    const targetSocket = this.connectedClients.get(payload.targetClientId);
    if (targetSocket) {
      targetSocket.emit('notification:received', notification);
      return { success: true, notification };
    }

    return { success: false, message: 'Target user not connected' };
  }

  // Utility: Broadcast всем
  broadcastToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }

  // Utility: Отправка в комнату
  broadcastToRoom(roomId: string, event: string, data: any): void {
    this.server.to(roomId).emit(event, data);
  }

  // Utility: Отправка конкретному клиенту
  sendToClient(clientId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.emit(event, data);
    }
  }
}
```

### Frontend WebSocket Service

**`websocket.service.ts`**

```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: Socket | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);

  // URL backend WebSocket сервера
  private readonly WS_URL = 'http://localhost:3000';

  constructor() {}

  // Подключение к серверу
  connect(): void {
    if (this.socket?.connected) {
      console.log('Already connected');
      return;
    }

    this.socket = io(this.WS_URL, {
      transports: ['websocket', 'polling'],  // Способы подключения
      autoConnect: true
    });

    // События подключения
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected$.next(false);
    });

    this.socket.on('connection:established', (data) => {
      console.log('Connection established:', data);
    });
  }

  // Отключение
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
    }
  }

  // Отправка сообщения в чат
  sendMessage(message: string, username?: string, roomId?: string): void {
    if (!this.socket) return;

    this.socket.emit('chat:message', {
      message,
      username,
      roomId
    });
  }

  // Получение сообщений чата (Observable)
  onChatMessage(): Observable<ChatMessage> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.on('chat:message', (data: ChatMessage) => {
        observer.next(data);
      });

      // Cleanup при unsubscribe
      return () => {
        this.socket?.off('chat:message');
      };
    });
  }

  // Приватное сообщение
  sendPrivateMessage(targetClientId: string, message: string): void {
    this.socket?.emit('chat:private', { targetClientId, message });
  }

  // Получение приватных сообщений
  onPrivateMessage(): Observable<ChatMessage> {
    return new Observable(observer => {
      this.socket?.on('chat:private', (data: ChatMessage) => {
        observer.next(data);
      });

      return () => this.socket?.off('chat:private');
    });
  }

  // Вход в комнату
  joinRoom(roomId: string, username?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject('Socket not connected');
        return;
      }

      this.socket.emit('room:join', { roomId, username }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(response.message);
        }
      });
    });
  }

  // Отправка уведомления
  sendNotification(
    targetClientId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): void {
    this.socket?.emit('notification:send', {
      targetClientId,
      title,
      message,
      type
    });
  }

  // Получение уведомлений
  onNotification(): Observable<Notification> {
    return new Observable(observer => {
      this.socket?.on('notification:received', (data: Notification) => {
        observer.next(data);
      });

      return () => this.socket?.off('notification:received');
    });
  }

  // Проверка подключения
  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  // Получить ID клиента
  getClientId(): string | undefined {
    return this.socket?.id;
  }
}
```

### Использование WebSocket в компоненте

```typescript
@Component({
  selector: 'app-chat',
  template: `
    <div class="chat-container">
      <div class="messages">
        <div *ngFor="let msg of messages" class="message">
          <strong>{{ msg.username }}:</strong> {{ msg.message }}
          <small>{{ msg.timestamp | date:'short' }}</small>
        </div>
      </div>

      <div class="input-area">
        <input
          [(ngModel)]="newMessage"
          (keyup.enter)="sendMessage()"
          placeholder="Type a message..."
        />
        <button (click)="sendMessage()">Send</button>
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  newMessage = '';

  private subscription: Subscription;

  constructor(private wsService: WebSocketService) {}

  ngOnInit(): void {
    // Подключение к WebSocket
    this.wsService.connect();

    // Подписка на сообщения
    this.subscription = this.wsService.onChatMessage().subscribe(
      (message) => {
        this.messages.push(message);
      }
    );
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    this.wsService.sendMessage(this.newMessage, 'User123');
    this.newMessage = '';
  }

  ngOnDestroy(): void {
    // Отписка и отключение
    this.subscription?.unsubscribe();
    this.wsService.disconnect();
  }
}
```

---

## База данных MongoDB

### Структура документов

**User Collection:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa",
  "role": "user",
  "isActive": true,
  "createdAt": ISODate("2025-10-26T00:00:00.000Z"),
  "updatedAt": ISODate("2025-10-26T00:00:00.000Z")
}
```

### Mongoose Queries

```typescript
// CREATE
const user = await this.userModel.create({
  firstName: 'John',
  email: 'john@example.com'
});

// READ - один документ
const user = await this.userModel.findOne({ email: 'john@example.com' }).exec();

// READ - все документы
const users = await this.userModel.find({ isActive: true }).exec();

// READ - с условиями и сортировкой
const users = await this.userModel
  .find({ role: 'user' })
  .sort({ createdAt: -1 })   // Сортировка по дате (новые первые)
  .limit(10)                  // Лимит 10 документов
  .skip(20)                   // Пропустить первые 20 (пагинация)
  .select('firstName email')  // Выбрать только эти поля
  .exec();

// UPDATE
const user = await this.userModel
  .findByIdAndUpdate(
    userId,
    { firstName: 'Jane' },
    { new: true }  // Вернуть обновленный документ
  )
  .exec();

// DELETE
await this.userModel.findByIdAndDelete(userId).exec();

// COUNT
const count = await this.userModel.countDocuments({ isActive: true }).exec();

// AGGREGATE (сложные запросы)
const stats = await this.userModel.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: '$role', count: { $sum: 1 } } }
]).exec();
```

---

## Обучающие примеры

### Пример 1: Создание нового модуля "Posts"

**Backend:**

```bash
# 1. Создаем структуру файлов
backend/src/app/
├── posts/
│   ├── post.module.ts
│   ├── post.controller.ts
│   ├── post.service.ts
│   ├── post.schema.ts
│   └── post.interface.ts
```

**post.schema.ts:**

```typescript
import { Schema, model } from 'mongoose';

export interface Post {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PostSchema = new Schema<Post>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' }  // Связь с User
  },
  { timestamps: true }
);

export const PostModel = model<Post>('Post', PostSchema);
```

**post.service.ts:**

```typescript
@Injectable()
export class PostService {
  constructor(@InjectModel('Post') private postModel: Model<Post>) {}

  async findAll(): Promise<Post[]> {
    return this.postModel
      .find()
      .populate('author', 'firstName lastName email')  // Подтянуть автора
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const post = new this.postModel({
      ...createPostDto,
      author: userId
    });

    return post.save();
  }
}
```

**post.controller.ts:**

```typescript
@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)  // Требует авторизации
  create(
    @Body() createPostDto: CreatePostDto,
    @Request() req
  ) {
    return this.postService.create(createPostDto, req.user.userId);
  }
}
```

**post.module.ts:**

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Post', schema: PostSchema }])
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService]
})
export class PostModule {}
```

**Регистрация в app.module.ts:**

```typescript
@Module({
  imports: [
    // ...
    PostModule  // Добавляем новый модуль
  ],
  // ...
})
export class AppModule {}
```

### Пример 2: Добавление страницы в Angular

**Frontend:**

```bash
# Генерация компонента (если установлен Angular CLI)
cd frontend
ng generate component pages/posts-page
```

**posts-page.component.ts:**

```typescript
@Component({
  selector: 'app-posts-page',
  templateUrl: './posts-page.component.html',
  styleUrls: ['./posts-page.component.less']
})
export class PostsPageComponent implements OnInit {
  posts: Post[] = [];
  isLoading = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.http.get<Post[]>('http://localhost:3000/api/v1/posts')
      .subscribe({
        next: (posts) => {
          this.posts = posts;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading posts:', err);
          this.isLoading = false;
        }
      });
  }
}
```

**posts-page.component.html:**

```html
<div class="posts-container">
  <h1>Blog Posts</h1>

  <div *ngIf="isLoading" class="loading">
    Loading posts...
  </div>

  <div *ngIf="!isLoading" class="posts-list">
    <div *ngFor="let post of posts" class="post-card">
      <h2>{{ post.title }}</h2>
      <p>{{ post.content }}</p>
      <div class="post-meta">
        <span>By: {{ post.author.firstName }} {{ post.author.lastName }}</span>
        <span>{{ post.createdAt | date:'medium' }}</span>
      </div>
    </div>
  </div>

  <div *ngIf="!isLoading && posts.length === 0" class="no-posts">
    No posts yet.
  </div>
</div>
```

**Добавление роута (app-routing.module.ts):**

```typescript
const routes: Routes = [
  // ...
  { path: 'posts', component: PostsPageComponent },
  // ...
];
```

---

## Итоги

Теперь у вас есть полное понимание структуры проекта Seven:

### Backend (NestJS):
1. **Модули** - группировка функциональности
2. **Controllers** - обработка HTTP запросов
3. **Services** - бизнес-логика
4. **Schemas** - структура данных MongoDB
5. **Guards/Strategies** - авторизация и защита

### Frontend (Angular):
1. **Components** - UI блоки
2. **Services** - HTTP запросы и логика
3. **Routing** - навигация
4. **Guards** - защита роутов
5. **Interceptors** - модификация запросов

### WebSocket:
1. **Gateway** (backend) - обработка событий
2. **Service** (frontend) - подключение и отправка событий
3. **Real-time** - мгновенная синхронизация

### MongoDB:
1. **Schemas** - структура документов
2. **Mongoose** - ODM для работы с БД
3. **Queries** - CRUD операции

### Аутентификация:
1. **JWT** - токены для авторизации
2. **bcrypt** - хеширование паролей
3. **Guards** - защита роутов
4. **Interceptors** - добавление токенов к запросам

---

## Дополнительные ресурсы

- NestJS Документация: https://docs.nestjs.com/
- Angular Документация: https://angular.io/docs
- MongoDB Документация: https://docs.mongodb.com/
- Socket.IO Документация: https://socket.io/docs/
- Mongoose Документация: https://mongoosejs.com/docs/

---

*Документ создан для обучения и понимания архитектуры проекта Seven*
