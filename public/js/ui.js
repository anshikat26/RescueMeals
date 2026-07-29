// RescueMeals Modern Green Glassmorphism & Neomorphism UI Script
(function () {
  'use strict';

  // Global Toast Notification Helper
  window.showToast = function (message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item ${type === 'error' ? 'toast-error' : ''}`;
    
    const iconClass = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    toast.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  };

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Reveal on scroll observer
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal, .animate-on-scroll').forEach((el) => revealObserver.observe(el));

    // 2. Animated counters
    document.querySelectorAll('[data-counter], [data-target]').forEach((el) => {
      const end = parseInt(el.getAttribute('data-counter') || el.getAttribute('data-target'), 10) || 0;
      const duration = 1600;
      let start = 0;
      const stepTime = Math.max(Math.floor(duration / Math.max(end, 1)), 15);
      
      const counterRun = () => {
        start += Math.max(1, Math.floor(end / 25));
        if (start >= end) {
          el.textContent = end.toLocaleString() + '+';
        } else {
          el.textContent = start.toLocaleString();
          setTimeout(counterRun, stepTime);
        }
      };

      const startWhenVisible = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !el.classList.contains('animated')) {
            el.classList.add('animated');
            counterRun();
            startWhenVisible.disconnect();
          }
        });
      }, { threshold: 0.3 });

      startWhenVisible.observe(el);
    });

    // 3. FAQ Accordion Toggle
    document.querySelectorAll('.faq-question').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isActive = item.classList.contains('active');

        // Close all items
        document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('active'));

        // Toggle clicked item
        if (!isActive) {
          item.classList.add('active');
        }
      });
    });

    // 4. Slight 3D tilt effect for cards
    document.querySelectorAll('.tilt-on-hover').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // 5. Smooth anchor scrolling
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') {
          const target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    // 6. Gallery Lightbox
    const createLightbox = () => {
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = '<img alt="Preview"><button aria-label="Close" style="position:absolute;top:24px;right:24px;background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:28px;border-radius:50%;width:44px;height:44px;cursor:pointer;backdrop-filter:blur(10px);">&times;</button>';
      document.body.appendChild(lb);

      const img = lb.querySelector('img');
      const btn = lb.querySelector('button');

      btn.addEventListener('click', () => lb.classList.remove('show'));
      lb.addEventListener('click', (e) => {
        if (e.target === lb) lb.classList.remove('show');
      });

      return { lb, img };
    };

    const lightbox = createLightbox();
    document.querySelectorAll('.gallery-card, .gallery-item').forEach((item) => {
      item.addEventListener('click', () => {
        const imgEl = item.querySelector('img');
        const src = imgEl ? imgEl.src : item.dataset.src;
        if (!src) return;
        lightbox.img.src = src;
        lightbox.lb.classList.add('show');
      });
    });

    // 7. Hero Canvas background - Elegant Emerald Glowing Orbs (Strictly NO emojis)
    (function () {
      if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
      const canvas = document.getElementById('homeHeroCanvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      let W = 0, H = 0, particles = [];
      const colors = ['rgba(16, 185, 129, 0.25)', 'rgba(52, 211, 153, 0.2)', 'rgba(13, 148, 136, 0.18)', 'rgba(132, 204, 22, 0.15)'];

      function resize() {
        const rect = canvas.getBoundingClientRect();
        W = Math.max(300, Math.floor(rect.width));
        H = Math.max(200, Math.floor(rect.height));
        canvas.width = W * devicePixelRatio;
        canvas.height = H * devicePixelRatio;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      }

      function createParticles() {
        particles = [];
        const count = Math.max(16, Math.floor(W * 0.025));
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: 12 + Math.random() * 28,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -40) p.x = W + 40;
          if (p.x > W + 40) p.x = -40;
          if (p.y < -40) p.y = H + 40;
          if (p.y > H + 40) p.y = -40;

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        requestAnimationFrame(draw);
      }

      window.addEventListener('resize', () => {
        resize();
        createParticles();
      });

      resize();
      createParticles();
      requestAnimationFrame(draw);
    })();
  });
})();
