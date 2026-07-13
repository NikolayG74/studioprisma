/* =============================================
   СТУДИО ПРИСМА — script.js
   ============================================= */

'use strict';

/* ---- Utility ---- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* =============================================
   NAVBAR — scroll + mobile toggle
   ============================================= */
const navbar   = $('#navbar');
const burger   = $('#burger');
const navLinks = $('#navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
  backToTop.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  navLinks.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

// Close menu on link click
$$('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// Close on outside click
document.addEventListener('click', e => {
  if (navLinks.classList.contains('open') && !navbar.contains(e.target)) {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  }
});

/* =============================================
   SCROLL REVEAL
   ============================================= */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger sibling reveals
        const siblings = $$('.reveal', entry.target.parentElement);
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

$$('.reveal').forEach(el => revealObserver.observe(el));

/* =============================================
   COUNTER ANIMATION (stats strip)
   ============================================= */
const counters = $$('.stat-num[data-target]');

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = +el.dataset.target;
      const step   = target / 60;
      let current  = 0;

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current);
        }
      }, 25);

      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

counters.forEach(c => counterObserver.observe(c));

/* =============================================
   GALLERY FILTER
   ============================================= */
const filterBtns  = $$('.filter-btn');
const galleryItems = $$('.gallery-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;

    // Active btn
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Show/hide
    galleryItems.forEach(item => {
      const show = filter === 'all' || item.dataset.cat === filter;
      item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

      if (show) {
        item.style.display = '';
        requestAnimationFrame(() => {
          item.style.opacity = '1';
          item.style.transform = '';
        });
      } else {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
          item.style.display = 'none';
        }, 400);
      }
    });
  });
});

/* =============================================
   LIGHTBOX
   ============================================= */
const lightbox  = $('#lightbox');
const lbImg     = $('#lbImg');
const lbCaption = $('#lbCaption');
const lbClose   = $('#lbClose');
const lbPrev    = $('#lbPrev');
const lbNext    = $('#lbNext');
const lbOverlay = $('#lbOverlay');

let lbImages = [];
let lbCurrent = 0;

// Collect gallery images
function buildLightboxIndex() {
  lbImages = $$('.gallery-item').map(item => ({
    src  : $('img', item).src,
    alt  : $('img', item).alt,
    title: $('h3', item) ? $('h3', item).textContent : '',
  }));
}

function openLightbox(idx) {
  buildLightboxIndex();
  lbCurrent = idx;
  updateLightbox();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function updateLightbox() {
  const item = lbImages[lbCurrent];
  lbImg.src       = item.src;
  lbImg.alt       = item.alt;
  lbCaption.textContent = item.title;
  lbPrev.style.display = lbImages.length > 1 ? '' : 'none';
  lbNext.style.display = lbImages.length > 1 ? '' : 'none';
}

function prevImage() {
  lbCurrent = (lbCurrent - 1 + lbImages.length) % lbImages.length;
  updateLightbox();
}

function nextImage() {
  lbCurrent = (lbCurrent + 1) % lbImages.length;
  updateLightbox();
}

// Click on gallery items
$$('.gallery-item').forEach((item, idx) => {
  item.addEventListener('click', () => openLightbox(idx));
});

lbClose.addEventListener('click', closeLightbox);
lbOverlay.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', e => { e.stopPropagation(); prevImage(); });
lbNext.addEventListener('click', e => { e.stopPropagation(); nextImage(); });

// Keyboard nav
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   prevImage();
  if (e.key === 'ArrowRight')  nextImage();
});

// Touch swipe for lightbox
let lbTouchStartX = 0;
lightbox.addEventListener('touchstart', e => {
  lbTouchStartX = e.changedTouches[0].clientX;
}, { passive: true });
lightbox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - lbTouchStartX;
  if (Math.abs(dx) > 50) dx < 0 ? nextImage() : prevImage();
}, { passive: true });

/* =============================================
   TESTIMONIALS SLIDER
   ============================================= */
const track  = $('#testimonialTrack');
const dots   = $$('.dot');
let current  = 0;
let autoplay = null;

function goToSlide(idx) {
  current = idx;
  track.style.transform = `translateX(-${100 * idx}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

function nextSlide() {
  const total = dots.length;
  goToSlide((current + 1) % total);
}

dots.forEach(dot => {
  dot.addEventListener('click', () => goToSlide(+dot.dataset.idx));
});

function startAutoplay() {
  autoplay = setInterval(nextSlide, 5000);
}

function stopAutoplay() {
  clearInterval(autoplay);
}

startAutoplay();

// Pause on hover
const slider = $('#testimonialsSlider');
slider.addEventListener('mouseenter', stopAutoplay);
slider.addEventListener('mouseleave', startAutoplay);

// Touch swipe for testimonials
let tStartX = 0;
slider.addEventListener('touchstart', e => {
  tStartX = e.changedTouches[0].clientX;
  stopAutoplay();
}, { passive: true });

slider.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tStartX;
  if (Math.abs(dx) > 50) {
    dx < 0 ? nextSlide() : goToSlide((current - 1 + dots.length) % dots.length);
  }
  startAutoplay();
}, { passive: true });

/* =============================================
   CONTACT FORM VALIDATION
   ============================================= */
const contactForm = $('#contactForm');

function validateField(input, errEl, condition) {
  if (!condition) {
    input.classList.add('error');
    errEl.classList.add('show');
    return false;
  }
  input.classList.remove('error');
  errEl.classList.remove('show');
  return true;
}

contactForm.addEventListener('submit', e => {
  e.preventDefault();

  const name    = $('#name');
  const email   = $('#email');
  const message = $('#message');
  const nameErr = $('#nameErr');
  const emailErr= $('#emailErr');
  const msgErr  = $('#msgErr');
  const btnText = $('#btnText');
  const btnLoader= $('#btnLoader');
  const formSuccess= $('#formSuccess');

  // Validate
  const v1 = validateField(name,    nameErr,  name.value.trim().length >= 2);
  const v2 = validateField(email,   emailErr, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
  const v3 = validateField(message, msgErr,   message.value.trim().length >= 10);

  if (!v1 || !v2 || !v3) return;

  // Simulate submission
  btnText.textContent = 'Изпращане...';
  btnLoader.classList.remove('d-none');
  contactForm.querySelector('.btn').disabled = true;

  setTimeout(() => {
    btnText.textContent = 'Изпратено ✓';
    btnLoader.classList.add('d-none');
    formSuccess.classList.remove('d-none');
    contactForm.reset();

    setTimeout(() => {
      btnText.textContent = 'Изпрати запитване';
      contactForm.querySelector('.btn').disabled = false;
      formSuccess.classList.add('d-none');
    }, 5000);
  }, 1800);
});

// Live validation clear
['name', 'email', 'message'].forEach(id => {
  const el = $(`#${id}`);
  el.addEventListener('input', () => {
    el.classList.remove('error');
    $(`#${id}Err`).classList.remove('show');
  });
});

/* =============================================
   BACK TO TOP
   ============================================= */
const backToTop = $('#backToTop');

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* =============================================
   FOOTER YEAR
   ============================================= */
$('#year').textContent = new Date().getFullYear();

/* =============================================
   SMOOTH ACTIVE NAV LINK
   ============================================= */
const sections = $$('section[id], footer[id]');
const navLinkEls = $$('.nav-link');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinkEls.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}`
          ? 'var(--clr-accent)'
          : '';
      });
    }
  });
}, { threshold: 0.35 });

sections.forEach(s => sectionObserver.observe(s));

/* =============================================
   HERO PARALLAX (light, performance-friendly)
   ============================================= */
const heroImg = $('.hero-img');

if (heroImg && window.matchMedia('(min-width: 768px)').matches) {
  window.addEventListener('scroll', () => {
    const offset = window.scrollY;
    heroImg.style.transform = `scale(1) translateY(${offset * 0.22}px)`;
  }, { passive: true });
}

/* =============================================
   CURSOR TRAIL (subtle, desktop only)
   ============================================= */
if (window.matchMedia('(min-width: 768px)').matches && window.matchMedia('(pointer: fine)').matches) {
  const cursor = document.createElement('div');
  cursor.style.cssText = `
    position: fixed; top: 0; left: 0; z-index: 9999;
    width: 10px; height: 10px; border-radius: 50%;
    background: rgba(200,169,110,0.7);
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: width 0.2s, height 0.2s, opacity 0.3s;
    will-change: transform;
  `;
  document.body.appendChild(cursor);

  let cx = 0, cy = 0;

  document.addEventListener('mousemove', e => {
    cx = e.clientX;
    cy = e.clientY;
    cursor.style.transform = `translate(${cx - 5}px, ${cy - 5}px)`;
  }, { passive: true });

  // Expand on interactive elements
  $$('a, button, .gallery-item, .service-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width  = '28px';
      cursor.style.height = '28px';
      cursor.style.background = 'rgba(200,169,110,0.35)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width  = '10px';
      cursor.style.height = '10px';
      cursor.style.background = 'rgba(200,169,110,0.7)';
    });
  });
}

/* =============================================
   SERVICE CARD TILT (subtle 3D hover)
   ============================================= */
$$('.service-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect  = card.getBoundingClientRect();
    const x     = e.clientX - rect.left;
    const y     = e.clientY - rect.top;
    const cx    = rect.width  / 2;
    const cy    = rect.height / 2;
    const rotX  = ((y - cy) / cy) * -4;
    const rotY  = ((x - cx) / cx) *  4;
    card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

console.log('%c✦ Студио Присма — prizmastudio.bg', 'color:#c8a96e;font-family:serif;font-size:1.1rem;');
