/**
 * SAKURA CORE - Глобальний словник локалізації
 * Версія: 1.70
 */

const dictionary = {
  // --- УКРАЇНСЬКА МОВА ---
  ua: {
    // Статуси та завантаження
    status_checking: "Перевірка зв'язку...",
    status_online: "Онлайн",
    status_offline: "Офлайн",
    loading: "Завантаження...",
    
    // Мета-дані користувача
    label_user: "КОРИСТУВАЧ",
    label_role: "РОЛЬ",
    label_pay_via: "ОПЛАТА ЧЕРЕЗ",
    
    // Головне меню (Акордеон)
    menu_journal: "ЖУРНАЛ ВИРОБНИЦТВА",
    menu_warehouse: "СКЛАД ТА СТАТУСИ",
    menu_admin: "АДМІНІСТРУВАННЯ",
    
    // Посилання меню
    link_refresh: "Оновити журнал",
    link_add_obj: "Додати об'єкт",
    link_edit_obj: "Редагувати об'єкт",
    link_delete_obj: "Видалити об'єкт",
    link_config: "Налаштувати журнал",
    link_stock_list: "Список залишків",
    link_update_status: "Оновити статус",
    link_users: "Користувачі",
    link_logs: "Логи системи",
    link_ping_test: "Тест зв'язку з базою",
    
    // Повідомлення
    msg_select_action: "Оберіть дію в меню.",
    msg_error_server: "Помилка зв'язку з сервером Sakura",
    msg_db_success: "Сигнал дійшов до Supabase!"
  },

  // --- ENGLISH LANGUAGE ---
  en: {
    // Statuses & Loading
    status_checking: "Checking connection...",
    status_online: "Online",
    status_offline: "Offline",
    loading: "Loading...",
    
    // User meta-data
    label_user: "USER",
    label_role: "ROLE",
    label_pay_via: "PAYMENT VIA",
    
    // Main Menu
    menu_journal: "PRODUCTION LOG",
    menu_warehouse: "STOCK & STATUS",
    menu_admin: "ADMINISTRATION",
    
    // Menu Links
    link_refresh: "Refresh log",
    link_add_obj: "Add object",
    link_edit_obj: "Edit object",
    link_delete_obj: "Delete object",
    link_config: "Configure log",
    link_stock_list: "Stock list",
    link_update_status: "Update status",
    link_users: "Users",
    link_logs: "System logs",
    link_ping_test: "Connection test",
    
    // Messages
    msg_select_action: "Select action from menu.",
    msg_error_server: "Sakura server connection error",
    msg_db_success: "Signal reached Supabase!"
  }
};

/**
 * Універсальна функція перекладу
 * @param {string} key - Ключ фрази зі словника
 * @param {string} lang - Мод мови ('ua' або 'en')
 * @return {string} - Перекладений текст або сам ключ, якщо переклад відсутній
 */
function t(key, lang = 'ua') {
  // Перевіряємо, чи існує мова, інакше дефолт на 'ua'
  const selectedLang = dictionary[lang] ? lang : 'ua';
  
  // Повертаємо переклад або ключ, якщо перекладу немає
  return dictionary[selectedLang][key] || key;
}