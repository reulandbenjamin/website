/**
 * GA4 Events & Web Vitals - Benjamin Reuland
 * Chargé uniquement après consentement utilisateur
 */

window.GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // À configurer

function loadGA4Events() {
  if (!window.gtag) {
    console.warn('GA4 non disponible');
    return;
  }

  console.log('🔍 GA4 Events & Web Vitals chargés');

  setupWebVitals();
  setupFormEvents();
  setupScrollTracking();
  setupOutboundLinks();
}

function setupWebVitals() {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
  script.onload = () => {
    if (window.webVitals) {
      webVitals.onLCP((metric) => {
        gtag('event', 'web_vitals', {
          event_category: 'performance',
          metric_name: 'LCP',
          metric_value: Math.round(metric.value),
          metric_id: metric.id
        });
      });

      webVitals.onINP((metric) => {
        gtag('event', 'web_vitals', {
          event_category: 'performance',
          metric_name: 'INP',
          metric_value: Math.round(metric.value),
          metric_id: metric.id
        });
      });

      webVitals.onCLS((metric) => {
        gtag('event', 'web_vitals', {
          event_category: 'performance',
          metric_name: 'CLS',
          metric_value: Math.round(metric.value * 1000) / 1000,
          metric_id: metric.id
        });
      });
    }
  };
  document.head.appendChild(script);
}

function setupFormEvents() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const formName = form.dataset.form || 'contact';

      gtag('event', 'form_submit_attempt', {
        event_category: 'form',
        form_name: formName
      });
    });
  });
}

function setupScrollTracking() {
  let scrollPercent = 0;
  let scrollMarks = [25, 50, 75, 90];
  let trackedMarks = new Set();

  const trackScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (scrollHeight > 0) {
      scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

      scrollMarks.forEach(mark => {
        if (scrollPercent >= mark && !trackedMarks.has(mark)) {
          trackedMarks.add(mark);
          gtag('event', 'scroll_depth', {
            event_category: 'engagement',
            scroll_percent: mark
          });
        }
      });
    }
  };

  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        trackScroll();
        scrollTimeout = null;
      }, 500);
    }
  }, { passive: true });
}

function setupOutboundLinks() {
  const outboundLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');

  outboundLinks.forEach(link => {
    link.addEventListener('click', () => {
      gtag('event', 'outbound_click', {
        event_category: 'outbound',
        link_domain: new URL(link.href).hostname,
        link_url: link.href
      });
    });
  });

  const socialLinks = document.querySelectorAll('a[href*="linkedin"], a[href*="instagram"], a[href*="facebook"]');
  socialLinks.forEach(link => {
    link.addEventListener('click', () => {
      let platform = 'unknown';
      if (link.href.includes('linkedin')) platform = 'linkedin';
      else if (link.href.includes('instagram')) platform = 'instagram';
      else if (link.href.includes('facebook')) platform = 'facebook';

      gtag('event', 'social_click', {
        event_category: 'social',
        social_platform: platform
      });
    });
  });
}

window.trackCustomEvent = function(eventName, parameters = {}) {
  if (window.gtag) {
    gtag('event', eventName, {
      event_category: 'custom',
      ...parameters,
      timestamp: Date.now()
    });
  }
};

window.addEventListener('error', (event) => {
  if (window.gtag) {
    gtag('event', 'javascript_error', {
      event_category: 'error',
      error_message: event.message,
      error_filename: event.filename,
      error_lineno: event.lineno
    });
  }
});

console.log('📊 GA4 Events module chargé');
