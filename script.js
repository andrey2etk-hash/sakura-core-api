window.onload = function() {
  const tenantId = getTenantId();

  google.script.run
    .withSuccessHandler(function(userData) {
      if (!userData) return;

      const userName = userData.name || userData.full_name || "Користувач";
      const role = (userData.role || "GUEST").toUpperCase();

      setText('display-user', userName);
      setText('display-role', role);
      setText('profile-user', userName);
      setText('profile-role', role);

      applyDynamicMenuAccess(userData);
      updateUIStatus(true);
    })
    .withFailureHandler(function() {
      updateUIStatus(false);
    })
    .getUserData(tenantId);

  syncMenuButtons();
  startSidebarNoticePolling();
};

function getTenantId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('tid') || "859f518e-49b8-402b-a396-8488e390c500";
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function toggleAcc(el, submenuId) {
  const targetGroup = el.closest('.menu-group');
  const targetSubmenu = document.getElementById(submenuId);
  if (!targetGroup || !targetSubmenu) return;

  const shouldOpen = !targetGroup.classList.contains('is-open');

  document.querySelectorAll('.menu-group').forEach(function(group) {
    group.classList.remove('is-open');
  });

  if (shouldOpen) {
    targetGroup.classList.add('is-open');
  }

  syncMenuButtons();
}

function syncMenuButtons() {
  document.querySelectorAll('.menu-group').forEach(function(group) {
    const trigger = group.querySelector('.menu-item');
    if (!trigger) return;

    if (group.classList.contains('is-open')) {
      trigger.classList.add('menu-item--active');
    } else {
      trigger.classList.remove('menu-item--active');
    }
  });
}

function handleSubClick(el, id) {
  if (!el) return;

  const tenantId = getTenantId();
  const container = document.getElementById('content-container');

  document.querySelectorAll('.submenu-item').forEach(function(link) {
    link.classList.remove('active', 'status-loading');
  });
  el.classList.add('active');

  if (id === 'refresh-journal') {
    el.classList.add('status-loading');
    container.innerHTML = '<div class="info-status-block"><div class="spinner"></div><span>Оновлення журналу...</span></div>';

    google.script.run
      .withSuccessHandler(function(res) {
        el.classList.remove('status-loading');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('uk-UA');
        const message = res && res.ok ? res.data : (res && res.error ? res.error : "Невідома помилка");
        container.innerHTML = '<div class="info-status-block">' + escapeHtml(message) + ' о ' + timeStr + ', ' + dateStr + '</div>';
      })
      .withFailureHandler(function(err) {
        el.classList.remove('status-loading');
        container.innerHTML = '<div class="info-status-block message-danger">Помилка: ' + escapeHtml(err && err.message ? err.message : String(err)) + '</div>';
      })
      .dispatchAction('REFRESH_PROD_LOG', {}, tenantId);
    return;
  }

  if (id === 'add-obj') {
    container.innerHTML = '<div class="info-status-block">Відкриваю форму створення об\'єкта...</div>';
    google.script.run
      .withSuccessHandler(function() {
        container.innerHTML = '<div class="info-status-block">Форма відкрита. Після збереження натисни "Оновити журнал".</div>';
      })
      .withFailureHandler(function(err) {
        container.innerHTML = '<div class="info-status-block message-danger">Не вдалося відкрити форму: ' + escapeHtml(err && err.message ? err.message : String(err)) + '</div>';
      })
      .openCreateProjectModal(tenantId);
    return;
  }

  if (id === 'config-journal') {
    el.classList.add('status-loading');
    container.innerHTML = '<div class="info-status-block"><div class="spinner"></div><span>Завантаження конфігурації полів...</span></div>';

    google.script.run
      .withSuccessHandler(function(fields) {
        el.classList.remove('status-loading');
        renderFieldDefinitions(container, fields, tenantId);
      })
      .withFailureHandler(function(err) {
        el.classList.remove('status-loading');
        container.innerHTML = '<div class="info-status-block message-danger">Помилка завантаження field_definitions: ' + escapeHtml(err && err.message ? err.message : String(err)) + '</div>';
      })
      .getFieldDefinitions(tenantId);
    return;
  }

  container.innerHTML = '<div class="info-status-block">Модуль: ' + escapeHtml(id) + '</div>';
}

function runTestPing() {
  const container = document.getElementById('content-container');
  container.innerHTML = '<div class="info-status-block"><div class="spinner"></div><span>Відправка тестового сигналу...</span></div>';

  google.script.run
    .withSuccessHandler(function(res) {
      container.innerHTML = '<div class="info-status-block">Результат: ' + escapeHtml(res) + '</div>';
    })
    .withFailureHandler(function(err) {
      container.innerHTML = '<div class="info-status-block message-danger">Помилка: ' + escapeHtml(err && err.message ? err.message : String(err)) + '</div>';
    })
    .testSystemPing();
}

function updateUIStatus(isOnline) {
  const statusText = document.getElementById('status-text');
  const statusBar = document.getElementById('connection-status');
  if (!statusText || !statusBar) return;

  statusText.innerText = isOnline ? i18n.status_online : i18n.status_offline;
  statusBar.classList.toggle('status-online', isOnline);
  statusBar.classList.toggle('status-offline', !isOnline);
}

function renderFieldDefinitions(container, fields, tenantId) {
  if (!Array.isArray(fields)) {
    container.innerHTML = '<div class="info-status-block message-danger">Невірний формат даних field_definitions</div>';
    return;
  }

  if (fields.length === 0) {
    container.innerHTML = '<div class="info-status-block">Поля для цього tenant ще не налаштовані.</div>';
    return;
  }

  const rows = fields.map(function(field) {
    const state = field.is_active ? 'Активне' : 'Вимкнене';
    const stateColor = field.is_active ? '#7be1a8' : '#ff9caa';
    const buttonLabel = field.is_active ? 'Вимкнути' : 'Увімкнути';
    const nextState = !field.is_active;

    return [
      '<tr>',
      '<td><code>' + escapeHtml(field.field_key || '-') + '</code></td>',
      '<td>' + escapeHtml(field.field_label || '-') + '</td>',
      '<td>' + escapeHtml(field.field_type || 'checkbox') + '</td>',
      '<td><span style="color:' + stateColor + ';font-weight:700;">' + state + '</span></td>',
      '<td><button class="table-action" onclick="toggleFieldState(\'' + escapeHtml(field.id) + '\', ' + nextState + ', \'' + escapeHtml(tenantId) + '\')">' + buttonLabel + '</button></td>',
      '</tr>'
    ].join('');
  }).join('');

  container.innerHTML = [
    '<div class="info-status-block">Налаштування полів журналу (' + fields.length + ')</div>',
    '<div class="content-table-wrap">',
    '<table class="content-table">',
    '<thead><tr><th>Ключ</th><th>Назва</th><th>Тип</th><th>Статус</th><th>Дія</th></tr></thead>',
    '<tbody>' + rows + '</tbody>',
    '</table>',
    '</div>'
  ].join('');
}

function toggleFieldState(fieldId, nextState, tenantId) {
  const container = document.getElementById('content-container');
  container.innerHTML = '<div class="info-status-block"><div class="spinner"></div><span>Оновлення поля...</span></div>';

  google.script.run
    .withSuccessHandler(function() {
      google.script.run
        .withSuccessHandler(function(fields) {
          renderFieldDefinitions(container, fields, tenantId);
        })
        .withFailureHandler(function(err) {
          container.innerHTML = '<div class="info-status-block message-danger">Помилка повторного завантаження: ' + escapeHtml(err && err.message ? err.message : String(err)) + '</div>';
        })
        .getFieldDefinitions(tenantId);
    })
    .withFailureHandler(function(err) {
      container.innerHTML = '<div class="info-status-block message-danger">Не вдалося оновити поле: ' + escapeHtml(err && err.message ? err.message : String(err)) + '</div>';
    })
    .updateFieldDefinitionStatus(fieldId, nextState, tenantId);
}

function applyDynamicMenuAccess(userData) {
  const role = (userData.role || '').toUpperCase();
  const options = normalizeOptions(userData.options);
  const enabledModules = normalizeEnabledModules(options);
  const hasAdminLevelRole = ['ADMIN', 'DIRECTOR', 'DISPATCHER'].includes(role);

  const payRow = document.getElementById('pay-row');
  if (payRow) {
    payRow.style.display = hasAdminLevelRole ? 'flex' : 'none';
    if (hasAdminLevelRole) {
      setText('display-pay', userData.daysLeftStr || '20 днів');
    }
  }

  document.querySelectorAll('[data-roles]').forEach(function(node) {
    const allowedRoles = (node.getAttribute('data-roles') || '')
      .split(',')
      .map(function(x) { return x.trim().toUpperCase(); })
      .filter(Boolean);

    if (allowedRoles.length !== 0 && !allowedRoles.includes(role)) {
      node.style.display = 'none';
    }
  });

  document.querySelectorAll('[data-module]').forEach(function(node) {
    const moduleKey = (node.getAttribute('data-module') || '').trim().toLowerCase();
    const isCore = !moduleKey || moduleKey === 'core';
    const isEnabled = isCore || enabledModules.has(moduleKey) || hasAdminLevelRole;
    if (!isEnabled) {
      node.style.display = 'none';
    }
  });
}

function normalizeOptions(rawOptions) {
  if (!rawOptions) return {};
  if (typeof rawOptions === 'object') return rawOptions;
  if (typeof rawOptions !== 'string') return {};

  try {
    return JSON.parse(rawOptions);
  } catch (e) {
    return {};
  }
}

function normalizeEnabledModules(options) {
  const raw = options.enabled_modules || options.modules || [];
  const arr = Array.isArray(raw) ? raw : [];
  return new Set(arr.map(function(x) { return String(x).toLowerCase(); }));
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
        node.innerHTML = 'Оновлення: ' + escapeHtml(notice.message) + ' • ' + new Date(notice.ts).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
      })
      .getSidebarNotice();
  }, 2500);

  setInterval(function() {
    google.script.run
      .withSuccessHandler(function(activeMenuId) {
        syncModalMenuState(activeMenuId || '');
      })
      .getActiveModalMenu();
  }, 1200);
}

function syncModalMenuState(activeMenuId) {
  const modalLinks = document.querySelectorAll('.submenu-item[data-modal="1"]');
  modalLinks.forEach(function(link) {
    link.classList.remove('status-loading');
    if (link.getAttribute('data-action') === activeMenuId) {
      link.classList.add('active', 'status-loading');
    } else {
      link.classList.remove('active');
    }
  });
}