/**
 * GRE Registration Backend - Google Apps Script
 * 
 * Ushbu skript Google Sheets va Google Docs o'rtasidagi avtomatik integratsiyani ta'minlaydi:
 * 1. Yangi foydalanuvchi ma'lumotlarini va pasport rasmlarini qabul qiladi.
 * 2. Har bir nomzod uchun alohida Google Doc fayli yaratib, pasport rasmlarini joylaydi.
 * 3. Ma'lumotlarni Google Sheets jadvaliga bo'sh joylarsiz, tartibli va ko'rkam formatda yozadi.
 * 4. Pasport va JSHSHIR bo'yicha dublikatlarni tekshiradi.
 */

// Ixtiyoriy: Agar script.google.com da alohida yaratilgan bo'lsa, jadval ID sini kiriting:
var SPREADSHEET_ID = ""; // Masalan: "1JidKuM5ZY2IG0Hqg-ylxKeEGqSZycpuSmtb-XPebw2g"

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
  if (lastRow === 0) return 0;
  
  var values = sheet.getRange(1, 1, lastRow, 9).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    var r = values[i];
    // Qatorda Ism, Familiya yoki Pasport mavjud bo'lsa
    if ((r[0] && r[0].toString().trim() !== "") ||
        (r[1] && r[1].toString().trim() !== "") ||
        (r[4] && r[4].toString().trim() !== "")) {
      return i + 1;
    }
  }
  return 0;
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
 * 4. Bitta qatorni ko'rkam va tartibli formatlash
 */
function formatSingleRow(sheet, rowNum, birthDate, passportNum, jshshirNum, phoneNum) {
  sheet.setRowHeight(rowNum, 36);
  var rowRange = sheet.getRange(rowNum, 1, 1, 9);

  // Ustunlar matn formati
  sheet.getRange(rowNum, 4).setNumberFormat("@").setValue(birthDate || "");
  sheet.getRange(rowNum, 5).setNumberFormat("@").setValue(passportNum || "");
  sheet.getRange(rowNum, 6).setNumberFormat("@").setValue(jshshirNum || "");
  sheet.getRange(rowNum, 7).setNumberFormat("@").setValue(phoneNum || "");

  // Shrift, markazlashtirish va chegara
  rowRange.setFontFamily("Arial");
  rowRange.setFontSize(10);
  rowRange.setVerticalAlignment("middle");
  rowRange.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  rowRange.setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  
  // Markazga tekislash (Sana, Pasport, JSHSHIR, Telefon, Link, Til)
  sheet.getRange(rowNum, 4, 1, 6).setHorizontalAlignment("center");
}

/**
 * 5. POST so'rovini qabul qilish (Forma yuborilganda)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // Concurrency lock (max 30s)

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
    var sheet = ss.getSheetByName("informatika") || ss.getSheetByName("Varaq1") || ss.getActiveSheet();
    
    // Agar sarlavhalar (Header) mavjud bo'lmasa, o'rnatamiz
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ISM",
        "FAMILYA",
        "EMAIL",
        "T-YIL",
        "P-SR",
        "JSHSHIR",
        "TEL-№",
        "PASPORT RASM",
        "IMTHION TILI"
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setBackground("#15803d"); // Yashil fon
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Arial");
      headerRange.setFontSize(11);
      headerRange.setVerticalAlignment("middle");
      headerRange.setHorizontalAlignment("center");
      sheet.setRowHeight(1, 38);
      sheet.setFrozenRows(1);
    }

    // DUBLIKAT TEKSHIRUVI: Pasport seriyasi yoki JSHSHIR bo'yicha
    var inputJshshir = (data.jshshir || "").toString().trim();
    var inputPass = (data.passportNumber || "").toString().replace(/\s/g, "").toUpperCase();

    var realLastRow = getRealLastRow(sheet);
    if (realLastRow > 1) {
      var rows = sheet.getRange(2, 1, realLastRow - 1, 9).getValues();
      for (var i = 0; i < rows.length; i++) {
        var existingPass = (rows[i][4] || "").toString().replace(/\s/g, "").toUpperCase(); // P-SR (5-ustun)
        var existingJshshir = (rows[i][5] || "").toString().trim(); // JSHSHIR (6-ustun)

        if ((inputJshshir && existingJshshir === inputJshshir) || (inputPass && existingPass === inputPass)) {
          return ContentService.createTextOutput(JSON.stringify({
            result: "duplicate",
            message: "Siz allaqachon Google Sheets jadvalida mavjudsiz!"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Google Doc yaratish (Pasport rasmlari uchun)
    var docTitle = "GRE Pasport - " + (data.firstName || "") + " " + (data.lastName || "");
    var doc = DocumentApp.create(docTitle);
    var body = doc.getBody();
    var hasImages = false;

    // Pasport Oldi Rasmi
    if (data.passportFront && data.passportFront.dataUrl) {
      try {
        var frontBlob = dataUrlToBlob(data.passportFront.dataUrl, "passport_front");
        if (frontBlob) {
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

    // Dastlabki bo'sh paragrafni o'chirish
    if (hasImages && body.getNumChildren() > 1) {
      var firstChild = body.getChild(0);
      if (firstChild.getType() === DocumentApp.ElementType.PARAGRAPH && firstChild.asParagraph().getText().trim() === "") {
        firstChild.removeFromParent();
      }
    }

    doc.saveAndClose();

    // Google Doc fayliga ochiq havola ruxsatini berish
    try {
      DriveApp.getFileById(doc.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eShare) {
      console.log("Drive sharing error:", eShare);
    }

    var googleDocUrl = doc.getUrl();

    // Sanani formatlash (DD.MM.YYYY)
    var formattedBirthDate = data.birthDate || "";
    if (formattedBirthDate.indexOf("-") !== -1) {
      var dateParts = formattedBirthDate.split("-");
      if (dateParts.length === 3 && dateParts[0].length === 4) {
        formattedBirthDate = dateParts[2] + "." + dateParts[1] + "." + dateParts[0];
      }
    }

    var phoneValue = (data.phone || "").replace(/^\+/, "").trim();

    // BO'SH QATORLARSIZ DARHOL KETMA-KET QATORGA YOZISH:
    var targetRow = realLastRow + 1;
    var rowValues = [
      data.firstName || "",
      data.lastName || "",
      data.email || "",
      formattedBirthDate,
      data.passportNumber || "",
      data.jshshir || "",
      phoneValue,
      "", // Pasport rasm havolasi (RichTextValue orqali o'rnatiladi)
      (data.examModule ? (data.examModule + " (" + (data.examLanguage || "") + ")") : (data.examLanguage || ""))
    ];

    sheet.getRange(targetRow, 1, 1, 9).setValues([rowValues]);

    // Google Doc havolasini RichText formatida joylash (Locale xatolari va #ERROR! ning oldini olish uchun)
    if (googleDocUrl) {
      try {
        var richText = SpreadsheetApp.newRichTextValue()
          .setText("📄 Hujjatni ko'rish")
          .setLinkUrl(googleDocUrl)
          .build();
        sheet.getRange(targetRow, 8).setRichTextValue(richText);
      } catch (errRich) {
        console.log("RichText error:", errRich);
        sheet.getRange(targetRow, 8).setValue(googleDocUrl);
      }
    }

    formatSingleRow(sheet, targetRow, formattedBirthDate, data.passportNumber, data.jshshir, phoneValue);

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
 * 6. GET so'roviga barcha nomzodlarni qaytarish
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
    var sheet = ss.getSheetByName("informatika") || ss.getSheetByName("Varaq1") || ss.getActiveSheet();
    var realLast = getRealLastRow(sheet);

    if (realLast <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: "success",
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var rows = sheet.getRange(2, 1, realLast - 1, 9).getValues();
    var candidates = [];

    for (var i = rows.length - 1; i >= 0; i--) {
      var r = rows[i];
      if (!r[0] && !r[1] && !r[4]) continue;

      candidates.push({
        id: "GRE-" + (1000 + i + 1),
        firstName: (r[0] || "").toString(),
        lastName: (r[1] || "").toString(),
        email: (r[2] || "").toString(),
        birthDate: (r[3] || "").toString(),
        passportNumber: (r[4] || "").toString(),
        jshshir: (r[5] || "").toString(),
        phone: (r[6] || "").toString(),
        googleDocUrl: (r[7] || "").toString(),
        examLanguage: (r[8] || "").toString(),
        status: "Qabul qilindi",
        submittedAt: ""
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

/**
 * 7. UTILITY: Jadvaldagi barcha bo'sh oraliqlarni yo'qotib, ma'lumotlarni tepaga zichlab tartibga solish
 * Apps Script oynasida 'formatAllSheetRows' ni tanlab 'Run' (▶️) bosing!
 */
function formatAllSheetRows() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("informatika") || ss.getSheetByName("Varaq1") || ss.getActiveSheet();
  var realLast = getRealLastRow(sheet);

  if (realLast <= 0) return;

  var values = sheet.getRange(1, 1, realLast, 9).getValues();
  var cleanRows = [];
  
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (i === 0 || (r[0] && r[0].toString().trim() !== "") || (r[1] && r[1].toString().trim() !== "") || (r[4] && r[4].toString().trim() !== "")) {
      cleanRows.push(r);
    }
  }

  // To'liq jadvalni tozalab, faqat tartibli qatorlarni qayta yozish
  var totalRows = Math.max(sheet.getLastRow(), cleanRows.length);
  sheet.getRange(1, 1, totalRows, 9).clearContent();
  sheet.getRange(1, 1, cleanRows.length, 9).setValues(cleanRows);

  // Header 1-qatorni formatlash
  var headerRange = sheet.getRange(1, 1, 1, 9);
  headerRange.setBackground("#15803d");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(11);
  headerRange.setVerticalAlignment("middle");
  headerRange.setHorizontalAlignment("center");
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  if (cleanRows.length > 1) {
    var dataRange = sheet.getRange(2, 1, cleanRows.length - 1, 9);
    dataRange.setFontFamily("Arial");
    dataRange.setFontSize(10);
    dataRange.setVerticalAlignment("middle");
    dataRange.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    dataRange.setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

    for (var rowIdx = 2; rowIdx <= cleanRows.length; rowIdx++) {
      sheet.setRowHeight(rowIdx, 36);

      var cellRange = sheet.getRange(rowIdx, 8);
      var valH = cellRange.getValue().toString();
      var formulaH = cellRange.getFormula();
      
      var urlMatch = valH.match(/https?:\/\/[^\s"'\)]+/) || formulaH.match(/https?:\/\/[^\s"'\)]+/);
      if (urlMatch) {
        var targetUrl = urlMatch[0];
        try {
          var rText = SpreadsheetApp.newRichTextValue()
            .setText("📄 Hujjatni ko'rish")
            .setLinkUrl(targetUrl)
            .build();
          cellRange.setRichTextValue(rText);
        } catch (eRich) {
          cellRange.setValue(targetUrl);
        }
      }
    }

    sheet.getRange(2, 4, cleanRows.length - 1, 6).setHorizontalAlignment("center");
  }
}
