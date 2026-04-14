/**
 * SAKURA CORE LIBRARY - ВЕРСІЯ 1.70
 * Основний двигун логіки
 */

// --- 1. ПУБЛІЧНІ ФУНКЦІЇ (Викликаються з Конектора таблиці) ---

/**
 * Ініціалізація меню в таблиці клієнта
 */
function initSystem() {
  SpreadsheetApp.getUi().createMenu('SAKURA CORE')
    .addItem('📱 Панель керування', 'openSidebarProxy')
    .addToUi();
}

/**
 * Запуск інтерфейсу (Sidebar)
 * @param {string} tenantId - ID клієнта
 * @param {string} userLang - Мова системи (ua/en)
 */
function launchApp(tenantId, userLang = 'ua') {
  const url = `https://sakura-core-api.onrender.com/api/interface?tid=${tenantId}`;
  
  try {
    const response = UrlFetchApp.fetch(url);
    const htmlString = response.getContentText();
    
    // Створюємо шаблон на основі HTML з сервера Render
    const template = HtmlService.createTemplate(htmlString);
    
    // Передаємо мову та функцію перекладу (з файлу i18n.gs) у шаблон
    template.currentLang = userLang; 
    template.t = function(key) {
      return t(key, this.currentLang); 
    };
    
    const ui = template.evaluate()
                 .setTitle('Sakura Core v1.70')
                 .setWidth(320);
                 
    SpreadsheetApp.getUi().showSidebar(ui);
    
  } catch (e) {
    SpreadsheetApp.getUi().alert("Помилка Sakura: " + e.toString());
  }
}

// --- 2. ЛОГІКА ДИНАМІЧНИХ ДІЙ (Для google.script.run) ---

/**
 * Універсальний роутер для дій із таблицею
 */
function generateSheetAction(actionType, tenantId) {
  switch(actionType) {
    case 'REFRESH_PROD_LOG':
      return refreshProductionJournal(tenantId);
    case 'GET_FIELD_DEFINITIONS':
      return getFieldDefinitions(tenantId);
    default:
      return "Дію не розпізнано";
  }
}

/**
 * Єдиний диспетчер команд від Sidebar/модалок
 */
function dispatchAction(actionType, payload, tenantId) {
  const safePayload = payload || {};
  const effectiveTenantId = tenantId || safePayload.tenant_id;

  switch (actionType) {
    case 'REFRESH_PROD_LOG':
      return { ok: true, data: refreshProductionJournal(effectiveTenantId) };
    case 'GET_FIELD_DEFINITIONS':
      return { ok: true, data: getFieldDefinitions(effectiveTenantId) };
    case 'CREATE_PROJECT':
      return { ok: true, data: createProject(effectiveTenantId, safePayload) };
    default:
      return { ok: false, error: "Дію не розпізнано: " + actionType };
  }
}

/**
 * Отримання профілю користувача з сервера
 */
function getUserData(tenantId) {
  const userEmail = Session.getActiveUser().getEmail();
  const url = `https://sakura-core-api.onrender.com/get-user?email=${userEmail}&tenant_id=${tenantId}`;
  
  try {
    const response = UrlFetchApp.fetch(url, {"method": "GET", "muteHttpExceptions": true});
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return {
        name: data.full_name || "Користувач",
        role: (data.role || "GUEST").toUpperCase(),
        email: userEmail,
        daysLeftStr: "∞" // Тут можна додати логіку підписки
      };
    }
    return { name: "Гість", role: "GUEST", email: userEmail };
  } catch (e) {
    return { name: "Сервер offline", role: "ERROR" };
  }
}

// --- 3. РОБОТА З ЖУРНАЛОМ ВИРОБНИЦТВА ---

/**
 * Синхронізація даних з Supabase до Google Таблиці
 */
function refreshProductionJournal(tenantId) {
  const sheet = ensureSheet("PROD_LOG");
  const url = `https://sakura-core-api.onrender.com/projects?tenant_id=${tenantId}`;
  
  try {
    const response = UrlFetchApp.fetch(url, {"method": "get", "muteHttpExceptions": true});
    const data = JSON.parse(response.getContentText());

    if (data && Array.isArray(data)) {
      // Очищення старих даних (з 6-го рядка)
      const lastRow = sheet.getLastRow();
      if (lastRow >= 6) {
        sheet.getRange(6, 1, lastRow - 5, 6).clearContent();
      }

      if (data.length > 0) {
        const rows = data.map(item => [
          item.object_number || "-", 
          item.name || "-",           
          item.customer || "-",       
          item.deadline || "-",       
          item.manager_name || "-",   
          item.status || "planned"
        ]);

        sheet.getRange(6, 1, rows.length, 6).setValues(rows);
        
        // Оновлення дати синхронізації
        const now = new Date();
        sheet.getRange("F4").setValue(now).setNumberFormat("dd.MM.yyyy HH:mm");
        
        return `Журнал оновлено! Об'єктів: ${data.length} ✅`;
      }
      return "У базі порожньо 📭";
    }
    return "Помилка отримання даних ❌";
    
  } catch (e) {
    return "Помилка зв'язку: " + e.toString();
  }
}

// --- 4. СЕРВІСНІ ФУНКЦІЇ ---

/**
 * Перевірка наявності та створення листа з оформленням
 */
function ensureSheet(sheetNameKey) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Використовуємо наш словник для назви листа (беремо UA для стабільності назв)
  const localizedName = t('menu_journal', 'ua'); 
  let sheet = ss.getSheetByName(localizedName);

  if (!sheet) {
    sheet = ss.insertSheet(localizedName, 1);
    
    // Базовий дизайн "Sakura Style"
    sheet.getRange("A1").setValue("🌸 SAKURA CORE | " + localizedName.toUpperCase())
         .setFontSize(16).setFontWeight("bold").setFontColor("#6A30A8");
    
    sheet.getRange("D4").setValue("Останнє оновлення:").setHorizontalAlignment("right");
    sheet.getRange("F4").setFontWeight("bold").setFontColor("#6A30A8");

    const header = [["№ об'єкта", "Назва проєкту", "Замовник", "Дедлайн", "Менеджер", "Статус"]];
    sheet.getRange(5, 1, 1, 6).setValues(header)
         .setBackground("#6A30A8").setFontColor("white").setFontWeight("bold").setHorizontalAlignment("center");
    
    sheet.setFrozenRows(5);
    sheet.setTabColor("#6A30A8");
    sheet.setColumnWidth(1, 100);
    sheet.setColumnWidth(2, 250);
  }
  sheet.activate();
  return sheet;
}

/**
 * Перевірка зв'язку з API
 */
function testSystemPing() {
  const url = "https://sakura-core-api.onrender.com/test-ping";
  try {
    const response = UrlFetchApp.fetch(url, {"muteHttpExceptions": true});
    return response.getContentText();
  } catch (e) {
    return "Сервер не відповідає: " + e.toString();
  }
}

/**
 * Відкриває модальне вікно створення проєкту
 */
function openCreateProjectModal(tenantId) {
  setActiveModalMenu('add-obj');
  const template = HtmlService.createTemplateFromFile('ProjectCreateModal');
  template.tenantId = tenantId;
  template.sourceMenuId = 'add-obj';
  const html = template.evaluate()
    .setWidth(460)
    .setHeight(570);
  SpreadsheetApp.getUi().showModalDialog(html, "Створити об'єкт");
}

/**
 * Отримання конфігурації полів журналу з сервера
 */
function getFieldDefinitions(tenantId) {
  const url = `https://sakura-core-api.onrender.com/field-definitions?tenant_id=${encodeURIComponent(tenantId)}`;
  try {
    const response = UrlFetchApp.fetch(url, {"method": "get", "muteHttpExceptions": true});
    const code = response.getResponseCode();
    const body = response.getContentText();

    if (code !== 200) {
      throw new Error(`HTTP ${code}: ${body}`);
    }

    const data = JSON.parse(body);
    if (!Array.isArray(data)) {
      throw new Error("Невірний формат відповіді field-definitions");
    }

    return data;
  } catch (e) {
    throw new Error("Помилка отримання field_definitions: " + e.toString());
  }
}

/**
 * Оновлення активності поля (on/off) у field_definitions
 */
function updateFieldDefinitionStatus(tenantId, fieldId, isActive) {
  const url = `https://sakura-core-api.onrender.com/field-definitions/${encodeURIComponent(fieldId)}/toggle`;
  const payload = JSON.stringify({
    tenant_id: tenantId,
    is_active: Boolean(isActive)
  });

  try {
    const response = UrlFetchApp.fetch(url, {
      method: "patch",
      contentType: "application/json",
      payload: payload,
      muteHttpExceptions: true
    });
    const code = response.getResponseCode();
    const body = response.getContentText();

    if (code !== 200) {
      throw new Error(`HTTP ${code}: ${body}`);
    }

    return JSON.parse(body);
  } catch (e) {
    throw new Error("Помилка оновлення field_definitions: " + e.toString());
  }
}

/**
 * Створення нового об'єкта (project) через API
 */
function createProject(tenantId, payload) {
  const url = "https://sakura-core-api.onrender.com/projects";
  const body = JSON.stringify({
    tenant_id: tenantId,
    name: payload.name,
    customer: payload.customer || "",
    deadline: payload.deadline || null,
    manager_name: payload.manager_name || "",
    object_number: payload.object_number || "",
    status: payload.status || "planned"
  });

  try {
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: body,
      muteHttpExceptions: true
    });
    const code = response.getResponseCode();
    const text = response.getContentText();

    if (code !== 201) {
      throw new Error(`HTTP ${code}: ${text}`);
    }

    return JSON.parse(text);
  } catch (e) {
    throw new Error("Помилка створення об'єкта: " + e.toString());
  }
}

/**
 * Зберігає коротке повідомлення для Sidebar поточного користувача
 */
function setSidebarNotice(message) {
  const notice = {
    message: message || "",
    ts: new Date().toISOString()
  };
  CacheService.getUserCache().put("SAKURA_SIDEBAR_NOTICE", JSON.stringify(notice), 120);
  return notice;
}

/**
 * Повертає останнє службове повідомлення для Sidebar
 */
function getSidebarNotice() {
  const raw = CacheService.getUserCache().get("SAKURA_SIDEBAR_NOTICE");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Позначає активний пункт меню, що відкрив модальне вікно
 */
function setActiveModalMenu(menuId) {
  CacheService.getUserCache().put("SAKURA_ACTIVE_MODAL_MENU", menuId || "", 600);
  return { ok: true, menuId: menuId || "" };
}

/**
 * Знімає активний пункт меню модального вікна
 */
function clearActiveModalMenu(menuId) {
  const cache = CacheService.getUserCache();
  const active = cache.get("SAKURA_ACTIVE_MODAL_MENU");
  if (!menuId || !active || active === menuId) {
    cache.remove("SAKURA_ACTIVE_MODAL_MENU");
  }
  return { ok: true };
}

/**
 * Повертає активний пункт меню модального вікна
 */
function getActiveModalMenu() {
  return CacheService.getUserCache().get("SAKURA_ACTIVE_MODAL_MENU") || "";
}