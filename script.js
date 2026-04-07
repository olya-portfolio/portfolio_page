const SELECTORS = {
  header: '.site-header',
  navLinks: '.main-nav a[href^="#"]',
  sections: '[data-section][id]',
  reveal: '.reveal',
  folders: '.folder[data-folder]',
  motion: '[data-motion]',
  toast: '#folder-toast',
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getHeaderOffset() {
  const header = document.querySelector(SELECTORS.header);
  return header ? header.offsetHeight + 12 : 0;
}

function scrollToTarget(targetId) {
  const target = document.querySelector(targetId);
  if (!target) return;

  const y = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();
  window.scrollTo({
    top: y,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  });
}

function initSmoothScroll() {
  const links = document.querySelectorAll(SELECTORS.navLinks);
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || !targetId.startsWith('#')) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      scrollToTarget(targetId);
      history.replaceState(null, '', targetId);
    });
  });
}

function initActiveNav() {
  const links = Array.from(document.querySelectorAll(SELECTORS.navLinks));
  const sections = Array.from(document.querySelectorAll(SELECTORS.sections));
  if (!links.length || !sections.length) return;

  const navById = new Map(links.map((link) => [link.getAttribute('href')?.slice(1), link]));

  const setActive = (id) => {
    links.forEach((link) => link.classList.remove('active'));
    const current = navById.get(id);
    if (current) current.classList.add('active');
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        setActive(visible[0].target.id);
      }
    },
    {
      rootMargin: '-35% 0px -45% 0px',
      threshold: [0.2, 0.4, 0.6],
    },
  );

  sections.forEach((section) => observer.observe(section));
}

function initRevealAnimations() {
  const sections = document.querySelectorAll(SELECTORS.reveal);
  if (!sections.length || prefersReducedMotion) {
    sections.forEach((node) => node.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    },
    {
      threshold: 0.22,
      rootMargin: '0px 0px -8% 0px',
    },
  );

  sections.forEach((section) => observer.observe(section));
}

function initFolderInteractions() {
  const folders = document.querySelectorAll(SELECTORS.folders);
  const toast = document.querySelector(SELECTORS.toast);
  if (!folders.length || !toast) return;

  let toastTimer;

  const showToast = (label) => {
    toast.textContent = `${label}: раздел в разработке, скоро наполним кейсами.`;
    toast.classList.add('is-visible');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1800);
  };

  folders.forEach((folder) => {
    folder.addEventListener('click', () => {
      const label = folder.dataset.folder || 'Раздел';
      const targetId = folder.dataset.target;
      if (targetId) {
        scrollToTarget(targetId);
      }
      showToast(label);
    });
  });
}

function initHeroMotion() {
  const hero = document.querySelector('.hero-main');
  const motionElements = document.querySelectorAll(SELECTORS.motion);

  if (!hero || !motionElements.length || prefersReducedMotion || window.innerWidth < 900) return;

  hero.addEventListener('mousemove', (event) => {
    const { left, top, width, height } = hero.getBoundingClientRect();
    const x = (event.clientX - left) / width - 0.5;
    const y = (event.clientY - top) / height - 0.5;

    motionElements.forEach((el, index) => {
      const depth = index === 0 ? 8 : 5;
      el.style.transform = `translate(${(x * depth).toFixed(2)}px, ${(y * depth).toFixed(2)}px)`;
    });
  });

  hero.addEventListener('mouseleave', () => {
    motionElements.forEach((el) => {
      el.style.transform = 'translate(0, 0)';
    });
  });
}

function initStickyHeader() {
  const header = document.querySelector(SELECTORS.header);
  if (!header) return;

  const toggleHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  toggleHeader();
  window.addEventListener('scroll', toggleHeader, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initActiveNav();
  initRevealAnimations();
  initFolderInteractions();
  initHeroMotion();
  initStickyHeader();
});
