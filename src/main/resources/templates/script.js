window.onload = function() {
  google.script.run
    .withSuccessHandler(function(userData) {
      if (!userData) return;
      document.getElementById('display-user').textContent = userData.name || userData.full_name;
      document.getElementById('display-role').textContent = userData.role;

      const role = (userData.role || "").toUpperCase();
      if (['ADMIN', 'DIRECTOR', 'DISPATCHER'].includes(role)) {
        document.getElementById('admin-sub-production').style.display = 'block';
        document.getElementById('acc-admin-main').style.display = 'block';
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
    // ЧИСТИЙ БЛОК БЕЗ ПАЛОК
    container.innerHTML = `<div class="info-status-block"><div class="spinner"></div><span>Оновлення...</span></div>`;

    google.script.run
      .withSuccessHandler(function(res) {
        el.classList.remove('status-loading');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        container.innerHTML = `<div class="info-status-block">Оновлено в ${timeStr}</div>`;
      })
      .refreshProductionJournal();
  } else {
    container.innerHTML = "Модуль: " + id;
  }
}
