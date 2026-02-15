/* ========================================
   دوا پہچان - Dawa Pahchan
   Frontend Application Logic
   ======================================== */

(function () {
  'use strict';

  // ========================================
  // Constants
  // ========================================
  const PROFILE_KEY = 'dawa_pahchan_profile';
  const API_URL = '/api/analyze';

  // ========================================
  // Profile Management
  // ========================================

  function getProfile() {
    try {
      const data = localStorage.getItem(PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function saveProfileToStorage() {
    const age = document.getElementById('inp-age').value.trim();
    const weight = document.getElementById('inp-weight').value.trim();
    const allergies = document.getElementById('inp-allergies').value.trim();

    const genderBtn = document.querySelector('[data-field="gender"].selected');
    const pregnantBtn = document.querySelector('[data-field="pregnant"].selected');

    const gender = genderBtn ? genderBtn.dataset.value : '';
    const pregnant = pregnantBtn ? pregnantBtn.dataset.value === 'true' : false;

    // Validation
    if (!age) {
      showToast('براہ کرم اپنی عمر بتائیں');
      document.getElementById('inp-age').focus();
      return false;
    }

    if (!gender) {
      showToast('براہ کرم جنس منتخب کریں');
      return false;
    }

    const profile = {
      age: parseInt(age, 10),
      gender: gender,
      weight: parseFloat(weight) || 0,
      pregnant: pregnant,
      allergies: allergies
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  }

  function loadProfileIntoForm() {
    const profile = getProfile();
    if (!profile) return;

    document.getElementById('inp-age').value = profile.age || '';
    document.getElementById('inp-weight').value = profile.weight || '';
    document.getElementById('inp-allergies').value = profile.allergies || '';

    // Gender buttons
    if (profile.gender) {
      document.querySelectorAll('[data-field="gender"]').forEach(function (btn) {
        btn.classList.toggle('selected', btn.dataset.value === profile.gender);
      });
      if (profile.gender === 'female') {
        document.getElementById('grp-pregnancy').classList.remove('hidden');
      }
    }

    // Pregnancy buttons
    if (profile.gender === 'female') {
      document.querySelectorAll('[data-field="pregnant"]').forEach(function (btn) {
        btn.classList.toggle('selected', btn.dataset.value === String(profile.pregnant));
      });
    }
  }

  // ========================================
  // Screen Navigation
  // ========================================

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.add('hidden');
    });
    var screen = document.getElementById('screen-' + id);
    if (screen) {
      screen.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  // ========================================
  // Toast Notifications
  // ========================================

  function showToast(message, duration) {
    duration = duration || 3000;

    // Remove existing
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add('show');
      });
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, duration);
  }

  // ========================================
  // Image Analysis
  // ========================================

  function analyzeImage(file) {
    var profile = getProfile() || {};

    var formData = new FormData();
    formData.append('image', file);
    formData.append('age', profile.age || 0);
    formData.append('gender', profile.gender || '');
    formData.append('weight', profile.weight || 0);
    formData.append('pregnant', profile.pregnant ? 'true' : 'false');
    formData.append('allergies', profile.allergies || '');

    return fetch(API_URL, {
      method: 'POST',
      body: formData
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }
      return response.json();
    });
  }

  // ========================================
  // Status Helpers
  // ========================================

  function getStatusClass(status) {
    switch (status) {
      case 'authentic':
      case 'safe':
        return 'status-safe';
      case 'suspicious':
      case 'warning':
        return 'status-warning';
      case 'counterfeit':
      case 'danger':
        return 'status-danger';
      default:
        return 'status-warning';
    }
  }

  // ========================================
  // Results Rendering
  // ========================================

  function renderResults(data) {
    var errorContainer = document.getElementById('error-container');
    var resultsContent = document.getElementById('results-content');

    // Handle not_medicine or error
    if (data.not_medicine || data.error_message_urdu) {
      errorContainer.classList.remove('hidden');
      resultsContent.classList.add('hidden');
      document.getElementById('error-message').textContent =
        '⚠️ ' + (data.error_message_urdu || 'تصویر سے دوا کی شناخت نہیں ہو سکی');
      return;
    }

    // Show results, hide error
    errorContainer.classList.add('hidden');
    resultsContent.classList.remove('hidden');

    // Medicine name
    var nameEl = document.getElementById('medicine-name');
    nameEl.textContent = data.medicine_name || 'نامعلوم دوا';

    // Explanation
    document.getElementById('explanation-text').textContent =
      data.explanation_urdu || 'معلومات دستیاب نہیں ہیں۔';

    // --- Authenticity Card ---
    var authCard = document.getElementById('card-authenticity');
    var authStatus = (data.authenticity && data.authenticity.status) || 'suspicious';
    authCard.className = 'card status-card ' + getStatusClass(authStatus);

    document.getElementById('auth-label').textContent =
      (data.authenticity && data.authenticity.label_urdu) || '';

    var authReasons = document.getElementById('auth-reasons');
    authReasons.innerHTML = '';
    var reasons = (data.authenticity && data.authenticity.reasons_urdu) || [];
    reasons.forEach(function (reason) {
      var li = document.createElement('li');
      li.textContent = reason;
      authReasons.appendChild(li);
    });

    document.getElementById('auth-details').textContent =
      (data.authenticity && data.authenticity.details) || '';

    // --- Safety Card ---
    var safetyCard = document.getElementById('card-safety');
    var safetyStatus = (data.safety && data.safety.status) || 'warning';
    safetyCard.className = 'card status-card ' + getStatusClass(safetyStatus);

    document.getElementById('safety-label').textContent =
      (data.safety && data.safety.label_urdu) || '';

    var safetyWarnings = document.getElementById('safety-warnings');
    safetyWarnings.innerHTML = '';
    var warnings = (data.safety && data.safety.warnings_urdu) || [];
    warnings.forEach(function (warning) {
      var li = document.createElement('li');
      li.textContent = warning;
      safetyWarnings.appendChild(li);
    });

    document.getElementById('safety-details').textContent =
      (data.safety && data.safety.details) || '';

    // --- Dosage Card ---
    document.getElementById('dosage-text').textContent =
      (data.dosage && data.dosage.recommendation_urdu) || 'ڈاکٹر سے مشورہ کریں۔';

    // Reset any expanded details
    document.querySelectorAll('.details-section').forEach(function (section) {
      section.classList.remove('expanded');
      var btn = section.querySelector('.details-btn');
      if (btn) btn.textContent = 'تفصیلات ▼';
    });
  }

  // ========================================
  // Details Toggle (global for onclick)
  // ========================================

  window.toggleDetails = function (btn) {
    var section = btn.closest('.details-section');
    if (!section) return;
    section.classList.toggle('expanded');
    btn.textContent = section.classList.contains('expanded')
      ? 'تفصیلات ▲'
      : 'تفصیلات ▼';
  };

  // ========================================
  // Camera / Image Handling
  // ========================================

  function triggerCamera() {
    var input = document.getElementById('camera-input');
    // Reset to allow selecting the same file again
    input.value = '';
    input.click();
  }

  function handleImageSelected(file) {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('براہ کرم صرف تصویر منتخب کریں');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      showToast('تصویر بہت بڑی ہے۔ چھوٹی تصویر لیں۔');
      return;
    }

    // Set preview image
    var previewImg = document.getElementById('preview-img');
    var objectUrl = URL.createObjectURL(file);
    previewImg.src = objectUrl;
    previewImg.onload = function () {
      URL.revokeObjectURL(objectUrl);
    };

    // Show loading screen
    showScreen('loading');

    // Analyze
    analyzeImage(file)
      .then(function (data) {
        renderResults(data);
        showScreen('results');
      })
      .catch(function (error) {
        console.error('Analysis error:', error);

        // Check if offline
        if (!navigator.onLine) {
          showToast('انٹرنیٹ کنکشن نہیں ہے۔ بعد میں کوشش کریں۔', 4000);
        } else {
          showToast('تجزیہ میں مسئلہ ہوا۔ دوبارہ کوشش کریں۔', 4000);
        }

        showScreen('home');
      });
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // --- Select Buttons (Gender, Pregnancy) ---
    document.querySelectorAll('.select-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var field = btn.dataset.field;

        // Deselect siblings in the same field group
        document.querySelectorAll('[data-field="' + field + '"]').forEach(function (b) {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');

        // Show/hide pregnancy group based on gender
        if (field === 'gender') {
          var pregnancyGroup = document.getElementById('grp-pregnancy');
          if (btn.dataset.value === 'female') {
            pregnancyGroup.classList.remove('hidden');
          } else {
            pregnancyGroup.classList.add('hidden');
            // Reset pregnancy selection
            document.querySelectorAll('[data-field="pregnant"]').forEach(function (b) {
              b.classList.remove('selected');
            });
          }
        }
      });
    });

    // --- Save Profile ---
    document.getElementById('btn-save-profile').addEventListener('click', function () {
      if (saveProfileToStorage()) {
        showToast('✅ معلومات محفوظ ہو گئیں');
        showScreen('home');
      }
    });

    // --- Scan Button ---
    document.getElementById('btn-scan').addEventListener('click', function () {
      triggerCamera();
    });

    // --- Camera Input Change ---
    document.getElementById('camera-input').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      handleImageSelected(file);
    });

    // --- Settings Button ---
    document.getElementById('btn-settings').addEventListener('click', function () {
      loadProfileIntoForm();
      showScreen('profile');
    });

    // --- Back Button (Results → Home) ---
    document.getElementById('btn-back').addEventListener('click', function () {
      showScreen('home');
    });

    // --- Scan Again Button ---
    document.getElementById('btn-scan-again').addEventListener('click', function () {
      triggerCamera();
    });

    // --- Keyboard: Enter on inputs ---
    document.querySelectorAll('.form-input').forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          // Move to next input or save
          var formInputs = Array.from(document.querySelectorAll('.form-input'));
          var idx = formInputs.indexOf(input);
          if (idx < formInputs.length - 1) {
            formInputs[idx + 1].focus();
          } else {
            document.getElementById('btn-save-profile').click();
          }
        }
      });
    });
  }

  // ========================================
  // PWA: Service Worker Registration
  // ========================================

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function (reg) {
          console.log('Service Worker registered, scope:', reg.scope);
        })
        .catch(function (err) {
          console.warn('Service Worker registration failed:', err);
        });
    }
  }

  // ========================================
  // PWA: Install Prompt
  // ========================================

  var deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstallPrompt = e;

    // Show a subtle install hint after first successful scan
    // (kept simple - no extra UI for now)
  });

  // ========================================
  // Offline Detection
  // ========================================

  window.addEventListener('online', function () {
    showToast('✅ انٹرنیٹ واپس آ گیا');
  });

  window.addEventListener('offline', function () {
    showToast('⚠️ انٹرنیٹ کنکشن نہیں ہے', 5000);
  });

  // ========================================
  // Initialization
  // ========================================

  function init() {
    var profile = getProfile();

    if (profile && profile.age && profile.gender) {
      showScreen('home');
    } else {
      showScreen('profile');
    }

    setupEventListeners();
    registerServiceWorker();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
