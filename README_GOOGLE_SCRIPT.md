# 📊 Google Sheets & Google Docs Integratsiyasi Bo'yicha Yangilangan Yo'riqnoma

Ushbu yo'riqnoma orqali siz Google Sheets va Google Docs o'rtasidagi to'liq avtomatik integratsiyani osongina sozlab olasiz.

---

## 🎯 Integratsiya Qanday Ishlaydi?

1. Nomzod saytda anketani to'ldiradi (F.I.Sh., Tug'ilgan sana, Telefon, Email, Yashash viloyati va tumani, Test hududi, Test sanasi, Pasport seriya/raqami, JSHSHIR hamda pasport rasmlari).
2. Google Apps Script har bir nomzod uchun **alohida Google Doc fayl** yaratadi, unga nomzod ma'lumotlarini va pasport rasmlarini joylaydi hamda umumiy ko'rish havolasini (link) beradi.
3. Yaratilgan Google Doc havolasi va nomzodning barcha ma'lumotlari sizning Google Sheets jadvalingizdagi 14 ta ustunga chiroyli formatlangan holda yoziladi:
   * `ISM` | `FAMILYA` | `OTASINING ISMI` | `TUG'ILGAN SANA` | `TEL-RAQAM` | `EMAIL` | `YASHASH VILOYATI` | `TUMAN / SHAHAR` | `TEST HUDUDI` | `TEST SANASI` | `PASPORT` | `JSHSHIR` | `PASPORT RASMLARI (DOC)` | `RO'YXAT VAQTI`

---

## 🚀 Qadamma-qadam Sozlash Yo'riqnomasi

### 1-qadam: Google Sheets Jadvalini Ochish
1. [sheets.google.com](https://sheets.google.com) ga kiring va yangi bo'sh jadval yarating.
2. Menyudan: **Extensions (Kengaytmalar) -> Apps Script** bo'limiga kiring.

### 2-qadam: Apps Script Kodini Joylash
1. Apps Script oynasida `myFunction() { ... }` kabi mavjud bo'sh kodlarni to'liq o'chirib tashlang.
2. Loyihamizdagi `google-script/GoogleAppsScript.gs` fayli ichidagi BARCHA kodni nusxalang va Apps Script oynasiga joylang.
3. Tepadagi 💾 **Save** (Saqlash) tugmasini bosing (`Ctrl + S`).

### 3-qadam: Web App Sifatida Nashr Qilish (Deploy)
1. O'ng tepadagi ko'k **Deploy -> New deployment** tugmasini bosing.
2. Chap tarafdagi tishli g'ildirakcha (⚙️) belgisini bosib **Web app** ni tanlang.
3. Sozlamalarni quyidagicha belgilang:
   * **Description**: `Fizika Registration Webhook`
   * **Execute as**: **Me** (`sizning-emailingiz@gmail.com`)
   * **Who has access**: **Anyone**  *(ENG MUHIM QADAM! Har kim kira olishi shart)*
4. **Deploy** tugmasini bosing.
5. Google sizdan bir martalik ruxsat so'rasa:
   * **Authorize access** tugmasini bosing.
   * O'z Google profilingizni tanlang.
   * **Advanced** havolasini bosing.
   * **Go to Untitled project (unsafe)** ni bosing.
   * **Allow** tugmasini bosing.

### 4-qadam: Webhook URL ni Portalga Kiritish va Test Qilish
1. Ekranda paydo bo'lgan **Web app URL** manzilidan nusxa oling (`https://script.google.com/macros/s/.../exec`).
2. `.env` faylidagi `VITE_GOOGLE_SHEETS_WEBHOOK` ga ushbu URL ni qo'ying.
3. Yoki saytingizdagi **Admin Panel** -> **Portal Sozlamalari** bo'limiga o'tib, **Google Sheets Webhook URL** maydoniga joylang va yonidagi **Test Qilish** tugmasini bosing.
4. Yashil rangda "✅ Google Sheets Webhook faol va muvaffaqiyatli ulangan!" xabari chiqsa, **Sozlamalarni Saqlash** bosing.

---

## 🛠️ Muammolarni Hal Qilish (Troubleshooting)

### ❗ "Нет доступа" yoki "HTTP 401/403" xatosi bersa:
* **Deploy -> Manage deployments -> Edit (✏️)** ga kiring.
* **Who has access:** **Anyone** qilinganiga ishonch hosil qiling.
* **Version:** **New version** ni tanlang va **Deploy** bosing.
