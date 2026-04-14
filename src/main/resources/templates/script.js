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

    startSidebarNoticePolling();
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

          const message = res && res.ok ? res.data : (res && res.error ? res.error : "Невідома помилка");
          container.innerHTML = `<div class="info-status-block">${message} о ${timeStr}, ${dateStr}</div>`;
        })
        .withFailureHandler(function(err) {
          el.classList.remove('status-loading');
          container.innerHTML = `<div class="info-status-block" style="color:#ff4d4d">Помилка: ${err}</div>`;
        })
        .dispatchAction('REFRESH_PROD_LOG', {}, tenantId);
    } else if (id === 'add-obj') {
      container.innerHTML = `<div class="info-status-block">Відкриваю форму створення об'єкта...</div>`;
      google.script.run
        .withSuccessHandler(function() {
          container.innerHTML = `<div class="info-status-block">Форма відкрита. Після збереження натисни "Оновити журнал".</div>`;
        })
        .withFailureHandler(function(err) {
          container.innerHTML = `<div class="info-status-block" style="color:#ff4d4d">Не вдалося відкрити форму: ${escapeHtml(err && err.message ? err.message : String(err))}</div>`;
        })
        .openCreateProjectModal(tenantId);
    } else if (id === 'config-journal') {
      el.classList.add('status-loading');
      container.innerHTML = `<div class="info-status-block"><div class="spinner"></div><span>Завантаження конфігурації полів...</span></div>`;

      google.script.run
        .withSuccessHandler(function(fields) {
          el.classList.remove('status-loading');
          renderFieldDefinitions(container, fields, tenantId);
        })
        .withFailureHandler(function(err) {
          el.classList.remove('status-loading');
          container.innerHTML = `<div class="info-status-block" style="color:#ff4d4d">Помилка завантаження field_definitions: ${escapeHtml(err && err.message ? err.message : String(err))}</div>`;
        })
        .getFieldDefinitions(tenantId);
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

  function renderFieldDefinitions(container, fields, tenantId) {
    if (!Array.isArray(fields)) {
      container.innerHTML = `<div class="info-status-block" style="color:#ff4d4d">Невірний формат даних field_definitions</div>`;
      return;
    }

    if (fields.length === 0) {
      container.innerHTML = `<div class="info-status-block">Поля для цього tenant ще не налаштовані.</div>`;
      return;
    }

    const rows = fields.map(function(field) {
      const state = field.is_active ? "Активне" : "Вимкнене";
      const stateColor = field.is_active ? "#6dc36d" : "#d67070";
      const buttonLabel = field.is_active ? "Вимкнути" : "Увімкнути";
      const nextState = !field.is_active;
      return `
        <tr>
          <td><code>${escapeHtml(field.field_key || "-")}</code></td>
          <td>${escapeHtml(field.field_label || "-")}</td>
          <td>${escapeHtml(field.field_type || "checkbox")}</td>
          <td><span style="color:${stateColor};font-weight:700;">${state}</span></td>
          <td>
            <button
              onclick="toggleFieldState('${escapeHtml(field.id)}', ${nextState}, '${escapeHtml(tenantId)}')"
              style="border:none;padding:6px 10px;border-radius:6px;cursor:pointer;background:#6A30A8;color:#fff;"
            >
              ${buttonLabel}
            </button>
          </td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <div class="info-status-block" style="margin-bottom:10px;">
        Налаштування полів журналу (${fields.length})
      </div>
      <div style="overflow:auto; max-height:320px; border:1px solid rgba(255,255,255,.12); border-radius:8px;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#2a1f36;">
              <th style="text-align:left; padding:8px;">Ключ</th>
              <th style="text-align:left; padding:8px;">Назва</th>
              <th style="text-align:left; padding:8px;">Тип</th>
              <th style="text-align:left; padding:8px;">Статус</th>
              <th style="text-align:left; padding:8px;">Дія</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function toggleFieldState(fieldId, nextState, tenantId) {
    const container = document.getElementById('content-container');
    container.innerHTML = `<div class="info-status-block"><div class="spinner"></div><span>Оновлення поля...</span></div>`;

    google.script.run
      .withSuccessHandler(function() {
        google.script.run
          .withSuccessHandler(function(fields) {
            renderFieldDefinitions(container, fields, tenantId);
          })
          .withFailureHandler(function(err) {
            container.innerHTML = `<div class="info-status-block" style="color:#ff4d4d">Помилка повторного завантаження: ${escapeHtml(err && err.message ? err.message : String(err))}</div>`;
          })
          .getFieldDefinitions(tenantId);
      })
      .withFailureHandler(function(err) {
        container.innerHTML = `<div class="info-status-block" style="color:#ff4d4d">Не вдалося оновити поле: ${escapeHtml(err && err.message ? err.message : String(err))}</div>`;
      })
      .updateFieldDefinitionStatus(fieldId, nextState, tenantId);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  let lastNoticeTs = "";
  function startSidebarNoticePolling() {
    setInterval(function() {
      google.script.run
        .withSuccessHandler(function(notice) {
          if (!notice || !notice.ts || notice.ts === lastNoticeTs) return;
          lastNoticeTs = notice.ts;
          const node = document.getElementById('global-notice');
          if (!node) return;
          node.innerHTML = `Оновлення: ${escapeHtml(notice.message)} • ${new Date(notice.ts).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
        })
        .getSidebarNotice();
    }, 2500);

    setInterval(function() {
      google.script.run
        .withSuccessHandler(function(activeMenuId) {
          syncModalMenuState(activeMenuId || "");
        })
        .getActiveModalMenu();
    }, 1200);
  }

  function syncModalMenuState(activeMenuId) {
    const modalLinks = document.querySelectorAll('.sub-link[data-modal="1"]');
    modalLinks.forEach(function(link) {
      link.classList.remove('status-loading');
      if (link.getAttribute('data-action') === activeMenuId) {
        link.classList.add('active', 'status-loading');
      } else {
        link.classList.remove('active');
      }
    });
  }
