# WebSocket Implementation Guide

**Project**: Seven
**Author**: TheLoopBreaker (prgera)
**Created**: 2025-10-26

---

## Обзор

Проект включает полнофункциональную систему WebSocket с поддержкой:
- **Чат** (глобальный, приватный, по комнатам)
- **Уведомления** (real-time notifications)
- **Typing indicators** (индикатор печати)
- **Room management** (управление комнатами)
- **Real-time data updates** (обновления данных в реальном времени)

---

## Backend (NestJS)

### Структура файлов

```
backend/src/app/websockets/
├── websocket.gateway.ts          # Main WebSocket gateway
├── websocket.module.ts            # WebSocket module
└── services/
    ├── chat.service.ts           # Chat message handling
    └── notification.service.ts   # Notification management
```

### Доступные события (Backend)

#### Chat Events
- `chat:message` - Отправить сообщение всем/в комнату
- `chat:private` - Отправить приватное сообщение
- `chat:typing` - Индикатор печати

#### Room Events
- `room:join` - Присоединиться к комнате
- `room:leave` - Покинуть комнату
- `room:user-joined` - Уведомление о присоединении пользователя
- `room:user-left` - Уведомление об уходе пользователя

#### Notification Events
- `notification:send` - Отправить уведомление
- `notification:received` - Получить уведомление

#### Data Subscription Events
- `data:subscribe` - Подписаться на обновления данных
- `data:unsubscribe` - Отписаться от обновлений

#### Connection Events
- `connection:success` - Успешное подключение
- `user:connected` - Пользователь подключился
- `user:disconnected` - Пользователь отключился

---

## Frontend (Angular)

### Установка Socket.IO Client

```bash
cd frontend
npm install socket.io-client
```

### WebSocketService

Готовый сервис доступен: [frontend/src/app/services/websocket.service.ts](frontend/src/app/services/websocket.service.ts)

---

## Примеры использования

### 1. Подключение к WebSocket

#### Angular Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from './services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit, OnDestroy {
  connected = false;
  clientId: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private wsService: WebSocketService) {}

  ngOnInit() {
    // Connect to WebSocket
    this.wsService.connect();

    // Subscribe to connection status
    this.subscriptions.push(
      this.wsService.isConnected().subscribe((status) => {
        this.connected = status;
        console.log('Connection status:', status);
      })
    );

    // Get client ID
    this.subscriptions.push(
      this.wsService.getClientId().subscribe((id) => {
        this.clientId = id;
        console.log('Client ID:', id);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.wsService.disconnect();
  }
}
```

---

### 2. Отправка и получение сообщений чата

```typescript
export class ChatComponent implements OnInit {
  messages: ChatMessage[] = [];
  messageText = '';
  username = 'User123';

  ngOnInit() {
    // Listen for incoming messages
    this.wsService.onChatMessage().subscribe((message) => {
      this.messages.push(message);
      console.log('New message:', message);
    });
  }

  sendMessage() {
    if (this.messageText.trim()) {
      this.wsService.sendMessage(this.messageText, this.username);
      this.messageText = '';
    }
  }
}
```

**HTML Template:**

```html
<div class="chat-container">
  <div class="messages">
    <div *ngFor="let msg of messages" class="message">
      <strong>{{ msg.username }}:</strong> {{ msg.message }}
      <small>{{ msg.timestamp | date:'short' }}</small>
    </div>
  </div>

  <div class="input-area">
    <input
      [(ngModel)]="messageText"
      (keyup.enter)="sendMessage()"
      placeholder="Type a message..."
    />
    <button (click)="sendMessage()">Send</button>
  </div>
</div>
```

---

### 3. Работа с комнатами (Rooms)

```typescript
export class ChatRoomComponent implements OnInit {
  currentRoom: string | null = null;

  async joinRoom(roomId: string) {
    try {
      const result = await this.wsService.joinRoom(roomId, this.username);
      console.log('Joined room:', result);
      this.currentRoom = roomId;
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  }

  async leaveRoom() {
    if (this.currentRoom) {
      await this.wsService.leaveRoom(this.currentRoom);
      this.currentRoom = null;
    }
  }

  sendRoomMessage() {
    this.wsService.sendMessage(this.messageText, this.username, this.currentRoom);
  }

  ngOnInit() {
    // Listen for users joining room
    this.wsService.onUserJoinedRoom().subscribe((data) => {
      console.log(`${data.username} joined room ${data.roomId}`);
    });

    // Listen for users leaving room
    this.wsService.onUserLeftRoom().subscribe((data) => {
      console.log(`User left room ${data.roomId}`);
    });
  }
}
```

---

### 4. Приватные сообщения

```typescript
export class PrivateChatComponent {
  targetClientId = '';

  sendPrivateMessage(message: string) {
    this.wsService.sendPrivateMessage(this.targetClientId, message);
  }

  ngOnInit() {
    // Listen for private messages
    this.wsService.onPrivateMessage().subscribe((message) => {
      console.log('Private message from:', message.from);
      console.log('Message:', message.message);
      // Show notification or add to private chat window
    });
  }
}
```

---

### 5. Индикатор печати (Typing Indicator)

```typescript
export class ChatComponent {
  typingUsers = new Set<string>();
  private typingTimeout: any;

  onTyping() {
    // Send typing indicator
    this.wsService.sendTypingIndicator(true);

    // Clear previous timeout
    clearTimeout(this.typingTimeout);

    // Stop typing after 2 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.wsService.sendTypingIndicator(false);
    }, 2000);
  }

  ngOnInit() {
    // Listen for typing indicators
    this.wsService.onTypingIndicator().subscribe((data) => {
      if (data.isTyping) {
        this.typingUsers.add(data.clientId);
      } else {
        this.typingUsers.delete(data.clientId);
      }
    });
  }
}
```

**HTML:**

```html
<input
  [(ngModel)]="messageText"
  (input)="onTyping()"
  placeholder="Type a message..."
/>

<div *ngIf="typingUsers.size > 0" class="typing-indicator">
  {{ typingUsers.size }} user(s) typing...
</div>
```

---

### 6. Уведомления

```typescript
export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];

  ngOnInit() {
    // Listen for notifications
    this.wsService.onNotification().subscribe((notification) => {
      this.notifications.push(notification);
      this.showNotification(notification);
    });
  }

  sendNotification(targetId: string) {
    this.wsService.sendNotification(
      targetId,
      'New Message',
      'You have a new message!',
      'info'
    );
  }

  showNotification(notif: Notification) {
    // Show toast/alert based on type
    console.log(`[${notif.type.toUpperCase()}] ${notif.title}: ${notif.message}`);
  }
}
```

---

### 7. Real-time Data Updates

```typescript
export class DataUpdateComponent implements OnInit {
  realtimeData: any[] = [];

  async subscribeToUpdates() {
    // Subscribe to specific data type
    const result = await this.wsService.subscribeToData('user-list');
    console.log('Subscribed:', result);

    // Listen for updates
    this.wsService.on('data:user-list').subscribe((data) => {
      this.realtimeData = data;
      console.log('Data updated:', data);
    });
  }

  async unsubscribe() {
    await this.wsService.unsubscribeFromData('user-list');
  }
}
```

---

## Backend: Broadcast из контроллеров

Вы можете отправлять WebSocket события из любого контроллера или сервиса:

```typescript
// users.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { WebsocketGateway } from '../websockets/websocket.gateway';

@Controller('users')
export class UsersController {
  constructor(private readonly wsGateway: WebsocketGateway) {}

  @Post('notify-all')
  notifyAllUsers(@Body() data: { message: string }) {
    // Broadcast to all connected clients
    this.wsGateway.broadcastToAll('user:update', {
      message: data.message,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @Post('notify-room')
  notifyRoom(@Body() data: { roomId: string; message: string }) {
    // Broadcast to specific room
    this.wsGateway.broadcastToRoom(data.roomId, 'room:announcement', {
      message: data.message,
    });

    return { success: true };
  }

  @Post('notify-user')
  notifyUser(@Body() data: { clientId: string; message: string }) {
    // Send to specific client
    const sent = this.wsGateway.sendToClient(
      data.clientId,
      'personal:notification',
      { message: data.message }
    );

    return { success: sent };
  }
}
```

---

## Полезные методы WebsocketGateway (Backend)

```typescript
// Get connected clients count
const count = this.wsGateway.getConnectedClientsCount();

// Get all client IDs
const clientIds = this.wsGateway.getConnectedClientIds();

// Broadcast to everyone
this.wsGateway.broadcastToAll('event:name', { data: 'value' });

// Broadcast to room
this.wsGateway.broadcastToRoom('room-123', 'event:name', { data: 'value' });

// Send to specific client
this.wsGateway.sendToClient('client-id', 'event:name', { data: 'value' });
```

---

## Тестирование WebSocket

### С помощью Socket.IO Client (Browser Console)

```javascript
// В консоли браузера
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connection:success', (data) => {
  console.log('Welcome:', data);
});

// Send message
socket.emit('chat:message', {
  message: 'Hello from console!',
  username: 'TestUser'
});

// Listen for messages
socket.on('chat:message', (data) => {
  console.log('Message received:', data);
});

// Join room
socket.emit('room:join', { roomId: 'test-room', username: 'TestUser' }, (response) => {
  console.log('Join result:', response);
});
```

### Postman / REST Client

Postman поддерживает WebSocket тестирование:
1. New → WebSocket Request
2. URL: `ws://localhost:3000`
3. Connect
4. Send events в формате Socket.IO

---

## Production настройки

### Backend (main.ts)

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
});
```

### WebSocket Gateway

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/',
})
```

### Environment variables

```env
FRONTEND_URL=https://yourdomain.com
WEBSOCKET_PORT=3000
```

---

## Best Practices

1. **Всегда отписывайтесь** от Observable в `ngOnDestroy()`
2. **Обрабатывайте ошибки** подключения
3. **Используйте комнаты** для группировки пользователей
4. **Валидируйте данные** на backend перед broadcast
5. **Ограничивайте размер сообщений** (уже реализовано: 1000 символов)
6. **Храните историю в БД** (сейчас в памяти - для production нужна MongoDB)
7. **Добавьте аутентификацию** для WebSocket подключений

---

## Troubleshooting

### Проблема: WebSocket не подключается

**Решение:**
- Проверьте, что backend запущен
- Проверьте URL в `environment.ts`
- Проверьте CORS настройки
- Проверьте firewall/antivirus

### Проблема: Сообщения не доходят

**Решение:**
- Проверьте названия событий (должны совпадать)
- Проверьте, подписан ли клиент на событие
- Проверьте логи backend

### Проблема: Комната не работает

**Решение:**
- Убедитесь, что вызвали `joinRoom()` перед отправкой
- Проверьте `roomId` (должен совпадать)

---

## Дальнейшее развитие

- [ ] Добавить аутентификацию (JWT для WebSocket)
- [ ] Хранить историю в MongoDB
- [ ] Добавить file uploads через WebSocket
- [ ] Добавить video/audio calling (WebRTC)
- [ ] Добавить message reactions (emoji)
- [ ] Добавить read receipts (прочитано/не прочитано)
- [ ] Добавить user presence (online/offline status)

---

**Готово к использованию!** 🚀

Все файлы созданы и готовы к работе. Просто запустите backend и frontend, и WebSocket заработает автоматически.
