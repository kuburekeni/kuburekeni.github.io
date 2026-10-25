/**
 * EventHub prototype - client-side behaviour
 * Handles form validation feedback, status filters, comment posting (simulated),
 * and booking modal updates.
 */
document.addEventListener('DOMContentLoaded', function () {
  // ----- Create event form -----
  var submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      var form = document.getElementById('eventForm');
      if (!form) return;
      if (form.checkValidity()) {
        var alertEl = document.getElementById('successAlert');
        if (alertEl) {
          alertEl.classList.add('show');
          alertEl.classList.remove('fade');
        }
        form.reset();
        form.classList.remove('was-validated');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        form.classList.add('was-validated');
      }
    });
  }

  // ----- Status filter on home page -----
  var filterButtons = document.querySelectorAll('[data-filter]');
  var eventItems = document.querySelectorAll('.event-item');
  var noResults = document.getElementById('noResults');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterButtons.forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      var filter = btn.getAttribute('data-filter');
      var visible = 0;

      eventItems.forEach(function (item) {
        var status = item.getAttribute('data-status');
        var show = filter === 'all' || status === filter;
        item.style.display = show ? '' : 'none';
        if (show) visible++;
      });

      if (noResults) {
        noResults.classList.toggle('d-none', visible > 0);
      }
    });
  });

  // ----- Booking modal qty sync -----
  var ticketQty = document.getElementById('ticketQty');
  var modalQty = document.getElementById('modalQty');
  if (ticketQty && modalQty) {
    ticketQty.addEventListener('change', function () {
      modalQty.textContent = ticketQty.value;
    });
  }

  var confirmBookingBtn = document.getElementById('confirmBookingBtn');
  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener('click', function () {
      // Simple prototype feedback
      var toast = document.createElement('div');
      toast.className = 'alert alert-success position-fixed bottom-0 start-50 translate-middle-x mb-4 shadow';
      toast.style.zIndex = '1080';
      toast.setAttribute('role', 'alert');
      toast.innerHTML = '<strong>Booking simulated.</strong> In the full app this would create a booking record.';
      document.body.appendChild(toast);
      setTimeout(function () {
        toast.remove();
      }, 3500);
    });
  }

  // ----- Comment form (event details) -----
  var commentForm = document.getElementById('commentForm');
  if (commentForm) {
    commentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!commentForm.checkValidity()) {
        commentForm.classList.add('was-validated');
        return;
      }
      var text = document.getElementById('commentText').value.trim();
      var list = document.getElementById('commentList');
      if (list && text) {
        var card = document.createElement('div');
        card.className = 'comment-card p-3 mb-3 shadow-sm';
        card.innerHTML =
          '<div class="d-flex justify-content-between">' +
          '<strong>You</strong>' +
          '<small class="text-muted">Just now</small>' +
          '</div>' +
          '<p class="mb-0 mt-1"></p>';
        card.querySelector('p').textContent = text;
        list.insertBefore(card, list.firstChild);
        commentForm.reset();
        commentForm.classList.remove('was-validated');
      }
    });
  }

  // ----- Login / Register basic validation -----
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (loginForm.checkValidity()) {
        alert('Login simulated. You would be redirected to the home page with an active session.');
        window.location.href = 'index.html';
      } else {
        loginForm.classList.add('was-validated');
      }
    });
  }

  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = document.getElementById('password');
      var pw2 = document.getElementById('password2');
      if (pw && pw2 && pw.value !== pw2.value) {
        pw2.setCustomValidity('Passwords do not match');
      } else if (pw2) {
        pw2.setCustomValidity('');
      }
      if (registerForm.checkValidity()) {
        alert('Account created (prototype). You can now log in.');
        window.location.href = 'login.html';
      } else {
        registerForm.classList.add('was-validated');
      }
    });
  }
});
