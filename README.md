# Дневник мыслей

Деплой: https://cbt-diary-rampiv.vercel.app/

Персональный дневник для записи и отслеживания мыслей с поддержкой форматирования текста, аутентификацией через Firebase и Realtime Database для хранения данных.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Firebase](https://img.shields.io/badge/Firebase-10-orange)

## ✨ Возможности

- 🔐 **Аутентификация** — вход через Email/пароль и Google
- ✍️ **Text Editor** — форматирование текста (жирный, курсив, подчёркивание, списки)
- 💾 **Realtime Database** — мгновенное сохранение и синхронизация записей
- 🎨 **Современный UI** — чистый дизайн с SCSS и БЭМ-методологией
- 📱 **Адаптивность** — корректное отображение на всех устройствах
- 🔒 **Безопасность** — защита данных через Firebase Security Rules

## 🛠 Технологии

| Технология            | Назначение                   |
| --------------------- | ---------------------------- |
| **React 18**          | UI библиотека                |
| **TypeScript**        | Типизация                    |
| **Vite**              | Сборщик                      |
| **Firebase**          | Аутентификация и база данных |
| **Tiptap**            | Text Editor                  |
| **React Router**      | Маршрутизация                |
| **SCSS**              | Стилизация                   |
| **ESLint + Prettier** | Линтинг и форматирование     |

## 📦 Установка

### 1. Клонирование и установка зависимостей

```bash
git clone <your-repo-url>
cd thought-diary
npm install
```

### 2. Настройка Firebase

1. Создайте проект в [Firebase Console](https://console.firebase.google.com/)
2. Включите **Authentication** → методы входа:
   - Email/Password
   - Google
3. Создайте **Realtime Database**
4. Скопируйте конфигурацию веб-приложения

### 3. Переменные окружения

Создайте файл `.env` в корне проекта:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚀 Запуск

```bash
# Режим разработки
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр продакшен-сборки
npm run preview

# Линтинг
npm run lint

# Форматирование кода
npm run format
```

## 📄 Лицензия

MIT
