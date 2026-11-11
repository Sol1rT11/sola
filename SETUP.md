# Sola: запуск для всех (проект sol1rti)

Ключи Firebase и твой Gmail (lehasaj5@gmail.com) уже вписаны в Sola-standalone.html.

## 1. Firebase (console.firebase.google.com → sol1rti)
1. Authentication → Sign-in method: включи **Google** и **Email/Password**.
2. Authentication → Settings → Authorized domains: добавь домен, где будет лежать сайт.
3. Firestore Database → Create database (production mode) → вкладка Rules → вставь правила ниже → Publish.
4. На свой Google-аккаунт включи двухэтапную аутентификацию (myaccount.google.com/security). Это твой «код для проверки»: отсек автора защищён именно твоим входом.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function ok() { return request.auth != null && request.auth.token.email_verified == true; }
    function owner() { return ok() && request.auth.token.email == 'lehasaj5@gmail.com'; }
    function hasB(uid) { return exists(/databases/$(database)/documents/badges/$(uid)); }
    function bd(uid) { return get(/databases/$(database)/documents/badges/$(uid)).data; }
    function free() { return !hasB(request.auth.uid) || bd(request.auth.uid).get('bn', false) != true; }
    function unmuted() { return !hasB(request.auth.uid) || bd(request.auth.uid).get('mu', 0) < request.time.toMillis(); }
    function follows(a, b) {
      return exists(/databases/$(database)/documents/follows/$(a))
        && (b in get(/databases/$(database)/documents/follows/$(a)).data.m);
    }

    match /profiles/{uid} {
      allow read: if ok();
      allow write: if ok() && free() && request.auth.uid == uid
        && request.resource.data.ev == true
        && request.resource.data.ep == request.auth.token.firebase.sign_in_provider
        && request.resource.data.ed == request.auth.token.email.split('@')[1];
    }
    match /{c}/{uid} {
      allow read: if ok() && c in ['vids','likes','views','saves','follows','removed','badges','presence'];
      allow write: if ok() && free() && request.auth.uid == uid && c in ['likes','views','saves','follows','presence'];
    }
    match /vids/{uid} {
      allow write: if owner() || (ok() && free() && unmuted() && request.auth.uid == uid);
    }
    match /removed/{id} { allow write: if owner(); }
    match /badges/{uid} { allow write: if owner(); }
    match /comments/{id} {
      allow read: if ok();
      allow create: if ok() && free() && request.resource.data.u == request.auth.uid;
      allow delete: if ok() && (resource.data.u == request.auth.uid || owner());
    }
    match /chats/{id} {
      allow read: if ok() && request.auth.uid in resource.data.p;
      allow create: if ok() && free() && request.resource.data.u == request.auth.uid
        && request.auth.uid in request.resource.data.p && request.resource.data.p.size() == 2
        && follows(request.resource.data.p[0], request.resource.data.p[1])
        && follows(request.resource.data.p[1], request.resource.data.p[0]);
      allow delete: if ok() && (resource.data.u == request.auth.uid || owner());
    }
    match /reports/{id} {
      allow create, update: if ok() && free() && request.resource.data.u == request.auth.uid;
      allow read, delete: if owner();
    }
    match /meta/creator {
      allow read: if ok();
      allow write: if owner();
    }
  }
}
```


## 2. Cloudinary (видео до 100 МБ, бесплатно, без карты)
Settings → Upload → Upload presets → Add → Signing mode **Unsigned**. Впиши в начало файла `CLOUD.name` и `CLOUD.preset`.

## 3. Выложи сайт (чтобы заходили все)
Вариант А, Netlify Drop: переименуй Sola-standalone.html в `index.html`, перетащи на app.netlify.com/drop. Получишь ссылку.
Вариант Б, Firebase Hosting: `npm i -g firebase-tools`, `firebase login`, `firebase init hosting` (public = папка с index.html), `firebase deploy`. Ссылка вида sol1rti.web.app, этот домен уже разрешён для входа.

## Как устроена защита
- Кнопка «Отсек автора» видна только твоему Gmail, но настоящая защита на сервере: правила Firestore пускают к жалобам, скрытию видео и значкам только токен с твоей подтверждённой почтой.
- Профиль нельзя подделать: правила сверяют «подтверждён», способ входа и домен почты с токеном Google.
- Каждый пишет только в свои документы лайков, просмотров и подписок, поэтому накрутить чужие нельзя.

## Ограничения
- Возраст и регион вводятся/определяются на устройстве, сервер их не проверяет.
- Лимиты бесплатного Firebase: 50 000 чтений в день. Для сотен пользователей хватит.
- Скрытые видео остаются в Cloudinary, удаляй вручную в их панели.

## Новое: вход по письму и APK
1. Firebase → Authentication → Sign-in method → Email/Password → включи **оба** переключателя: Email/Password и **Email link (passwordless sign-in)**. Без второго «Регистрация» и «Код из письма» не заработают.
2. На GitHub загрузи в одну папку все 5 файлов: index.html, manifest.webmanifest, sw.js, icon-192.png, icon-512.png.
3. APK: открой pwabuilder.com, вставь ссылку на свой сайт, нажми Start → Package for stores → Android. Скачай пакет. Используй именно PWABuilder, а не обычные «WebView-обёртки»: Google блокирует вход из обычного WebView.

## Обновление: что нового в правилах
Правила выше заменяют старые (вставь целиком и нажми Publish). Что они добавляют:
- владелец может удалять чужие видео насовсем (без этого «Удалить» в отсеке только скрывает видео);
- мут (временный запрет публиковать) и бан проверяются на сервере;
- чаты только между друзьями (взаимная подписка);
- ответы и лайки комментариев.
Если Firebase покажет ошибку в правилах, пришли скриншот.

## Про Cloudinary
- Файлы видео остаются в Cloudinary даже после удаления из Sola: ссылка пропадает, но место занято. Удаляй вручную в Media Library. Автоудаление требует секретного ключа и сервера.
- Для плавного воспроизведения Sola просит у Cloudinary сжатую H.264-версию (1080p или 2K). Это тратит кредиты Cloudinary. Если версия не готова, играет оригинал.

## Новое в этой версии
- Правила обновлены: добавлена коллекция `presence` (значок «в сети»). Вставь правила заново и нажми Publish.
- Описания через Gemini: в Sola → «Дополнительные настройки» (или Настройки профиля) вставь бесплатный ключ с aistudio.google.com/app/apikey. Он хранится только на этом устройстве, у каждого человека свой.
- Публикация идёт в фоне: видео начинает загружаться, пока ты ещё его редактируешь, поэтому после «Опубликовать» всё готово почти сразу.
