/**
 * Benjamin Reuland - Site Principal
 * Gestion: Navigation, Recherche, i18n, CTAs, Progressive Enhancement
 */

class BenjaminReulandSite {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.searchIndex = null;
    this.searchPanel = null;
    this.consentGiven = localStorage.getItem('consent') === 'accepted';

    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupLanguageSwitcher();
    this.setupSearch();
    this.setupProjectFilters();
    this.setupCTATracking();
    this.setupConsentBanner();
    this.setupForms();
    this.setupFAQ();
    this.setupHeroCanvas();
    this.setupSkipLinks();

    // Events GA4 si consentement donné
    if (this.consentGiven && window.gtag) {
      this.trackPageView();
    }
  }

  // === DÉTECTION LANGUE === //
  detectLanguage() {
    const path = window.location.pathname;
    if (path.startsWith('/fr/')) return 'fr';
    if (path.startsWith('/en/')) return 'en';
    if (path.startsWith('/nl/')) return 'nl';
    if (path.startsWith('/de/')) return 'de';
    if (path.startsWith('/sv/')) return 'sv';
    return 'fr'; // default
  }

  // === NAVIGATION === //
  setupNavigation() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
      lastScrollY = window.scrollY;
    };

    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 10);
    }, { passive: true });

    // Active navigation link
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath || 
          (currentPath.includes(link.getAttribute('href')) && link.getAttribute('href') !== '/')) {
        link.classList.add('active');
      }
    });
  }

  // === CHANGEMENT DE LANGUE === //
  setupLanguageSwitcher() {
    const langButtons = document.querySelectorAll('[data-lang]');

    langButtons.forEach(btn => {
      if (btn.dataset.lang === this.currentLang) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchLanguage(btn.dataset.lang);
      });
    });
  }

  switchLanguage(newLang) {
    if (newLang === this.currentLang) return;

    // Event GA4
    if (this.consentGiven && window.gtag) {
      gtag('event', 'lang_switch', {
        event_category: 'i18n',
        previous_language: this.currentLang,
        new_language: newLang
      });
    }

    // Mapping des pages entre langues
    const pathMappings = {
      'fr': {
        'a-propos': { en: 'about', nl: 'over', de: 'ueber', sv: 'om' },
        'etudes': { en: 'studies', nl: 'studies', de: 'studium', sv: 'studier' },
        'projets': { en: 'projects', nl: 'projecten', de: 'projekte', sv: 'projekt' },
        'mes-engagements': { en: 'commitments', nl: 'engagementen', de: 'engagements', sv: 'engagemang' },
        'services': { en: 'services', nl: 'diensten', de: 'dienstleistungen', sv: 'tjanster' },
        'contact': { en: 'contact', nl: 'contact', de: 'kontakt', sv: 'kontakt' },
        'cv': { en: 'cv', nl: 'cv', de: 'cv', sv: 'cv' }
      }
    };

    let currentPath = window.location.pathname.replace(`/${this.currentLang}/`, '').replace('/', '');
    let newPath = '/';

    if (currentPath) {
      if (pathMappings.fr[currentPath] && pathMappings.fr[currentPath][newLang]) {
        newPath = `/${newLang}/${pathMappings.fr[currentPath][newLang]}`;
      } else {
        newPath = `/${newLang}/`;
      }
    } else {
      newPath = `/${newLang}/`;
    }

    window.location.href = newPath;
  }

  // === RECHERCHE LUNR === //
  setupSearch() {
    const searchBtn = document.querySelector('[data-search-btn]');
    const searchPanel = document.querySelector('[data-search-panel]');
    const searchInput = document.querySelector('[data-search-input]');
    const searchClose = document.querySelector('[data-search-close]');

    if (!searchBtn || !searchPanel) return;

    this.searchPanel = searchPanel;

    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.openSearch();
    });

    if (searchClose) {
      searchClose.addEventListener('click', () => this.closeSearch());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchPanel.classList.contains('active')) {
        this.closeSearch();
      }
    });

    searchPanel.addEventListener('click', (e) => {
      if (e.target === searchPanel) {
        this.closeSearch();
      }
    });

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.performSearch(e.target.value);
        }, 300);
      });
    }
  }

  async openSearch() {
    if (!this.searchPanel) return;

    this.searchPanel.classList.add('active');
    document.body.style.overflow = 'hidden';

    const input = this.searchPanel.querySelector('[data-search-input]');
    if (input) {
      setTimeout(() => input.focus(), 100);
    }

    if (!this.searchIndex) {
      await this.loadSearchIndex();
    }
  }

  closeSearch() {
    if (!this.searchPanel) return;

    this.searchPanel.classList.remove('active');
    document.body.style.overflow = '';

    const results = document.querySelector('[data-search-results]');
    if (results) {
      results.innerHTML = '';
    }
  }

  async loadSearchIndex() {
    try {
      const response = await fetch(`/search/index.${this.currentLang}.json`);
      if (!response.ok) throw new Error('Index not found');

      const indexData = await response.json();

      if (window.lunr) {
        this.searchIndex = lunr(function() {
          this.field('title', { boost: 10 });
          this.field('content', { boost: 1 });
          this.field('excerpt', { boost: 5 });
          this.ref('url');

          indexData.documents.forEach((doc) => {
            this.add(doc);
          });
        });

        this.searchDocuments = indexData.documents;
      }
    } catch (error) {
      console.warn('Recherche indisponible:', error);
    }
  }

  performSearch(query) {
    const resultsContainer = document.querySelector('[data-search-results]');
    if (!resultsContainer || !query.trim()) {
      if (resultsContainer) resultsContainer.innerHTML = '';
      return;
    }

    if (!this.searchIndex) {
      resultsContainer.innerHTML = '<p>Recherche en cours de chargement...</p>';
      return;
    }

    if (this.consentGiven && window.gtag) {
      gtag('event', 'search_query', {
        event_category: 'search',
        search_term: query.substring(0, 50),
        language: this.currentLang
      });
    }

    try {
      const results = this.searchIndex.search(query);
      const maxResults = 8;

      if (results.length === 0) {
        const messages = {
          fr: 'Aucun résultat trouvé',
          en: 'No results found',
          nl: 'Geen resultaten gevonden',
          de: 'Keine Ergebnisse gefunden',
          sv: 'Inga resultat hittades'
        };
        resultsContainer.innerHTML = `<p class="search-no-results">${messages[this.currentLang] || messages.fr}</p>`;
        return;
      }

      const resultsHTML = results.slice(0, maxResults).map(result => {
        const doc = this.searchDocuments.find(d => d.url === result.ref);
        if (!doc) return '';

        return `
          <a href="${doc.url}" class="search-result">
            <div class="search-result-title">${doc.title}</div>
            <div class="search-result-excerpt">${doc.excerpt || ''}</div>
          </a>
        `;
      }).join('');

      resultsContainer.innerHTML = resultsHTML;

    } catch (error) {
      console.warn('Erreur de recherche:', error);
      resultsContainer.innerHTML = '<p>Erreur lors de la recherche</p>';
    }
  }

  // === FILTRES PROJETS === //
  setupProjectFilters() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    const projectCards = document.querySelectorAll('[data-project]');

    if (filterButtons.length === 0) return;

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        projectCards.forEach(card => {
          const categories = card.dataset.project.split(' ');
          const shouldShow = filter === 'tous' || filter === 'all' || categories.includes(filter);

          if (shouldShow) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease-out';
          } else {
            card.style.display = 'none';
          }
        });

        if (this.consentGiven && window.gtag) {
          gtag('event', 'project_filter', {
            event_category: 'projects',
            filter_value: filter
          });
        }
      });
    });
  }

  // === TRACKING CTA === //
  setupCTATracking() {
    const ctaButtons = document.querySelectorAll('[data-cta]');

    ctaButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.consentGiven && window.gtag) {
          gtag('event', 'cta_click', {
            event_category: 'engagement',
            cta_location: btn.dataset.cta,
            page_location: window.location.pathname
          });
        }
      });
    });

    // CV Download tracking
    const cvLinks = document.querySelectorAll('a[href*=".pdf"]');
    cvLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (this.consentGiven && window.gtag) {
          gtag('event', 'cv_download', {
            event_category: 'conversion',
            file_name: link.href.split('/').pop(),
            language: this.currentLang
          });
        }
      });
    });

    // Project view tracking
    const projectLinks = document.querySelectorAll('a[href*="/projets/"], a[href*="/projects/"], a[href*="/projecten/"], a[href*="/projekte/"], a[href*="/projekt/"]');
    projectLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (this.consentGiven && window.gtag) {
          gtag('event', 'project_open', {
            event_category: 'engagement',
            project_url: link.href,
            source_page: window.location.pathname
          });
        }
      });
    });
  }

  // === CONSENTEMENT === //
  setupConsentBanner() {
    const banner = document.querySelector('[data-consent-banner]');
    const acceptBtn = document.querySelector('[data-consent-accept]');
    const declineBtn = document.querySelector('[data-consent-decline]');

    if (!banner) return;

    if (!localStorage.getItem('consent')) {
      setTimeout(() => banner.classList.add('show'), 1000);
    }

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        this.setConsent(true);
        banner.classList.remove('show');
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', () => {
        this.setConsent(false);
        banner.classList.remove('show');
      });
    }
  }

  setConsent(accepted) {
    localStorage.setItem('consent', accepted ? 'accepted' : 'declined');
    this.consentGiven = accepted;

    if (accepted) {
      this.loadGA4();
    }

    if (accepted && window.gtag) {
      gtag('event', 'consent_update', {
        event_category: 'consent',
        consent_status: 'granted'
      });
    }
  }

  loadGA4() {
    if (!window.gtag && window.GA4_MEASUREMENT_ID) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${window.GA4_MEASUREMENT_ID}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;

      gtag('js', new Date());
      gtag('config', window.GA4_MEASUREMENT_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });

      if (typeof loadGA4Events === 'function') {
        loadGA4Events();
      }
    }
  }

  // === FORMULAIRES === //
  setupForms() {
    const forms = document.querySelectorAll('form[data-form]');

    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(form);
      });
    });
  }

  async handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validation côté client
    const errors = this.validateForm(data);
    if (errors.length > 0) {
      this.showFormErrors(form, errors);
      return;
    }

    // Ajouter la langue
    data.language = this.currentLang;

    // Bouton de soumission
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = this.getTranslation('sending');

      const response = await fetch('/api/form.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.ok) {
        this.showFormSuccess(form, this.getTranslation('form_success'));
        form.reset();

        // Track conversion
        if (this.consentGiven && window.gtag) {
          gtag('event', 'form_submit_success', {
            event_category: 'conversion',
            form_name: form.dataset.form || 'contact'
          });
        }
      } else {
        this.showFormError(form, result.error || this.getTranslation('form_error'));

        if (this.consentGiven && window.gtag) {
          gtag('event', 'form_submit_error', {
            event_category: 'form',
            error_message: result.error || 'Unknown error'
          });
        }
      }

    } catch (error) {
      this.showFormError(form, this.getTranslation('form_error'));
      console.error('Form error:', error);

    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  validateForm(data) {
    const errors = [];

    if (!data.name || data.name.length < 2) {
      errors.push(this.getTranslation('error_name'));
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push(this.getTranslation('error_email'));
    }

    if (!data.message || data.message.length < 100) {
      errors.push(this.getTranslation('error_message'));
    }

    return errors;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showFormSuccess(form, message) {
    this.clearFormMessages(form);

    const messageDiv = document.createElement('div');
    messageDiv.className = 'form-message success';
    messageDiv.textContent = message;

    form.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }

  showFormError(form, message) {
    this.clearFormMessages(form);

    const messageDiv = document.createElement('div');
    messageDiv.className = 'form-message error';
    messageDiv.textContent = message;

    form.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  showFormErrors(form, errors) {
    this.clearFormMessages(form);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-message error';
    errorDiv.innerHTML = '<ul>' + errors.map(error => `<li>${error}</li>`).join('') + '</ul>';

    form.appendChild(errorDiv);
  }

  clearFormMessages(form) {
    const existingMessages = form.querySelectorAll('.form-message');
    existingMessages.forEach(msg => msg.remove());
  }

  // === FAQ === //
  setupFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isActive = answer.classList.contains('active');

        // Fermer toutes les autres FAQ
        document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.faq-question').forEach(q => q.setAttribute('aria-expanded', 'false'));

        // Ouvrir/fermer la FAQ actuelle
        if (!isActive) {
          answer.classList.add('active');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // === HERO CANVAS === //
  setupHeroCanvas() {
    const canvas = document.querySelector('[data-hero-canvas]');
    if (!canvas) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (window.innerWidth < 768 || navigator.hardwareConcurrency < 4) {
      return;
    }

    this.initHeroAnimation(canvas);
  }

  initHeroAnimation(canvas) {
    const ctx = canvas.getContext('2d');
    const points = [];
    const numPoints = Math.min(50, Math.floor(window.innerWidth / 30));

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    let animationId;
    let lastTime = 0;

    const animate = (currentTime) => {
      if (currentTime - lastTime >= 16) {
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

        points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240, 239, 233, ${point.alpha})`;
          ctx.fill();

          point.x += point.dx;
          point.y += point.dy;

          if (point.x < 0 || point.x > canvas.offsetWidth) point.dx *= -1;
          if (point.y < 0 || point.y > canvas.offsetHeight) point.dy *= -1;

          point.alpha += (Math.random() - 0.5) * 0.01;
          point.alpha = Math.max(0.1, Math.min(0.6, point.alpha));
        });

        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(animate);
    };

    animate(0);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!animationId) animate(0);
          } else {
            if (animationId) {
              cancelAnimationFrame(animationId);
              animationId = null;
            }
          }
        });
      });

      observer.observe(canvas);
    }
  }

  // === ACCESSIBILITÉ === //
  setupSkipLinks() {
    const skipLinks = document.querySelectorAll('.skip-link');

    skipLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // === TRADUCTIONS === //
  getTranslation(key) {
    const translations = {
      fr: {
        sending: 'Envoi...',
        form_success: 'Message bien reçu ! Je vous répondrai rapidement.',
        form_error: 'Erreur lors de l\'envoi. Veuillez réessayer.',
        error_name: 'Le nom est requis (minimum 2 caractères)',
        error_email: 'Adresse email valide requise',
        error_message: 'Le message doit contenir au moins 100 caractères'
      },
      en: {
        sending: 'Sending...',
        form_success: 'Message received! I will reply quickly.',
        form_error: 'Error sending message. Please try again.',
        error_name: 'Name is required (minimum 2 characters)',
        error_email: 'Valid email address required',
        error_message: 'Message must contain at least 100 characters'
      },
      nl: {
        sending: 'Verzenden...',
        form_success: 'Bericht ontvangen! Ik zal snel antwoorden.',
        form_error: 'Fout bij verzenden. Probeer opnieuw.',
        error_name: 'Naam is vereist (minimaal 2 tekens)',
        error_email: 'Geldig e-mailadres vereist',
        error_message: 'Bericht moet minimaal 100 tekens bevatten'
      },
      de: {
        sending: 'Senden...',
        form_success: 'Nachricht erhalten! Ich antworte schnell.',
        form_error: 'Fehler beim Senden. Bitte versuchen Sie es erneut.',
        error_name: 'Name ist erforderlich (mindestens 2 Zeichen)',
        error_email: 'Gültige E-Mail-Adresse erforderlich',
        error_message: 'Nachricht muss mindestens 100 Zeichen enthalten'
      },
      sv: {
        sending: 'Skickar...',
        form_success: 'Meddelande mottaget! Jag svarar snabbt.',
        form_error: 'Fel vid skickande. Försök igen.',
        error_name: 'Namn krävs (minst 2 tecken)',
        error_email: 'Giltig e-postadress krävs',
        error_message: 'Meddelandet måste innehålla minst 100 tecken'
      }
    };

    return translations[this.currentLang]?.[key] || translations.fr[key] || key;
  }

  trackPageView() {
    if (window.gtag) {
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        language: this.currentLang
      });
    }
  }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  window.brSite = new BenjaminReulandSite();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BenjaminReulandSite;
}
