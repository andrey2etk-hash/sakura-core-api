// 1. Унікальний ID клієнта в базі Supabase
const TENANT_ID = "859f518e-49b8-402b-a396-8488e390c500"; 

// 2. Глобальне налаштування мови для цієї таблиці (ua / en)
const SYSTEM_LANG = 'ua'; 

/**
 * Створення меню при відкритті таблиці
 */
function onOpen() {
  // Викликаємо ініціалізацію з підключеної бібліотеки
  Sakura_Core_Library.initSystem();
}

/**
 * Основна проксі-функція для запуску панелі (Sidebar)
 * Саме її викликає меню "📱 Панель керування"
 */
function openSidebarProxy() {
  // Передаємо і ID клієнта, і мову в ядро бібліотеки
  Sakura_Core_Library.launchApp(TENANT_ID, SYSTEM_LANG);
}

// --- МОСТИ ДЛЯ ВЗАЄМОДІЇ SIDEBAR <-> GOOGLE APPS SCRIPT ---

/**
 * Передає дані профілю користувача в інтерфейс
 */
function getUserData() {
  return Sakura_Core_Library.getUserData(TENANT_ID);
}

/**
 * Виконує дії на аркушах (наприклад, оновлення журналу)
 */
function generateSheetAction(actionType, tenantId) {
  return Sakura_Core_Library.generateSheetAction(actionType, tenantId);
}

/**
 * Єдиний диспетчер дій із payload
 */
function dispatchAction(actionType, payload, tenantId) {
  return Sakura_Core_Library.dispatchAction(actionType, payload || {}, tenantId || TENANT_ID);
}

/**
 * Перевірка зв'язку з сервером (пінг)
 */
function testSystemPing() {
  return Sakura_Core_Library.testSystemPing();
}

/**
 * Отримує список налаштовуваних полів із Supabase через API
 */
function getFieldDefinitions(tenantId) {
  return Sakura_Core_Library.getFieldDefinitions(tenantId || TENANT_ID);
}

/**
 * Перемикає активність поля (увімк./вимк.) через API
 */
function updateFieldDefinitionStatus(fieldId, isActive, tenantId) {
  return Sakura_Core_Library.updateFieldDefinitionStatus(tenantId || TENANT_ID, fieldId, isActive);
}

/**
 * Відкриває модальне вікно додавання об'єкта
 */
function openCreateProjectModal(tenantId) {
  return Sakura_Core_Library.openCreateProjectModal(tenantId || TENANT_ID);
}

/**
 * Сервісні повідомлення для Sidebar
 */
function setSidebarNotice(message) {
  return Sakura_Core_Library.setSidebarNotice(message);
}

function getSidebarNotice() {
  return Sakura_Core_Library.getSidebarNotice();
}

function setActiveModalMenu(menuId) {
  return Sakura_Core_Library.setActiveModalMenu(menuId);
}

function clearActiveModalMenu(menuId) {
  return Sakura_Core_Library.clearActiveModalMenu(menuId);
}

function getActiveModalMenu() {
  return Sakura_Core_Library.getActiveModalMenu();
}