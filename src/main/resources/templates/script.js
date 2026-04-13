window.onload = function() {
  // Отримуємо tenantId з URL (він передається сервером при завантаженні сайдбару)
  const urlParams = new URLSearchParams(window.location.search);
  const tenantId = urlParams.get('tid') || "859f518e-49b8-402b-a396-8488e390c500";

  google.script.run
    .withSuccessHandler(function(userData) {
      if (!userData) return;
      
      // 1. Вивід імені та ролі
      document.getElementById('display-user').textContent = userData.name || userData.full_name;
      document.getElementById('display-role').textContent = userData.role;

      const role = (userData.role || "").toUpperCase();
      const isAdminOrDispatcher = ['ADMIN', 'DIRECTOR', 'DISPATCHER'].includes(role);

      // 2. Фільтрація Журналу Виробництва
      const adminSection = document.getElementById('admin-sub-production');
      if (isAdminOrDispatcher) {
        if (adminSection) adminSection.style.display = 'block';
      } else {
        if (adminSection) adminSection.remove(); 
      }

      // 3. Відображення меню адміністрування та оплати
      if (isAdminOrDispatcher) {
        const adminMenu = document.getElementById('acc-admin-main');
        if (adminMenu) adminMenu.style.display = 'block';
        
        const payRow = document.getElementById('pay-row');
        if (payRow) {
          payRow.style.display = 'flex';
          document.getElementById('display-pay').innerText = userData.daysLeftStr || "20 днів";
        }
      }
    })
    .getUserData(tenantId); // Передаємо tenantId для ідентифікації
};

function toggleAcc(el, submenuId) {
  const submenu = document.getElementById(submenuId);
  if (!submenu) return;
  const wasOpen = submenu.classList.contains('open');
  document.querySelectorAll('.submenu').forEach(s => s.classList.remove('open'));
  document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('active'));
  if (!wasOpen) { submenu.classList.add('open'); el.classList.add('active'); }
}

function handleSubClick(el, id) {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantId = urlParams.get('tid') || "859f518e-49b8-402b-a396-8488e390c500";
  
  document.querySelectorAll('.sub-link').forEach(link => link.classList.remove('active', 'status-loading'));
  el.classList.add('active');
  const container = document.getElementById('content-container');

  // ЛОГІКА ОНОВЛЕННЯ ЖУРНАЛУ (Через універсальний перемикач)
  if (id === 'refresh-journal') {
    el.classList.add('status-loading');
    container.innerHTML = `<div class="info-status-block"><div class="spinner"></div><span>Оновлення журналу...</span></div>`;

    google.script.run
      .withSuccessHandler(function(res) {
        el.classList.remove('status-loading');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('uk-UA');
        
        // Виводимо реальну відповідь з бібліотеки (res)
        container.innerHTML = `<div class="info-status-block">${res} о ${timeStr}, ${dateStr}</div>`;
      })
      .withFailureHandler(function(err) {
        el.classList.remove('status-loading');
        container.innerHTML = `<div class="info-status-block" style="color:#ff4d4d">Помилка: ${err}</div>`;
      })
      .generateSheetAction('REFRESH_PROD_LOG', tenantId); // ВИКЛИК УНІВЕРСАЛЬНОЇ ФУНКЦІЇ
  } else {
    container.innerHTML = "Модуль: " + id;
  }
}
function runTestPing() {
  const container = document.getElementById('content-container');
  container.innerHTML = "Відправка тестового сигналу...";
  
  google.script.run
    .withSuccessHandler(function(res) {
       container.innerHTML = "Результат: " + res;
    })
    .testSystemPing();
}

/**
 * Оновлення статусу зв'язку (v1.70)
 * Використовує глобальний об'єкт i18n
 */
function updateUIStatus(isOnline) {
  const statusText = document.getElementById('status-text');
  const statusBar = document.getElementById('connection-status');
  
  // Беремо текст із нашого "моста"
  statusText.innerText = isOnline ? i18n.status_online : i18n.status_offline;
  
  if (isOnline) {
    statusBar.classList.remove('status-offline');
    statusBar.classList.add('status-online');
  } else {
    statusBar.classList.remove('status-online');
    statusBar.classList.add('status-offline');
  }
}
