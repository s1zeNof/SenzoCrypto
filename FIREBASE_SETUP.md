# Firebase Authentication Setup

## Крок 1: Створити Firebase проект

1. Перейти на [Firebase Console](https://console.firebase.google.com/)
2. Натиснути "Add project" (Додати проект)
3. Ввести назву проекту (наприклад, "Senzo Crypto")
4. Вимкнути Google Analytics (опціонально)
5. Натиснути "Create project"

## Крок 2: Налаштувати Web App

1. В Firebase Console, натиснути на іконку Web (`</>`)
2. Ввести назву додатку
3. Скопіювати конфігурацію Firebase

## Крок 3: Додати конфігурацію в проект

1. Створити файл `.env.local` в корені проекту
2. Додати Firebase конфігурацію:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

## Крок 4: Активувати Authentication

1. В Firebase Console, перейти в **Authentication**
2. Натиснути "Get started"
3. Активувати **Email/Password**:
   - Sign-in method → Email/Password → Enable
4. Активувати **Google**:
   - Sign-in method → Google → Enable
   - Вказати support email
5. Активувати **GitHub**:
   - Sign-in method → GitHub → Enable
   - Створити OAuth App на GitHub:
     - Перейти на https://github.com/settings/developers
     - New OAuth App
     - Authorization callback URL: з Firebase Console
   - Скопіювати Client ID та Secret в Firebase

## Крок 5: Налаштувати Firestore Database

1. В Firebase Console, перейти в **Firestore Database**
2. Натиснути "Create database"
3. Вибрати режим: **Start in production mode**
4. Вибрати location (europe-west)
5. Оновити Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Крок 6: Запустити проект

```bash
npm install
npm run dev
```

## Готово! 🎉

Тепер ви можете:
- Реєструватись через email/password
- Логінитись через Google
- Логінитись через GitHub

---

## Troubleshooting

### Помилка: "Firebase: Error (auth/unauthorized-domain)"

**Рішення:** Додати домен в Firebase Console:
1. Authentication → Settings → Authorized domains
2. Додати `localhost` та ваш домен

### Помилка GitHub OAuth

**Рішення:** Перевірити:
1. Client ID та Secret правильно вказані в Firebase
2. Callback URL співпадає з Firebase
3. Додаток активний на GitHub

### Firestore permission denied

**Рішення:** Перевірити Firestore Rules (див. Крок 5)
