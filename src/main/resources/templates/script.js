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
  document.querySelectorAll('.sub-link').forEach(link => link.classList.remove('active'));
  el.classList.add('active');
  
  if (id === 'refresh-journal') {
    document.getElementById('content-container').innerHTML = "<i>Оновлення журналу...</i>";
    google.script.run
      .withSuccessHandler(function(res) {
        document.getElementById('content-container').innerText = res;
      })
      .refreshProductionJournal();
  } else {
    document.getElementById('content-container').innerText = "Активний модуль: " + id;
  }
}

function handleSubClick(el, id) {
  // Скидаємо активність з усіх пунктів
  document.querySelectorAll('.sub-link').forEach(link => {
    link.classList.remove('active', 'status-loading');
  });
  
  el.classList.add('active');
  const container = document.getElementById('content-container');

  if (id === 'refresh-journal') {
    // 1. Вмикаємо сигнальний стан
    el.classList.add('status-loading');
    container.innerHTML = '<div class="info-msg">Журнал виробництва оновлюється...</div>';

    // 2. Викликаємо Google Script
    google.script.run
      .withSuccessHandler(function(res) {
        // 3. Повертаємо фіолетовий (прибираємо сигнальний)
        el.classList.remove('status-loading');
        
        // 4. Фіксуємо час завершення
        const now = new Date();
        const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('uk-UA');
        
        container.innerHTML = `<div class="info-msg">Журнал виробництва оновлено в ${timeStr}, ${dateStr}</div>`;
      })
      .withFailureHandler(function(err) {
        el.classList.remove('status-loading');
        container.innerHTML = '<div style="color:red">Помилка оновлення</div>';
      })
      .refreshProductionJournal(); // Функція в Бібліотеці
  }
}
