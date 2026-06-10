/**
 * questoes-fut.js — NeoMind Quiz Premium Interactions
 * Padrão: dashboard-fut.js
 */

(function () {
    'use strict';

    /* ── PARTICLES (reuse canvas if present) ── */
    const canvas = document.getElementById('fut-particles');
    if (canvas && !canvas.dataset.initialized) {
        canvas.dataset.initialized = 'true';
        const ctx = canvas.getContext('2d');
        let particles = [], W, H;

        function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize);

        function mkParticle() {
            return {
                x: Math.random() * W, y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.35,
                vy: -Math.random() * 0.45 - 0.15,
                size: Math.random() * 1.4 + 0.3,
                alpha: Math.random() * 0.45 + 0.1,
                color: Math.random() > 0.5 ? '0,212,255' : '139,92,246',
                life: 1, decay: Math.random() * 0.002 + 0.001
            };
        }
        for (let i = 0; i < 60; i++) particles.push(mkParticle());

        (function draw() {
            ctx.clearRect(0, 0, W, H);
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.life -= p.decay;
                if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > W + 10) {
                    particles[i] = mkParticle(); particles[i].y = H + 5;
                }
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.alpha * p.life})`; ctx.fill();
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.alpha * p.life * 0.12})`; ctx.fill();
            });
            requestAnimationFrame(draw);
        })();
    }

    /* ── PAGE TRANSITION ── */
    const overlay = document.getElementById('fut-transition');
    function triggerTransition(href) {
        if (!overlay || !href) return;
        overlay.classList.add('active');
        setTimeout(() => { window.location.href = href; }, 350);
    }

    // Entry animation — fade in on load
    if (overlay) {
        overlay.style.opacity = '1';
        overlay.style.transition = 'none';
        overlay.classList.add('active');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            overlay.style.transition = 'opacity 0.5s ease, backdrop-filter 0.5s ease';
            overlay.classList.remove('active');
        }));
    }

    // Intercept navigations for smooth transitions
    document.querySelectorAll('a.qfut-level-btn, a.qfut-btn-next, a.qfut-breadcrumb, a.qfut-back-link').forEach(el => {
        el.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript')) {
                e.preventDefault(); triggerTransition(href);
            }
        });
    });

    /* ── NAV BADGE TICKER ── */
    const ticker = document.querySelector('.fut-nav-badge');
    if (ticker) {
        const msgs = ['MODO COMBATE', 'IA GROQ ATIVA', 'PLATAFORMA v2.0', 'SISTEMA ONLINE'];
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

    /* ── ALTERNATIVE SELECTION FEEDBACK ── */
    document.querySelectorAll('.qfut-alt-label').forEach(label => {
        label.addEventListener('click', function () {
            // Skip if already answered
            if (document.querySelector('.qfut-alt-radio:disabled')) return;
            document.querySelectorAll('.qfut-alt-label').forEach(l => l.classList.remove('qfut-alt-selected'));
            this.classList.add('qfut-alt-selected');

            // Ripple effect
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position:absolute; border-radius:50%;
                width:80px; height:80px;
                background:rgba(0,212,255,0.1);
                transform:scale(0); pointer-events:none;
                animation: qfutRipple 0.5s ease-out forwards;
                left:${Math.random() * 60}px; top:-20px;
            `;
            this.style.position = 'relative';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 500);
        });
    });

    /* ── SUBMIT BUTTON LOADING STATE ── */
    const submitBtn = document.querySelector('.qfut-btn-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', function () {
            // Check if radio selected
            const checked = document.querySelector('.qfut-alt-radio:checked');
            if (!checked) return;
            this.textContent = '⚡ PROCESSANDO...';
            this.style.opacity = '0.8';
            this.style.pointerEvents = 'none';
        });
    }

    /* ── TOPIC CARD HOVER FOCUS EFFECT ── */
    const topicCards = document.querySelectorAll('.qfut-topic-card');
    topicCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            topicCards.forEach(c => {
                if (c !== this) { c.style.opacity = '0.55'; c.style.transform = 'scale(0.99)'; }
            });
        });
        card.addEventListener('mouseleave', function () {
            topicCards.forEach(c => { c.style.opacity = ''; c.style.transform = ''; });
        });
    });

    /* ── LEVEL BUTTON RIPPLE ── */
    document.querySelectorAll('.qfut-level-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position:absolute; border-radius:50%;
                width:120px; height:120px;
                background:rgba(0,212,255,0.07);
                transform:translate(-50%,-50%) scale(0);
                pointer-events:none;
                animation: qfutRipple 0.6s ease-out forwards;
                left:${e.clientX - rect.left}px; top:${e.clientY - rect.top}px;
            `;
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    /* ── SCROLL-BASED REVEAL ── */
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.qfut-result-panel, .qfut-ai-explanation').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            obs.observe(el);
        });
    }

    /* ── XP POP ANIMATION ── */
    const xpPop = document.querySelector('.qfut-xp-pop');
    if (xpPop) {
        xpPop.style.opacity = '0';
        xpPop.style.transform = 'scale(0.5) translateY(10px)';
        setTimeout(() => {
            xpPop.style.transition = 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)';
            xpPop.style.opacity = '1';
            xpPop.style.transform = 'scale(1) translateY(0)';
        }, 400);
    }

    /* ── QUESTION TEXT RENDER ── */
    // KaTeX auto-render if available
    if (typeof renderMathInElement !== 'undefined') {
        ['qfut-question-text', 'qfut-ai-text'].forEach(cls => {
            const el = document.querySelector('.' + cls) || document.getElementById(cls);
            if (el) renderMathInElement(el, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$',  right: '$',  display: false }
                ]
            });
        });
    }

    /* ── INJECT RIPPLE KEYFRAMES ── */
    if (!document.getElementById('qfut-ripple-style')) {
        const style = document.createElement('style');
        style.id = 'qfut-ripple-style';
        style.textContent = `
            @keyframes qfutRipple {
                to { transform: translate(-50%,-50%) scale(4); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

})();
