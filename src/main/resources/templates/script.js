window.onload = function() {
  google.script.run
    .withSuccessHandler(function(userData) {
      if (!userData) return;
      
      // 1. Вивід імені та ролі (темно-сірий колір вже в CSS)
      document.getElementById('display-user').textContent = userData.name || userData.full_name;
      document.getElementById('display-role').textContent = userData.role;

      const role = (userData.role || "").toUpperCase();
      const isAdminOrDispatcher = ['ADMIN', 'DIRECTOR', 'DISPATCHER'].includes(role);

      // 2. Фільтрація Журналу Виробництва (ГОЛОВНИЙ ФІКС БАГА)
      const adminSection = document.getElementById('admin-sub-production');
      if (isAdminOrDispatcher) {
        if (adminSection) adminSection.style.display = 'block';
      } else {
        if (adminSection) adminSection.remove(); // Видаляємо фізично для інших ролей
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
    .getUserData();
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
  document.querySelectorAll('.sub-link').forEach(link => link.classList.remove('active', 'status-loading'));
  el.classList.add('active');
  const container = document.getElementById('content-container');

  if (id === 'refresh-journal') {
    el.classList.add('status-loading');
    container.innerHTML = `<div class="info-status-block"><div class="spinner"></div><span>Оновлення журналу...</span></div>`;

    google.script.run
      .withSuccessHandler(function(res) {
        el.classList.remove('status-loading');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('uk-UA');
        container.innerHTML = `<div class="info-status-block">Журнал оновлено в ${timeStr}, ${dateStr}</div>`;
      })
      .refreshProductionJournal();
  } else {
    container.innerHTML = "Модуль: " + id;
  }
}
