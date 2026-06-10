// NeoMind — Conteúdos (Trilha) Page JS
// Mirrors dashboard-fut.js: particles, transitions, hover effects, ticker

(function () {
    'use strict';

    // ── PARTICLE SYSTEM (identical to dashboard-fut.js) ──
    const canvas = document.getElementById('fut-particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let W, H;

        function resize() {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        function createParticle() {
            return {
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -Math.random() * 0.5 - 0.2,
                size: Math.random() * 1.5 + 0.3,
                alpha: Math.random() * 0.5 + 0.1,
                color: Math.random() > 0.5 ? '0,212,255' : '139,92,246',
                life: 1,
                decay: Math.random() * 0.002 + 0.001
            };
        }

        for (let i = 0; i < 60; i++) particles.push(createParticle());

        function drawParticles() {
            ctx.clearRect(0, 0, W, H);
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > W + 10) {
                    particles[i] = createParticle();
                    particles[i].y = H + 5;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.alpha * p.life})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.alpha * p.life * 0.15})`;
                ctx.fill();
            });
            requestAnimationFrame(drawParticles);
        }
        drawParticles();
    }

    // ── PAGE TRANSITION (same as dashboard-fut.js) ──
    const overlay = document.getElementById('con-transition');

    function triggerTransition(href) {
        if (!overlay || !href) return;
        overlay.classList.add('active');
        setTimeout(() => { window.location.href = href; }, 350);
    }

    if (overlay) {
        overlay.style.opacity = '1';
        overlay.style.transition = 'none';
        overlay.classList.add('active');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.style.transition = 'opacity 0.5s ease, backdrop-filter 0.5s ease';
                overlay.classList.remove('active');
            });
        });
    }

    document.querySelectorAll('.con-level-btn[href], .con-back-link, .con-breadcrumb, .fut-btn-primary').forEach(el => {
        el.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript')) {
                e.preventDefault();
                triggerTransition(href);
            }
        });
    });

    // ── NAV BADGE TICKER (identical to dashboard-fut.js) ──
    const ticker = document.querySelector('.fut-nav-badge');
    if (ticker) {
        const materia = ticker.textContent.replace('TRILHA · ', '').trim();
        const msgs = [
            `TRILHA · ${materia}`,
            'MODO TREINAMENTO',
            'IA GROQ ATIVA',
            'SISTEMA ONLINE'
        ];
        let idx = 0;
        setInterval(() => {
            idx = (idx + 1) % msgs.length;
            ticker.style.opacity = '0';
            ticker.style.transform = 'translateY(-4px)';
            setTimeout(() => {
                ticker.textContent = msgs[idx];
                ticker.style.opacity = '1';
                ticker.style.transform = 'translateY(0)';
            }, 250);
        }, 3000);
        ticker.style.transition = 'opacity 0.25s, transform 0.25s';
    }

    // ── TOPIC CARDS: HOVER DIMMING (mirrors menu-card behavior in dashboard-fut.js) ──
    const topicCards = document.querySelectorAll('.con-topic-card');

    topicCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            topicCards.forEach(c => {
                if (c !== this) {
                    c.style.opacity = '0.55';
                    c.style.transform = 'translateX(0) scale(0.99)';
                }
            });
        });
        card.addEventListener('mouseleave', function () {
            topicCards.forEach(c => {
                c.style.opacity = '';
                c.style.transform = '';
            });
        });
    });

    // ── TOPIC CARDS: SCROLL ENTRANCE (mirrors step-card IntersectionObserver in dashboard-fut.js) ──
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(18px)';
                    setTimeout(() => {
                        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, border-color 0.3s, background 0.3s, box-shadow 0.3s';
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, 80);
                    obs.unobserve(el);
                }
            });
        }, { threshold: 0.08 });

        topicCards.forEach(el => obs.observe(el));
    }

    // ── LEVEL BUTTONS: RIPPLE ON CLICK ──
    document.querySelectorAll('.con-level-btn:not(.con-level-locked)').forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Only ripple if no transition is pending
            const ripple = document.createElement('span');
            const rect   = this.getBoundingClientRect();
            const size   = Math.max(rect.width, rect.height);
            ripple.style.cssText = `
                position:absolute;
                width:${size}px; height:${size}px;
                left:${e.clientX - rect.left - size / 2}px;
                top:${e.clientY - rect.top  - size / 2}px;
                background: rgba(255,255,255,0.12);
                border-radius: 50%;
                transform: scale(0);
                animation: conRipple 0.5s ease forwards;
                pointer-events:none;
            `;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 500);
        });
    });

    // Inject ripple keyframe once
    if (!document.getElementById('con-ripple-style')) {
        const s = document.createElement('style');
        s.id = 'con-ripple-style';
        s.textContent = '@keyframes conRipple { to { transform: scale(2.5); opacity: 0; } }';
        document.head.appendChild(s);
    }

})();