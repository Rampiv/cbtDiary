# Дневник мыслей

Деплой: https://cbt-diary-rampiv.vercel.app/

Персональный дневник для записи и отслеживания мыслей с поддержкой форматирования текста, аутентификацией через Firebase и Realtime Database для хранения данных.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![Firebase](https://img.shields.io/badge/Firebase-12-orange)

## ✨ Возможности

- 🔐 **Аутентификация** — вход через Email/пароль и Google
- ✍️ **Text Editor** — форматирование текста (жирный, курсив, подчёркивание, списки)
- 💾 **Realtime Database** — мгновенное сохранение и синхронизация записей
- 🎨 **Современный UI** — чистый дизайн с SCSS и БЭМ-методологией
- 🌙 **Тёмная тема** — переключение между светлой и тёмной темой с сохранением в localStorage и Firebase
- 📱 **Адаптивность** — корректное отображение на всех устройствах
- 🔒 **Безопасность** — защита данных через Firebase Security Rules
- ✅ **Покрытие тестами** — 240 тестов, 11 модулей, 100% покрытие критической логики

## 🛠 Технологии

| Технология            | Назначение                   |
| --------------------- | ---------------------------- |
| **React 19**          | UI библиотека                |
| **TypeScript**        | Типизация                    |
| **Vite 8**            | Сборщик                      |
| **Firebase 12**       | Аутентификация и база данных |
| **Tiptap**            | Text Editor                  |
| **React Router**      | Маршрутизация                |
| **SCSS**              | Стилизация                   |
| **ESLint + Prettier** | Линтинг и форматирование     |
| **Vitest**            | Тестирование                 |

## 🔑 Безопасность

## 🧪 Тесты

Проект покрыт unit-тестами с использованием **Vitest** и **React Testing Library**.

| Модуль              | Тестов | Что тестируется                        |
| ------------------- | ------ | -------------------------------------- |
| `types/diary`       | 6      | Factory функции создания записей       |
| `utils/docxGenerator` | 5    | Извлечение и форматирование текста     |
| `hook/useDiary`     | 13     | Загрузка, сохранение, CRUD-операции    |
| `Accordion`         | 6      | Рендер, toggle, состояние              |
| `SaveButton`        | 15     | Состояния, disabled, onClick, a11y     |
| `InfoModal`         | 33     | Открытие/закрытие, a11y, focus trap    |
| `Toast`             | 6      | Типы уведомлений, таймеры              |
| `CustomSelect`      | 18     | Открытие, навигация, a11y, keyboard    |
| `TextEditor`        | 40     | Рендер, toolbar, a11y, санитизация     |
| `ReadOnlyContent`   | 26     | Рендер, санитизация XSS, форматирование|
| `ThemeProvider`     | 6      | Переключение темы, localStorage, Firebase |

```bash
# Запуск тестов
npm run test        # watch режим
npm run test:run    # один запуск
```


## 📄 Лицензия

MIT
