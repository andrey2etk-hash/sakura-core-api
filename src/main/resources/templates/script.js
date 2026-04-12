window.onload = function() {
  google.script.run
    .withSuccessHandler(function(userData) {
      if (!userData) return;
      document.getElementById('display-user').textContent = userData.name;
      document.getElementById('display-role').textContent = userData.role;

      const role = (userData.role || "").toUpperCase();
      const isAdmin = ['ADMIN', 'DIRECTOR', 'DISPATCHER'].includes(role);

      if (isAdmin) {
        document.getElementById('admin-sub-production').style.display = 'block';
        document.getElementById('acc-admin-main').style.display = 'block';
        const payRow = document.getElementById('pay-row');
        if (payRow) {
          payRow.style.display = 'flex';
          document.getElementById('display-pay').innerText = userData.daysLeftStr;
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
  if (!wasOpen) { 
    submenu.classList.add('open'); 
    el.classList.add('active'); 
  }
}

function handleSubClick(el, id) {
  // Очищення попередніх станів
  document.querySelectorAll('.sub-link').forEach(link => {
    link.classList.remove('active', 'status-loading');
  });
  
  el.classList.add('active');
  const container = document.getElementById('content-container');

  if (id === 'refresh-journal') {
    // 1. Вмикаємо помаранчевий колір
    el.classList.add('status-loading');
    
    // 2. Виводимо спінер
    container.innerHTML = `
      <div class="info-status-block">
        <div class="spinner"></div>
        <span>Журнал виробництва оновлюється...</span>
      </div>
    `;

    // 3. Запуск процесу в Google Sheets
    google.script.run
      .withSuccessHandler(function(res) {
        el.classList.remove('status-loading');
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('uk-UA');
        
        container.innerHTML = `
          <div class="info-status-block">
            <span>Журнал виробництва оновлено в ${timeStr}, ${dateStr}</span>
          </div>
        `;
      })
      .withFailureHandler(function(err) {
        el.classList.remove('status-loading');
        container.innerHTML = '<div style="color:var(--danger); font-size:11px;">Помилка оновлення</div>';
      })
      .refreshProductionJournal();
  } else {
    container.innerHTML = "Активний модуль: " + id;
  }
}
