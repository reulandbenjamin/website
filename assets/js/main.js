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
    this.setupHeroCanvas();

    // Events GA4 si consentement donné
    if (this.consentGiven && window.gtag) {
      this.trackPageView();
    }
  }

  detectLanguage() {
    const path = window.location.pathname;
    if (path.startsWith('/fr/')) return 'fr';
    if (path.startsWith('/en/')) return 'en';
    if (path.startsWith('/nl/')) return 'nl';
    if (path.startsWith('/de/')) return 'de';
    if (path.startsWith('/sv/')) return 'sv';
    return 'fr';
  }

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
  }

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

    if (this.consentGiven && window.gtag) {
      gtag('event', 'lang_switch', {
        event_category: 'i18n',
        previous_language: this.currentLang,
        new_language: newLang
      });
    }

    let currentPath = window.location.pathname.replace(`/${this.currentLang}/`, '').replace('/', '');
    let newPath = `/${newLang}/`;

    if (currentPath) {
      newPath = `/${newLang}/${currentPath}`;
    }

    window.location.href = newPath;
  }

  setupSearch() {
    const searchBtn = document.querySelector('[data-search-btn]');
    const searchPanel = document.querySelector('[data-search-panel]');
    const searchInput = document.querySelector('[data-search-input]');

    if (!searchBtn || !searchPanel) return;

    this.searchPanel = searchPanel;

    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.openSearch();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchPanel.classList.contains('active')) {
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
        search_term: query,
        language: this.currentLang
      });
    }

    try {
      const results = this.searchIndex.search(query);

      if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="search-no-results">Aucun résultat trouvé</p>';
        return;
      }

      const resultsHTML = results.slice(0, 8).map(result => {
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
          const shouldShow = filter === 'tous' || categories.includes(filter);

          card.style.display = shouldShow ? 'block' : 'none';
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
  }

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
    const numPoints = 50;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
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
    const animate = () => {
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

      animationId = requestAnimationFrame(animate);
    };

    animate();

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!animationId) animate();
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

document.addEventListener('DOMContentLoaded', () => {
  window.brSite = new BenjaminReulandSite();
});
