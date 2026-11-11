/**
 * Fizika Imtihoni Backend - Google Apps Script
 * 
 * Ushbu skript foydalanuvchining Google Sheets jadvaliga 100% moslashtirilgan:
 * 
 * Ustunlar tartibi (A - M):
 * A: ISM
 * B: FAMILYA
 * C: OTASINI ISMI
 * D: TUG'ULGAN YIL
 * E: TEL NOMER
 * F: EMAIL
 * G: YASHASH MANZILI
 * H: TEST TOPSHIRISH SANASI
 * I: TEST TOPSHIRISH HUDUDI
 * J: PASPORT SERIYA
 * K: JSHSHIR
 * L: PASPORT RASM (Google Doc havolasi)
 * M: IMTHION TILI
 */

// Ixtiyoriy: Agar script.google.com da alohida (standalone) ochilgan bo'lsa, jadval ID sini kiriting:
var SPREADSHEET_ID = ""; // Masalan: "1JidKuM5ZY2IG0Hqg-ylxKeEGqSZycpuSmtb-XPebw2g"

// Jadval ustunlari sarlavhasi (13 ta ustun)
var HEADERS = [
  "ISM",
  "FAMILYA",
  "OTASINI ISMI",
  "TUG'ULGAN YIL",
  "TEL NOMER",
  "EMAIL",
  "YASHASH MANZILI",
  "TEST TOPSHIRISH SANASI",
  "TEST TOPSHIRISH HUDUDI",
  "PASPORT SERIYA",
  "JSHSHIR",
  "PASPORT RASM",
  "IMTHION TILI"
];

/**
 * 1. Google Spreadsheet jadvalini olish
 */
function getSpreadsheet() {
  var ss = null;
  
  // A) Birinchi navbatda jadval ichidan ochilgan bo'lsa (Extensions -> Apps Script)
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (eActive) {
    console.log("getActiveSpreadsheet:", eActive.toString());
  }

  // B) Standalone script bo'lsa, SPREADSHEET_ID orqali ochish
  if (!ss && SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch (eOpen) {
      console.log("openById:", eOpen.toString());
    }
  }

  if (!ss) {
    throw new Error("Google Spreadsheet topilmadi! Google Sheets jadvalingiz ichidan 'Kengaytmalar (Extensions) -> Apps Script' ga kiring.");
  }
  return ss;
}

/**
 * 2. Haqiqiy to'ldirilgan oxirgi qator raqamini aniqlash (Bo'sh joylarni tashlab o'tish)
 */
function getRealLastRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return lastRow;
  
  var values = sheet.getRange(1, 1, lastRow, 13).getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    var r = values[i];
    // Qatorda Ism, Familiya yoki Pasport/JSHSHIR mavjud bo'lsa
    if ((r[0] && r[0].toString().trim() !== "") ||
        (r[1] && r[1].toString().trim() !== "") ||
        (r[9] && r[9].toString().trim() !== "") ||
        (r[10] && r[10].toString().trim() !== "")) {
      return i + 1;
    }
  }
  return 1; // 1-qator sarlavha
}

/**
 * 3. Base64 Data URL ni Blob faylga o'tkazish
 */
function dataUrlToBlob(dataUrl, defaultName) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  
  var parts = dataUrl.split(',');
  if (parts.length < 2) return null;

  var header = parts[0];
  var base64Data = parts[1];

  var mimeMatch = header.match(/:(.*?);/);
  var mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  var decoded = Utilities.base64Decode(base64Data);
  return Utilities.newBlob(decoded, mimeType, defaultName);
}

/**
 * 4. Bitta qatorni chiroyli va tartibli formatlash
 */
function formatSingleRow(sheet, rowNum, birthDate, phoneNum, examDate, passportNum, jshshirNum) {
  sheet.setRowHeight(rowNum, 36);
  var rowRange = sheet.getRange(rowNum, 1, 1, 13);

  // Matn formatlari (@) - raqamlar noto'g'ri o'zgarmasligi uchun
  sheet.getRange(rowNum, 4).setNumberFormat("@").setValue(birthDate || "");
  sheet.getRange(rowNum, 5).setNumberFormat("@").setValue(phoneNum || "");
  sheet.getRange(rowNum, 8).setNumberFormat("@").setValue(examDate || "");
  sheet.getRange(rowNum, 10).setNumberFormat("@").setValue(passportNum || "");
  sheet.getRange(rowNum, 11).setNumberFormat("@").setValue(jshshirNum || "");

  // Shrift, markazlashtirish va chegara
  rowRange.setFontFamily("Arial");
  rowRange.setFontSize(10);
  rowRange.setVerticalAlignment("middle");
  rowRange.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  rowRange.setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  
  // Markazga tekislash (Tug'ilgan sana, Telefon, Test sanasi, Test hududi, Pasport, JSHSHIR, Doc linki, Til)
  sheet.getRange(rowNum, 4).setHorizontalAlignment("center");
  sheet.getRange(rowNum, 5).setHorizontalAlignment("center");
  sheet.getRange(rowNum, 8).setHorizontalAlignment("center");
  sheet.getRange(rowNum, 9).setHorizontalAlignment("center");
  sheet.getRange(rowNum, 10).setHorizontalAlignment("center");
  sheet.getRange(rowNum, 11).setHorizontalAlignment("center");
  sheet.getRange(rowNum, 12).setHorizontalAlignment("center");
  sheet.getRange(rowNum, 13).setHorizontalAlignment("center");
}

/**
 * 5. POST so'rovini qabul qilish (Forma yuborilganda yoki Test qilinganda)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // 30 sekund concurrency lock

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    // Webhook ulanishini test qilish (Ping)
    if (data.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        result: "success",
        status: "ok",
        message: "Google Apps Script Webhook muvaffaqiyatli ishlamoqda!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = getSpreadsheet();
    var sheet = ss.getActiveSheet() || ss.getSheets()[0];
    
    // Agar sarlavhalar mavjud bo'lmasa, o'rnatamiz
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      
      var headerRange = sheet.getRange(1, 1, 1, 13);
      headerRange.setBackground("#15803d"); // Yashil fon (Foydalanuvchi jadvalidagidek)
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Arial");
      headerRange.setFontSize(10);
      headerRange.setVerticalAlignment("middle");
      headerRange.setHorizontalAlignment("center");
      sheet.setRowHeight(1, 38);
      sheet.setFrozenRows(1);
    }

    // DUBLIKAT TEKSHIRUVI: Pasport (10-ustun) yoki JSHSHIR (11-ustun) bo'yicha
    var inputJshshir = (data.jshshir || "").toString().trim();
    var inputPass = (data.passportNumber || "").toString().replace(/\s/g, "").toUpperCase();

    var realLastRow = getRealLastRow(sheet);
    if (realLastRow > 1) {
      var rows = sheet.getRange(2, 1, realLastRow - 1, 13).getValues();
      for (var i = 0; i < rows.length; i++) {
        var existingPass = (rows[i][9] || "").toString().replace(/\s/g, "").toUpperCase(); // PASPORT SERIYA (10-ustun)
        var existingJshshir = (rows[i][10] || "").toString().trim(); // JSHSHIR (11-ustun)

        if ((inputJshshir && existingJshshir === inputJshshir) || (inputPass && existingPass === inputPass)) {
          return ContentService.createTextOutput(JSON.stringify({
            result: "duplicate",
            message: "Siz allaqachon ro'yxatdan o'tgansiz (JSHSHIR yoki Pasport takroriy)!"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Google Doc yaratish (Pasport rasmlari uchun)
    var docTitle = "Fizika Pasport - " + (data.lastName || "") + " " + (data.firstName || "");
    var doc = DocumentApp.create(docTitle);
    var body = doc.getBody();
    var hasImages = false;

    // Nomzod ma'lumotlarini Doc fayl boshiga yozish
    body.appendParagraph("F.I.Sh: " + (data.lastName || "") + " " + (data.firstName || "") + " " + (data.middleName || ""));
    body.appendParagraph("Pasport: " + (data.passportNumber || "") + " | JSHSHIR: " + (data.jshshir || ""));
    body.appendParagraph("Telefon: " + (data.phone || "") + " | Email: " + (data.email || ""));
    var fullAddress = (data.region || "") + (data.district ? (", " + data.district) : "");
    body.appendParagraph("Yashash manzili: " + fullAddress);
    body.appendParagraph("Test hududi: " + (data.examRegion || "") + " | Test sanasi: " + (data.examDate || ""));
    body.appendParagraph("Imtihon tili: " + (data.examLanguage || "O'zbek tili"));
    body.appendHorizontalRule();

    // Pasport Oldi Rasmi
    if (data.passportFront && data.passportFront.dataUrl) {
      try {
        var frontBlob = dataUrlToBlob(data.passportFront.dataUrl, "passport_front");
        if (frontBlob) {
          body.appendParagraph("PASPORT / ID KARTA OLDI TOMONI:").setBold(true);
          var img = body.appendImage(frontBlob);
          var width = img.getWidth();
          var height = img.getHeight();
          if (width > 450) {
            img.setWidth(450);
            img.setHeight((height * 450) / width);
          }
          hasImages = true;
        }
      } catch (errFront) {
        console.log("Front image error: " + errFront.toString());
      }
    }

    // Pasport Orqa Rasmi
    if (data.passportBack && data.passportBack.dataUrl) {
      try {
        var backBlob = dataUrlToBlob(data.passportBack.dataUrl, "passport_back");
        if (backBlob) {
          body.appendParagraph("PASPORT / ID KARTA ORQA TOMONI:").setBold(true);
          var imgBack = body.appendImage(backBlob);
          var w = imgBack.getWidth();
          var h = imgBack.getHeight();
          if (w > 450) {
            imgBack.setWidth(450);
            imgBack.setHeight((h * 450) / w);
          }
          hasImages = true;
        }
      } catch (errBack) {
        console.log("Back image error: " + errBack.toString());
      }
    }

    doc.saveAndClose();

    // Google Doc fayliga ochiq havola (Anyone with link can view) ruxsatini berish
    var googleDocUrl = "";
    try {
      var file = DriveApp.getFileById(doc.getId());
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      googleDocUrl = doc.getUrl();
    } catch (eShare) {
      console.log("Drive sharing error:", eShare);
      googleDocUrl = doc.getUrl();
    }

    var phoneValue = (data.phone || "").trim();
    var targetRow = realLastRow + 1;

    // Foydalanuvchi jadvalidagi 13 ta ustun bo'yicha qiymatlar:
    // A: ISM
    // B: FAMILYA
    // C: OTASINI ISMI
    // D: TUG'ULGAN YIL
    // E: TEL NOMER
    // F: EMAIL
    // G: YASHASH MANZILI
    // H: TEST TOPSHIRISH SANASI
    // I: TEST TOPSHIRISH HUDUDI
    // J: PASPORT SERIYA
    // K: JSHSHIR
    // L: PASPORT RASM
    // M: IMTHION TILI
    var rowValues = [
      data.firstName || "",
      data.lastName || "",
      data.middleName || "",
      data.birthDate || "",
      phoneValue,
      data.email || "",
      fullAddress,
      data.examDate || "",
      data.examRegion || "",
      data.passportNumber || "",
      data.jshshir || "",
      "", // Doc havolasi RichText orqali joylanadi
      data.examLanguage || "O'zbek tili"
    ];

    sheet.getRange(targetRow, 1, 1, 13).setValues([rowValues]);

    // Google Doc havolasini 12-ustun (L) ga RichText ko'rinishida joylash
    if (googleDocUrl) {
      try {
        var richText = SpreadsheetApp.newRichTextValue()
          .setText("📄 Hujjatni ko'rish")
          .setLinkUrl(googleDocUrl)
          .build();
        sheet.getRange(targetRow, 12).setRichTextValue(richText);
      } catch (errRich) {
        console.log("RichText error:", errRich);
        sheet.getRange(targetRow, 12).setValue(googleDocUrl);
      }
    }

    // Formatlash
    formatSingleRow(
      sheet, 
      targetRow, 
      data.birthDate, 
      phoneValue, 
      data.examDate, 
      data.passportNumber, 
      data.jshshir
    );

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      docUrl: googleDocUrl,
      message: "Ma'lumotlar va Google Doc rasmlari muvaffaqiyatli saqlandi"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * 6. GET so'rovi (Ping tekshirish yoki barcha nomzodlarni olish)
 */
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.ping === "true") {
      return ContentService.createTextOutput(JSON.stringify({
        result: "success",
        status: "ok",
        message: "Google Apps Script Webhook faol!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = getSpreadsheet();
    var sheet = ss.getActiveSheet() || ss.getSheets()[0];
    var realLast = getRealLastRow(sheet);

    if (realLast <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: "success",
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var range = sheet.getRange(2, 1, realLast - 1, 13);
    var rows = range.getValues();
    var richTexts = range.getRichTextValues();
    var candidates = [];

    for (var i = rows.length - 1; i >= 0; i--) {
      var r = rows[i];
      if (!r[0] && !r[1] && !r[9]) continue;

      var docUrl = "";
      if (richTexts && richTexts[i] && richTexts[i][11]) {
        docUrl = richTexts[i][11].getLinkUrl() || (r[11] || "").toString();
      } else {
        docUrl = (r[11] || "").toString();
      }

      candidates.push({
        id: "FIZ-" + (1000 + i + 1),
        firstName: (r[0] || "").toString(),
        lastName: (r[1] || "").toString(),
        middleName: (r[2] || "").toString(),
        birthDate: (r[3] || "").toString(),
        phone: (r[4] || "").toString(),
        email: (r[5] || "").toString(),
        address: (r[6] || "").toString(),
        region: (r[6] || "").toString(),
        district: "",
        examDate: (r[7] || "").toString(),
        examRegion: (r[8] || "").toString(),
        passportNumber: (r[9] || "").toString(),
        jshshir: (r[10] || "").toString(),
        googleDocUrl: docUrl,
        examLanguage: (r[12] || "").toString(),
        submittedAt: "",
        status: "Qabul qilindi"
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      data: candidates
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
