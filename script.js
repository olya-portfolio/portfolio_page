const SELECTORS = {
  header: '.site-header',
  navLinks: '.main-nav a[href^="#"]',
  sections: '[data-section][id]',
  reveal: '.reveal',
  folders: '.folder[data-folder]',
  motion: '[data-motion]',
  toast: '#folder-toast',
  surfGrid: '#surf-grid',
};

const SURF_WORKS_PATH = './data/surf-works.json';
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
  if (!folders.length) return;

  let toastTimer;

  const showToast = (label) => {
    if (!toast) return;
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
      const pageUrl = folder.dataset.page;
      if (pageUrl) {
        window.location.href = pageUrl;
        return;
      }

      const targetId = folder.dataset.target;
      if (targetId) {
        scrollToTarget(targetId);
      }

      if (label !== 'Surf_Coffee') {
        showToast(label);
      }
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

function getRutubeEmbedUrl(url) {
  const match = url.match(/rutube\.ru\/(?:shorts|video)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  return `https://rutube.ru/play/embed/${match[1]}`;
}

function detectMediaType(url) {
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(url)) return 'image';
  if (/\.(mp4|webm|mov)$/i.test(url)) return 'video';
  if (/rutube\.ru/i.test(url) || /youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return 'embed';
  return 'link';
}

function createMediaElement(item) {
  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'work-media';

  const mediaType = detectMediaType(item.url || '');

  if (mediaType === 'image') {
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.title || 'Работа';
    img.loading = 'lazy';
    mediaWrap.append(img);
    return mediaWrap;
  }

  if (mediaType === 'video') {
    const video = document.createElement('video');
    video.src = item.url;
    video.controls = true;
    video.preload = 'metadata';
    mediaWrap.append(video);
    return mediaWrap;
  }

  if (mediaType === 'embed') {
    const iframe = document.createElement('iframe');
    const rutubeEmbedUrl = getRutubeEmbedUrl(item.url || '');
    iframe.src = rutubeEmbedUrl || item.url;
    iframe.title = item.title || 'Встроенное видео';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    iframe.allowFullscreen = true;
    mediaWrap.append(iframe);
    return mediaWrap;
  }

  mediaWrap.textContent = 'Добавьте ссылку на изображение или видео, чтобы работа отобразилась здесь.';
  return mediaWrap;
}

function createWorkCard(item) {
  const article = document.createElement('article');
  article.className = 'work-card reveal';

  article.append(createMediaElement(item));

  const content = document.createElement('div');
  content.className = 'work-content';

  const title = document.createElement('h3');
  title.textContent = item.title || 'Без названия';

  const desc = document.createElement('p');
  desc.textContent = item.description || 'Описание появится после заполнения JSON.';

  const meta = document.createElement('span');
  meta.className = 'work-meta';
  meta.textContent = 'SURF COFFEE CASE';

  content.append(title, desc, meta);
  article.append(content);
  return article;
}

async function loadSurfWorks() {
  const grid = document.querySelector(SELECTORS.surfGrid);
  if (!grid) return;

  try {
    const response = await fetch(SURF_WORKS_PATH, { cache: 'no-store' });
    if (!response.ok) throw new Error('Не удалось загрузить работы.');

    const items = await response.json();
    if (!Array.isArray(items) || !items.length) {
      grid.innerHTML = '<div class="surf-empty">Пока нет работ. Добавьте первую запись в data/surf-works.json.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => fragment.append(createWorkCard(item)));
    grid.innerHTML = '';
    grid.append(fragment);
    initRevealAnimations();
  } catch (error) {
    grid.innerHTML = '<div class="surf-empty">Не удалось загрузить кейсы. Проверьте файл data/surf-works.json.</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initActiveNav();
  initRevealAnimations();
  initFolderInteractions();
  initHeroMotion();
  initStickyHeader();
  loadSurfWorks();
});
