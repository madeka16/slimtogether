# 🌷 SlimTogether — Инструкция по запуску

## Шаг 1 — Создай Firebase проект (5 мин)

1. Зайди на https://console.firebase.google.com
2. Нажми **"Создать проект"** → дай имя (напр. `slimtogether`) → Continue
3. Google Analytics — можно отключить → **Создать проект**

### Включи Realtime Database:
4. В левом меню → **Build → Realtime Database**
5. Нажми **"Создать базу данных"**
6. Выбери регион: **Europe-west1** → Далее
7. Правила безопасности: выбери **"Начать в тестовом режиме"** → Готово

### Получи конфиг:
8. В левом меню → ⚙️ **Настройки проекта**
9. Вкладка **"Общие"** → прокрути вниз → раздел **"Ваши приложения"**
10. Нажми иконку **</>** (веб-приложение)
11. Дай имя (напр. `slimtogether`) → **Зарегистрировать**
12. Скопируй объект `firebaseConfig` — он выглядит так:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "slimtogether-xxxxx.firebaseapp.com",
  databaseURL: "https://slimtogether-xxxxx-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "slimtogether-xxxxx",
  storageBucket: "slimtogether-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

---

## Шаг 2 — Вставь конфиг в код

Открой файл `src/firebase.js` и замени все `"ВСТАВЬ_СЮДА"` на свои значения.

---

## Шаг 3 — Опубликуй на Vercel (3 мин)

1. Зарегистрируйся на https://vercel.com (можно через GitHub)
2. Нажми **"Add New Project"**
3. Выбери **"Upload"** (если нет GitHub) или залей папку
4. Vercel сам определит что это Vite проект
5. Нажми **Deploy** 🚀

**ИЛИ через GitHub (рекомендуется):**
1. Залей папку на GitHub (github.com → New repository)
2. На Vercel → Import Git Repository → выбери репозиторий
3. Deploy → готово!

Vercel даст тебе ссылку типа `https://slimtogether-abc.vercel.app` — 
**отправь её подруге и начинайте трекать!** 🎉

---

## Важно про безопасность

Сейчас база в "тестовом режиме" — читать/писать могут все у кого есть ссылка.
Это нормально для личного использования вдвоём. Через 30 дней Firebase 
попросит обновить правила — просто оставь тестовый режим ещё раз.
