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
