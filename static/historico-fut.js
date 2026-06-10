/**
 * historico-fut.js — NeoMind Histórico Premium Interactions
 * Padrão: dashboard-fut.js
 */

(function () {
    'use strict';

    /* ── PAGE TRANSITION ENTRY ── */
    const overlay = document.getElementById('fut-transition');
    if (overlay) {
        overlay.style.opacity = '1';
        overlay.style.transition = 'none';
        overlay.classList.add('active');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            overlay.style.transition = 'opacity 0.5s ease, backdrop-filter 0.5s ease';
            overlay.classList.remove('active');
        }));
    }

    /* ── NAV BADGE TICKER ── */
    const ticker = document.querySelector('.fut-nav-badge');
    if (ticker) {
        const msgs = ['LOG DE BATALHAS', 'HISTÓRICO', 'IA GROQ ATIVA', 'SISTEMA ONLINE'];
        let idx = 0;
        ticker.style.transition = 'opacity 0.25s, transform 0.25s';
        setInterval(() => {
            idx = (idx + 1) % msgs.length;
            ticker.style.opacity = '0'; ticker.style.transform = 'translateY(-4px)';
            setTimeout(() => {
                ticker.textContent = msgs[idx];
                ticker.style.opacity = '1'; ticker.style.transform = 'translateY(0)';
            }, 250);
        }, 3000);
    }

    /* ── PROGRESS BAR ANIMATION ── */
    const fill = document.querySelector('.hfut-progress-fill');
    if (fill) {
        const target = fill.dataset.width || '0%';
        fill.style.width = '0%';
        setTimeout(() => { fill.style.width = target; }, 600);
    }

    /* ── STAT COUNTER ANIMATION ── */
    function animateCount(el) {
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target) || target === 0) return;
        const duration = 1000;
        const start = performance.now();
        const suffix = el.dataset.suffix || '';
        (function step(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        })(start);
    }

    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.querySelectorAll('.hfut-stat-num[data-target]').forEach(animateCount);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        const statsGrid = document.querySelector('.hfut-stats-grid');
        if (statsGrid) obs.observe(statsGrid);
    } else {
        // Fallback: just show values immediately
        document.querySelectorAll('.hfut-stat-num[data-target]').forEach(el => {
            el.textContent = el.dataset.target + (el.dataset.suffix || '');
        });
    }

    /* ── HISTORY CARD HOVER FOCUS ── */
    const cards = document.querySelectorAll('.hfut-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            cards.forEach(c => {
                if (c !== this) { c.style.opacity = '0.5'; c.style.transform = 'scale(0.99)'; }
            });
        });
        card.addEventListener('mouseleave', function () {
            cards.forEach(c => { c.style.opacity = ''; c.style.transform = ''; });
        });
    });

    /* ── SCROLL REVEAL FOR CARDS BELOW THE FOLD ── */
    if ('IntersectionObserver' in window) {
        const revealObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                    revealObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });

        // Only apply to cards after the 8th (rest are below fold on most screens)
        document.querySelectorAll('.hfut-card:nth-child(n+9)').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-20px)';
            revealObs.observe(el);
        });
    }

    /* ── STAT CARD MICRO-HOVER ── */
    document.querySelectorAll('.hfut-stat-card').forEach(card => {
        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
            const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
            this.style.transform = `translateY(-3px) perspective(400px) rotateX(${-y}deg) rotateY(${x}deg)`;
        });
        card.addEventListener('mouseleave', function () {
            this.style.transform = '';
            this.style.transition = 'all 0.4s ease';
        });
        card.addEventListener('mouseenter', function () {
            this.style.transition = 'border-color 0.3s, box-shadow 0.3s, transform 0.1s';
        });
    });

    /* ── TRANSITION ON NAVIGATION LINKS ── */
    function triggerTransition(href) {
        if (!overlay || !href) return;
        overlay.classList.add('active');
        setTimeout(() => { window.location.href = href; }, 350);
    }
    document.querySelectorAll('a.hfut-breadcrumb, a.hfut-empty-btn').forEach(el => {
        el.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript')) {
                e.preventDefault(); triggerTransition(href);
            }
        });
    });

})();