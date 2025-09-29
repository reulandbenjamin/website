/**
 * GA4 Events & Web Vitals - Benjamin Reuland
 * Chargé uniquement après consentement utilisateur
 */

window.GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // À configurer dans .env

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
          metric_id: metric.id,
          page_location: window.location.href
        });
      });

      webVitals.onINP((metric) => {
        gtag('event', 'web_vitals', {
          event_category: 'performance',
          metric_name: 'INP',
          metric_value: Math.round(metric.value),
          metric_id: metric.id,
          page_location: window.location.href
        });
      });

      webVitals.onCLS((metric) => {
        gtag('event', 'web_vitals', {
          event_category: 'performance',
          metric_name: 'CLS',
          metric_value: Math.round(metric.value * 1000) / 1000,
          metric_id: metric.id,
          page_location: window.location.href
        });
      });

      webVitals.onFCP((metric) => {
        gtag('event', 'web_vitals', {
          event_category: 'performance',
          metric_name: 'FCP',
          metric_value: Math.round(metric.value),
          metric_id: metric.id,
          page_location: window.location.href
        });
      });

      webVitals.onTTFB((metric) => {
        gtag('event', 'web_vitals', {
          event_category: 'performance',
          metric_name: 'TTFB',
          metric_value: Math.round(metric.value),
          metric_id: metric.id,
          page_location: window.location.href
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
        form_name: formName,
        page_location: window.location.href
      });
    });

    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      let focusTime;

      input.addEventListener('focus', () => {
        focusTime = Date.now();
      });

      input.addEventListener('blur', () => {
        if (focusTime) {
          const timeSpent = Date.now() - focusTime;
          if (timeSpent > 2000) {
            gtag('event', 'form_field_engagement', {
              event_category: 'form',
              field_name: input.name || input.id,
              time_spent: Math.round(timeSpent / 1000),
              page_location: window.location.href
            });
          }
        }
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
            scroll_percent: mark,
            page_location: window.location.href
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
        link_url: link.href,
        page_location: window.location.href
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
        social_platform: platform,
        page_location: window.location.href
      });
    });
  });
}

window.trackCustomEvent = function(eventName, parameters = {}) {
  if (window.gtag) {
    gtag('event', eventName, {
      event_category: 'custom',
      ...parameters,
      page_location: window.location.href,
      timestamp: Date.now()
    });
  }
};

window.trackConversion = function(type, value = {}) {
  if (!window.gtag) return;

  const conversions = {
    'form_success': () => gtag('event', 'form_submit_success', {
      event_category: 'conversion',
      form_name: value.form || 'contact',
      page_location: window.location.href
    }),

    'cv_download': () => gtag('event', 'cv_download', {
      event_category: 'conversion',
      file_name: value.filename || 'cv.pdf',
      language: value.language || 'fr',
      page_location: window.location.href
    }),

    'contact_cta': () => gtag('event', 'cta_contact', {
      event_category: 'conversion',
      cta_location: value.location || 'unknown',
      page_location: window.location.href
    })
  };

  if (conversions[type]) {
    conversions[type]();
  }
};

window.addEventListener('load', () => {
  setTimeout(() => {
    if (window.performance && window.gtag) {
      const navigation = performance.getEntriesByType('navigation')[0];

      if (navigation) {
        gtag('event', 'page_timing', {
          event_category: 'performance',
          dom_content_loaded: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
          load_complete: Math.round(navigation.loadEventEnd - navigation.navigationStart),
          dns_time: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
          page_location: window.location.href
        });
      }
    }
  }, 1000);
});

window.addEventListener('error', (event) => {
  if (window.gtag) {
    gtag('event', 'javascript_error', {
      event_category: 'error',
      error_message: event.message,
      error_filename: event.filename,
      error_lineno: event.lineno,
      page_location: window.location.href
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (window.gtag) {
    gtag('event', 'promise_rejection', {
      event_category: 'error',
      error_reason: event.reason?.toString() || 'Unknown',
      page_location: window.location.href
    });
  }
});

console.log('📊 GA4 Events module chargé');
