# 📊 Google Sheets & Google Docs Integratsiyasi Boyicha Yo'riqnoma

Ushbu yo'riqnoma orqali siz Google Sheets va Google Docs o'rtasidagi avtomatik integratsiyani osongina sozlab olasiz.

---

## 🌐 1. Google Apps Script Interfeysini Ingliz Tiliga O'tkazish

Agar sizda Google Apps Script tugmalari rus tilida bo'lsa (masalan: *"Проект без названия"*, *"Начать развертывание"*), uni ingliz tiliga o'tkazish uchun:

1. Brauzeringizda **[myaccount.google.com/language](https://myaccount.google.com/language)** manziliga kiring.
2. **Предпочитаемый язык / Preferred language** yonidagi ruchka (✏️) belgisini bosing.
3. **English** (masalan: *English (United States)*) ni tanlang va saqlang.
4. Apps Script oynangizga qaytib `F5` (Sahifani yangilash) bosing. Interfeys ingliz tiliga o'tadi!

---

## 🎯 Integratsiya Qanday Ishlaydi?

1. Foydalanuvchi saytda arizani va pasport rasmlarini to'ldirib yuboradi.
2. Google Apps Script har bir nomzod uchun **alohida Google Doc fayl** yaratadi va pasport rasmlarini joylaydi.
3. Yaratilgan Google Doc havolasi `PASSPORT RASM` (H ustuni) ga yoziladi va nomzodning barcha ma'lumotlari sizning Google Sheets jadvalingizdagi ustunlarga yoziladi (`ISM`, `FAMILYA`, `EMAIL`, `T-YIL`, `P-S`, `JSHSHIR`, `TEL Nº`, `PASSPORT RASM`, `IMTIHON TILI`).

---

## 🚀 Qadamma-qadam Sozlash Yo'riqnomasi (English UI)

### 1-qadam: Apps Script Kodini Joylash
1. O'zingiz ochgan Google Sheets jadvalingiz menyusidan: **Extensions (Kengaytmalar) -> Apps Script** bo'limiga kiring.
2. Ochilgan Apps Script oynasida `myFunction() { ... }` kabi mavjud bo'sh kodlarni to'liq o'chirib tashlang.
3. Loyihamizdagi `google-script/GoogleAppsScript.gs` fayli ichidagi BARCHA kodni nusxalang va Apps Script oynasiga joylang.
4. Tepadagi 💾 **Save** (Saqlash) tugmasini bosing (yoki `Ctrl + S`).

### 2-qadam: Web App Sifatida Nashr Qilish (Deploy)
1. O'ng tepadagi ko'k **Deploy -> New deployment** tugmasini bosing.
2. Chap tarafdagi tishli g'ildirakcha (⚙️) belgisini bosib **Web app** ni tanlang.
3. Sozlamalarni quyidagicha belgilang:
   - **Description**: `GRE Registration Webhook`
   - **Execute as**: **Me** (`your-email@gmail.com`)
   - **Who has access**: **Anyone**  *(Juda muhim!)*
4. **Deploy** tugmasini bosing.
5. Google sizdan ruxsat so'rasa:
   - **Authorize access** tugmasini bosing.
   - O'z Google hisobingizni tanlang.
   - **Advanced** havolasini bosing.
   - **Go to Untitled project (unsafe)** ni bosing.
   - **Allow** tugmasini bosing.

### 3-qadam: Webhook URL ni Portalga Kiritish va Test Qilish
1. Ekranda paydo bo'lgan **Web app URL** manzilidan nusxa oling (`https://script.google.com/macros/s/.../exec`).
2. Saytingizdagi **Admin Panel** -> **Portal Sozlamalari** (Portal Settings) bo'limiga o'ting.
3. **Google Sheets Webhook URL** maydoniga joylang va yonidagi **Test Qilish** tugmasini bosing.
4. Yashil rangda "✅ Webhook faol va muvaffaqiyatli ulangan!" xabari chiqsa, **Save Settings** bosing.

---

## 🛠️ Muammolarni Hal Qilish (Troubleshooting)

### ❗ 1. Ma'lumotlar jadvalga tushmayapti:
- **Who has access** sozlamasi **Anyone** ekanligini qayta tekshiring. *(Agar "Only myself" bo'lsa brauzer so'rovni rad etadi)*.
- Kodingizni yangilagan bo'lsangiz: **Deploy -> Manage deployments -> Edit (✏️) -> Version: New version** ni tanlab qayta **Deploy** qiling!

### 📌 2. Script `script.google.com` (Standalone) da ochilgan bo'lsa:
- `GoogleAppsScript.gs` fayli tepadagi `var SPREADSHEET_ID = ""` o'zgaruvchisiga Google Sheets jadvalingiz ID sini joylang (URL dagi `/d/1abc123.../edit` ichidagi `1abc123...` qismi).

---

🎉 Tayyor! Barcha arizalar va pasport rasmlari Google Docs hamda Google Sheets'ga avtomatik tushadi!
