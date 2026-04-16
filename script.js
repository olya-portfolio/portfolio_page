const SELECTORS = {
  header: '.site-header',
  navLinks: '.main-nav a[href^="#"]',
  sections: '[data-section][id]',
  reveal: '.reveal',
  folders: '.folder[data-folder]',
  motion: '[data-motion]',
  toast: '#folder-toast',
  worksGrid: '[data-works-json]',
};

const SURF_WORKS_PATH = './data/surf-works.json';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getHeaderOffset() {
  const header = document.querySelector(SELECTORS.header);
  return header ? header.offsetHeight + 12 : 0;
}

function syncHeaderHeightVar() {
  const header = document.querySelector(SELECTORS.header);
  if (!header) return;
  const measuredHeight = Math.ceil(header.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--header-height', `${measuredHeight}px`);
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

function getVkEmbedUrl(url) {
  if (!url) return null;

  if (/vk\.com\/video_ext\.php/i.test(url)) return url;

  try {
    const parsedUrl = new URL(url);
    const directMatch = parsedUrl.pathname.match(/\/video(-?\d+)_([0-9]+)/i);
    if (!directMatch) return null;

    const oid = directMatch[1];
    const id = directMatch[2];

    if (!oid || !id) return null;
    return `https://vk.com/video_ext.php?oid=${oid}&id=${id}`;
  } catch {
    return null;
  }
}

function detectMediaType(url) {
  const normalizedUrl = (url || '').toLowerCase();

  if (/\.(jpg|jpeg|png|webp|gif|avif|heic)(\?|#|$)/i.test(normalizedUrl)) return 'image';
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(normalizedUrl)) return 'video';
  if (/rutube\.ru|youtube\.com|youtu\.be|vimeo\.com|vkvideo\.ru|vk\.com\/video|vk\.com\/video_ext\.php/i.test(normalizedUrl)) return 'embed';

  if (/imgur\.com|flickr\.com|postimg\.|cloudinary\.com|googleusercontent\.com|yandex\./i.test(normalizedUrl)) {
    return 'image';
  }

  return 'image';
}


function applyOrientation(card, orientation) {
  if (!card) return;
  card.classList.remove('is-vertical', 'is-horizontal');
  card.classList.add(orientation === 'vertical' ? 'is-vertical' : 'is-horizontal');
}

function getOrientationFromUrl(url) {
  return /(shorts|reels|stories|tiktok)/i.test(url) ? 'vertical' : 'horizontal';
}

function setOrientationBySize(card, width, height) {
  if (!width || !height) return;
  applyOrientation(card, height > width ? 'vertical' : 'horizontal');
}

function createMediaElement(item, card) {
  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'work-media';

  const mediaType = detectMediaType(item.url || '');
  applyOrientation(card, getOrientationFromUrl(item.url || ''));

  if (mediaType === 'image') {
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.title || 'Работа';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';
    img.addEventListener('load', () => setOrientationBySize(card, img.naturalWidth, img.naturalHeight), { once: true });
    img.addEventListener('error', () => {
      if (!img.dataset.proxyTried && item.url) {
        img.dataset.proxyTried = '1';
        img.src = `https://images.weserv.nl/?url=${encodeURIComponent(item.url.replace(/^https?:\/\//, ''))}`;
        return;
      }
      mediaWrap.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener noreferrer">Открыть изображение по ссылке</a>`;
    });
    mediaWrap.append(img);
    return mediaWrap;
  }

  if (mediaType === 'video') {
    const video = document.createElement('video');
    video.src = item.url;
    video.controls = true;
    video.preload = 'metadata';
    video.addEventListener('loadedmetadata', () => setOrientationBySize(card, video.videoWidth, video.videoHeight), { once: true });
    mediaWrap.append(video);
    return mediaWrap;
  }

  if (mediaType === 'embed') {
    const iframe = document.createElement('iframe');
    const rutubeEmbedUrl = getRutubeEmbedUrl(item.url || '');
    const vkEmbedUrl = getVkEmbedUrl(item.url || '');
    iframe.src = rutubeEmbedUrl || vkEmbedUrl || item.url;
    iframe.title = item.title || 'Встроенное видео';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    mediaWrap.append(iframe);
    return mediaWrap;
  }

  const imageFallback = document.createElement('img');
  imageFallback.src = item.url || '';
  imageFallback.alt = item.title || 'Работа';
  imageFallback.loading = 'lazy';
  imageFallback.referrerPolicy = 'no-referrer';

  imageFallback.addEventListener('load', () => {
    setOrientationBySize(card, imageFallback.naturalWidth, imageFallback.naturalHeight);
  }, { once: true });

  imageFallback.addEventListener('error', () => {
    mediaWrap.innerHTML = `Не удалось загрузить медиа. Используйте прямую ссылку на файл (jpg/png/webp) или <a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer">откройте ссылку вручную</a>.`;
  }, { once: true });

  mediaWrap.append(imageFallback);
  return mediaWrap;
}

function createWorkCard(item) {
  const article = document.createElement('article');
  article.className = 'work-card reveal';

  article.append(createMediaElement(item, article));

  const content = document.createElement('div');
  content.className = 'work-content';

  const title = document.createElement('h3');
  title.textContent = item.title || 'Без названия';

  const desc = document.createElement('p');
  desc.textContent = item.description || 'Описание появится после заполнения JSON.';

  const meta = document.createElement('span');
  meta.className = 'work-meta';
  meta.textContent = item.caseLabel || 'CASE';

  content.append(title, desc, meta);
  article.append(content);
  return article;
}

async function loadWorks() {
  const grid = document.querySelector(SELECTORS.worksGrid);
  if (!grid) return;

  const worksPath = grid.dataset.worksJson || SURF_WORKS_PATH;
  const caseLabel = grid.dataset.caseLabel || 'CASE';

  try {
    const response = await fetch(worksPath, { cache: 'no-store' });
    if (!response.ok) throw new Error('Не удалось загрузить работы.');

    const items = await response.json();
    if (!Array.isArray(items) || !items.length) {
      grid.innerHTML = `<div class="surf-empty">Пока нет работ. Добавьте первую запись в ${worksPath}.</div>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => fragment.append(createWorkCard({ ...item, caseLabel })));
    grid.innerHTML = '';
    grid.append(fragment);
    initRevealAnimations();
  } catch (error) {
    grid.innerHTML = `<div class="surf-empty">Не удалось загрузить кейсы. Проверьте файл ${worksPath}.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  syncHeaderHeightVar();
  initSmoothScroll();
  initActiveNav();
  initRevealAnimations();
  initFolderInteractions();
  initHeroMotion();
  initStickyHeader();
  loadWorks();

  window.addEventListener('resize', syncHeaderHeightVar);
  window.addEventListener('orientationchange', syncHeaderHeightVar);
});
