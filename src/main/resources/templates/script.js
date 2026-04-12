// ... window.onload та toggleAcc залишаються без змін ...

function handleSubClick(el, id) {
  document.querySelectorAll('.sub-link').forEach(link => {
    link.classList.remove('active', 'status-loading');
  });
  
  el.classList.add('active');
  const container = document.getElementById('content-container');

  if (id === 'refresh-journal') {
    el.classList.add('status-loading');
    
    // Виводимо тільки спінер і текст (без палки)
    container.innerHTML = `
      <div class="info-status-block">
        <div class="spinner"></div>
        <span>Журнал виробництва оновлюється...</span>
      </div>
    `;

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
