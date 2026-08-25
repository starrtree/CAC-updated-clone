// Load CAC accent layers after the base/effects styles.
[
  'brand-accent.css',
  'latest-fixes.css',
  'final-adjustments.css',
  'site-polish-fixes.css',
  'interactive-sections.css'
].forEach((href) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
});

const isTouchLikeDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const viewportMeta = document.querySelector('meta[name="viewport"]');
if (isTouchLikeDevice && viewportMeta) {
  viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
}

if (isTouchLikeDevice) {
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) => {
    document.addEventListener(type, (event) => event.preventDefault(), { passive: false });
  });
}

const setupImageFallbacks = () => {
  const normalize = (src) => {
    if (!src) return '';
    try {
      return decodeURIComponent(src.trim());
    } catch {
      return src.trim();
    }
  };

  const filename = (src) => normalize(src).split('/').pop();

  document.querySelectorAll('img').forEach((image) => {
    const initial = normalize(image.getAttribute('src'));
    const fallback = normalize(image.dataset.fallback);
    const file = filename(initial || fallback);
    const candidates = [];

    const add = (value) => {
      const clean = normalize(value);
      if (clean && !candidates.includes(clean)) candidates.push(clean);
    };

    add(initial);
    if (image.dataset.fallbacks) image.dataset.fallbacks.split('|').forEach(add);
    add(fallback);

    if (file) {
      if (initial.startsWith('assets/clients/')) {
        add(file);
        add(`brand/${file}`);
      }
      if (initial.startsWith('assets/story/')) {
        add(file);
        add(`brand/${file}`);
      }
      if (initial.startsWith('assets/projects/')) add(file);
      if (initial.startsWith('brand/')) {
        add(file);
        add(`assets/brand/${file}`);
      }
    }

    let attempt = 0;

    const markMissing = () => {
      image.classList.add('is-missing');
      image.closest('.project-media')?.classList.add('is-missing');
    };

    const loadNext = () => {
      attempt += 1;
      if (attempt >= candidates.length) {
        markMissing();
        return;
      }
      image.classList.remove('is-missing');
      image.closest('.project-media')?.classList.remove('is-missing');
      image.removeAttribute('style');
      image.src = candidates[attempt];
    };

    image.addEventListener('error', loadNext);
    image.addEventListener('load', () => {
      if (image.naturalWidth > 0) {
        image.classList.remove('is-missing');
        image.closest('.project-media')?.classList.remove('is-missing');
      }
    });

    window.setTimeout(() => {
      if (image.complete && image.naturalWidth === 0) loadNext();
    }, 0);
  });
};

const highlightTitleWords = () => {
  const rules = [
    { selector: '.hero h1', words: [['Engineered', 'blue'], ['Built', 'red']] },
    { selector: '#capabilities h2', words: [['mechanical', 'blue'], ['Every', 'red']] },
    { selector: '.delivery-section h2', words: [['Design-Build', 'red'], ['Plan & Spec', 'blue']] },
    { selector: '#services h2', words: [['Commercial', 'red'], ['mechanical', 'blue']] },
    { selector: '#markets h2', words: [['Versatile', 'blue'], ['critical', 'red']] },
    { selector: '#projects h2', words: [['Projects', 'red'], ['region', 'blue']] },
    { selector: '.client-section h2', words: [['Trusted', 'blue']] },
    { selector: '#story h2', words: [['engineering', 'blue'], ['1938', 'red']] },
    { selector: '.sure-group h2', words: [['SURE', 'teal']] },
    { selector: '.service-area h2', words: [['Regional', 'red']] },
    { selector: '#careers h2', words: [['Build', 'red'], ['critical', 'blue']] },
    { selector: '#contact h2', words: [['project', 'red']] }
  ];

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  rules.forEach(({ selector, words }) => {
    const heading = document.querySelector(selector);
    if (!heading || heading.dataset.titleAccented === 'true') return;

    let html = heading.textContent;
    words.forEach(([word, color]) => {
      html = html.replace(
        new RegExp(`(${escapeRegExp(word)})`, 'i'),
        `<span class="title-accent title-accent-${color}">$1</span>`
      );
    });

    heading.innerHTML = html;
    heading.dataset.titleAccented = 'true';
  });
};

const setupDeliveryAccordions = () => {
  document.querySelectorAll('.delivery-card').forEach((card, index) => {
    if (card.dataset.accordionReady === 'true') return;

    const label = card.querySelector('.delivery-label');
    const heading = card.querySelector('h3');
    const description = card.querySelector('p');
    if (!label || !heading || !description) return;

    const detailsId = `delivery-details-${index + 1}`;
    const summary = document.createElement('div');
    summary.className = 'delivery-summary';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'delivery-toggle';
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-controls', detailsId);
    toggleButton.setAttribute('aria-label', `Expand ${heading.textContent.trim()} details`);
    toggleButton.innerHTML = '<span class="delivery-toggle-icon" aria-hidden="true">+</span>';

    const details = document.createElement('div');
    details.className = 'delivery-details';
    details.id = detailsId;

    card.insertBefore(summary, label);
    summary.append(label, heading, toggleButton);
    details.append(description);
    card.append(details);
    card.classList.add('delivery-collapsible');
    card.dataset.accordionReady = 'true';

    toggleButton.addEventListener('click', () => {
      const willOpen = !card.classList.contains('is-expanded');
      card.classList.toggle('is-expanded', willOpen);
      toggleButton.setAttribute('aria-expanded', String(willOpen));
      toggleButton.setAttribute('aria-label', `${willOpen ? 'Collapse' : 'Expand'} ${heading.textContent.trim()} details`);
    });
  });
};

const setupProjectExpansion = () => {
  const grid = document.querySelector('.project-grid');
  if (!grid || grid.dataset.expansionReady === 'true') return;

  const cards = Array.from(grid.querySelectorAll('.project-card'));
  const desktopVisibleCount = 5;
  if (cards.length <= desktopVisibleCount) return;

  cards.slice(desktopVisibleCount).forEach((card) => card.classList.add('project-extra'));
  grid.classList.add('is-collapsed');
  grid.dataset.expansionReady = 'true';

  const wrap = document.createElement('div');
  wrap.className = 'projects-toggle-wrap';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'projects-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `<span class="projects-toggle-label">View More Projects</span><span class="projects-toggle-icon" aria-hidden="true">+</span>`;

  button.addEventListener('click', () => {
    const willExpand = !grid.classList.contains('is-expanded');
    grid.classList.toggle('is-expanded', willExpand);
    grid.classList.toggle('is-collapsed', !willExpand);
    button.setAttribute('aria-expanded', String(willExpand));
    button.querySelector('.projects-toggle-label').textContent = willExpand ? 'Show Fewer Projects' : 'View More Projects';

    if (willExpand) {
      cards.slice(desktopVisibleCount).forEach((card) => card.classList.add('is-visible'));
    } else {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  wrap.append(button);
  grid.insertAdjacentElement('afterend', wrap);
};

const setupMobileProjectTabs = () => {
  const grid = document.querySelector('.project-grid');
  if (!grid || grid.dataset.mobileTabsReady === 'true') return;

  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const cards = Array.from(grid.querySelectorAll('.project-card'));

  const toggleCard = (card) => {
    if (!mobileQuery.matches) return;
    const willOpen = !card.classList.contains('is-mobile-open');
    card.classList.toggle('is-mobile-open', willOpen);
    card.setAttribute('aria-expanded', String(willOpen));
  };

  cards.forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');

    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      toggleCard(card);
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleCard(card);
    });
  });

  const resetDesktop = () => {
    if (!mobileQuery.matches) {
      cards.forEach((card) => {
        card.classList.remove('is-mobile-open');
        card.setAttribute('aria-expanded', 'false');
      });
    }
  };

  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', resetDesktop);
  else mobileQuery.addListener(resetDesktop);

  grid.dataset.mobileTabsReady = 'true';
};

const setupConciseContent = () => {
  const setText = (selector, text) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  };

  setText('.hero-lead', 'Commercial HVAC and mechanical systems from engineering through service.');

  const trustItems = document.querySelectorAll('.trust-band p');
  if (trustItems[0]) trustItems[0].textContent = 'Design-Build + Plan & Spec';
  if (trustItems[1]) trustItems[1].textContent = 'Service + Maintenance';
  if (trustItems[2]) trustItems[2].textContent = 'Established 1938';

  setText('#capabilities .section-heading h2', 'One mechanical partner. Every phase.');
  setText('#capabilities .section-heading p:not(.eyebrow)', 'One accountable team from concept through lifecycle support.');
  setText('.delivery-section .section-heading h2', 'Design-Build or Plan & Spec.');
  setText('#services .section-heading h2', 'Commercial mechanical expertise.');
  setText('#services .section-heading p:not(.eyebrow)', 'HVAC, controls, piping, service, and specialty environments.');
  setText('#markets .section-heading h2', 'Versatile across critical environments.');
  setText('#markets .section-heading p:not(.eyebrow)', 'Experience across commercial, healthcare, industrial, and specialty facilities.');
  setText('#projects .section-heading h2', 'Projects across the region.');
  setText('#projects .section-heading p:not(.eyebrow)', 'Selected work across Greater Cincinnati and nearby markets.');
  setText('#careers .career-copy p', 'Join a team that builds and maintains critical mechanical systems.');
  setText('#contact .contact-card > div > p:not(.eyebrow)', 'Tell us what you’re planning. We’ll route it to the right team.');

  document.querySelectorAll('h1, h2').forEach((heading) => heading.removeAttribute('data-title-accented'));
  highlightTitleWords();
};

const setupLifecycleStages = () => {
  const rail = document.querySelector('#capabilities .process-rail');
  if (!rail) return;

  const keep = new Set(['Design', 'Permit', 'Install', 'Service', 'Retrofit']);
  Array.from(rail.querySelectorAll('span')).forEach((item) => {
    if (!keep.has(item.textContent.trim())) item.remove();
  });
};

const setupHomeBrandLink = () => {
  const brand = document.querySelector('.brand');
  if (!brand) return;

  brand.setAttribute('href', '#top');
  brand.setAttribute('aria-label', 'Back to top of Cincinnati Air Conditioning Company home page');

  brand.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelector('.nav-links')?.classList.remove('open');
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.textContent = 'Menu';
    }

    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    window.setTimeout(() => {
      if (window.scrollY > 2) window.scrollTo(0, 0);
    }, 450);
  }, true);
};

const setupNavigation = () => {
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? 'Close' : 'Menu';
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu';
    });
  });
};

const setupRevealAnimations = () => {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
};

const setupTilt = () => {
  if (window.matchMedia('(hover: none), (max-width: 760px)').matches) return;

  document.querySelectorAll('.service-card, .project-card, .delivery-card, .market-grid span, .contact-tile').forEach((card) => {
    card.classList.add('interactive-tilt');

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--tilt-x', `${(x - .5) * 7}deg`);
      card.style.setProperty('--tilt-y', `${(.5 - y) * 7}deg`);
      card.style.setProperty('--spot-x', `${x * 100}%`);
      card.style.setProperty('--spot-y', `${y * 100}%`);
      card.classList.add('is-tilting');
    });

    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      ['--tilt-x', '--tilt-y', '--spot-x', '--spot-y'].forEach((name) => card.style.removeProperty(name));
    });
  });
};

const setupScrollProgress = () => {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progressBar);

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    document.documentElement.style.setProperty('--scroll-progress', `${Math.min(progress, 100)}%`);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
};

const setupContactForm = () => {
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent || '';

    if (formStatus) {
      formStatus.textContent = '';
      formStatus.classList.remove('error');
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error('Form submission failed');
      contactForm.reset();
      if (formStatus) formStatus.textContent = 'Thanks — your message was sent. CAC will follow up soon.';
    } catch {
      if (formStatus) {
        formStatus.textContent = 'Something went wrong. Please call 800-587-5067 or try again.';
        formStatus.classList.add('error');
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
};

setupImageFallbacks();
setupConciseContent();
setupLifecycleStages();
setupDeliveryAccordions();
setupProjectExpansion();
setupMobileProjectTabs();
setupHomeBrandLink();
setupNavigation();
setupRevealAnimations();
setupTilt();
setupScrollProgress();
setupContactForm();

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
