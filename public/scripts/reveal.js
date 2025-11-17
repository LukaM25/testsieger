(function () {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const prefersReducedMotion =
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollTargets = '[data-animate="section"], [data-animate="card"], [data-animate="footer-column"]';
  const isHomepageRoute = () => window.location.pathname === "/";

  const scheduleReveal = (element, delay) => {
    if (!element) return;
    if (prefersReducedMotion || delay <= 0) {
      element.classList.add("is-visible");
      return;
    }
    window.setTimeout(() => element.classList.add("is-visible"), delay);
  };

  let heroRun = false;

  const startHeroSequence = () => {
    if (heroRun) return;
    heroRun = true;
    const heroImageEls = Array.from(document.querySelectorAll('[data-animate="hero-image"]'));
    heroImageEls.forEach((el, i) => {
      scheduleReveal(el, 0);
      const nested = el.querySelector('img, picture, svg');
      if (nested) scheduleReveal(nested, 40 + i * 10); // tiny incremental offset per hero-image
    });
    scheduleReveal(document.querySelector('[data-animate="nav"]'), 140);

    const heroTextBaseDelay = prefersReducedMotion ? 0 : 120;
    const heroSequenceElements = [
      { selector: '[data-animate="hero-badge"]', offset: 0 },
      { selector: '[data-animate="hero-title"]', offset: 60 },
      { selector: '[data-animate="hero-text"]', offset: 120 },
      { selector: '[data-animate="hero-cta"]', offset: 180 },
    ];

    heroSequenceElements.forEach((item) => {
      scheduleReveal(document.querySelector(item.selector), heroTextBaseDelay + item.offset);
    });
  };

  const hasHeroElements = () => {
    return Boolean(document.querySelector('[data-animate="hero-image"], [data-animate="hero-title"], [data-animate="hero-badge"]'));
  };

  // Small page-start sequence for non-home pages: reveal nav and the first few
  // data-animate elements so other pages feel like the homepage (same timing).
  const startPageSequence = () => {
    // reveal nav a bit after hero image would on homepage
    scheduleReveal(document.querySelector('[data-animate="nav"]'), 140);

    // find the first visible animate elements (sections/cards) and reveal with stagger
    const pageTargets = Array.from(document.querySelectorAll('[data-animate]'))
      .filter(Boolean)
      .slice(0, 4); // just reveal nav + up to 4 items to emulate hero sequence

    // base delay aligns with hero's heroTextBaseDelay
    const base = prefersReducedMotion ? 0 : 120;
    pageTargets.forEach((el, i) => {
      // small offset increments that mirror hero offsets (60,120,180...)
      scheduleReveal(el, base + (i + 1) * 60);
    });
  };

  const autoTagSections = () => {
    if (isHomepageRoute()) return;
    const targets = document.querySelectorAll("main section, section, article");
    targets.forEach((target) => {
      if (!target.hasAttribute("data-animate")) {
        target.setAttribute("data-animate", "section");
      }
    });
  };

  let scrollObserver = null;

  const setupScrollReveal = () => {
    if (scrollObserver) {
      scrollObserver.disconnect();
    }

    const targets = Array.from(document.querySelectorAll(scrollTargets));
    if (!targets.length) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    scrollObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    targets.forEach((target) => scrollObserver.observe(target));
    // ensure any already-visible targets show up immediately (fallback)
    targets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        target.classList.add("is-visible");
      }
    });
  };

  const enableAnimationClasses = () => {
    root.classList.add("js-animate");
    root.classList.remove("no-js");
  };

  const runSequence = () => {
    autoTagSections();
    setupScrollReveal();
    // If the page contains hero-like elements, run the hero sequence.
    if (hasHeroElements()) {
      startHeroSequence();
    } else {
      startPageSequence();
    }
  };

  let routeFrame = null;

  const handleRouteChange = () => {
    if (routeFrame !== null) {
      window.cancelAnimationFrame(routeFrame);
    }
    routeFrame = window.requestAnimationFrame(() => {
  // allow hero sequence to run again on newly navigated pages
  heroRun = false;
  runSequence();
      routeFrame = null;
      window.setTimeout(runSequence, 150);
    });
  };

  const interceptHistory = () => {
    const wrap = (type) => {
      const original = history[type];
      history[type] = function (...args) {
        const result = original.apply(this, args);
        handleRouteChange();
        return result;
      };
    };
    wrap("pushState");
    wrap("replaceState");
    window.addEventListener("popstate", handleRouteChange);
  };

  const init = () => {
    enableAnimationClasses();
    runSequence();
    interceptHistory();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
