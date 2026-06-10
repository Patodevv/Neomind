// NeoMind — Livro (Leitura) Page JS
// Mirrors dashboard-fut.js: particles, transitions, ticker + reading progress

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
    const overlay = document.getElementById('liv-transition');

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

    // Navigation links (NOT the form submit — that must POST normally)
    document.querySelectorAll('.liv-breadcrumb[href], .liv-back-link').forEach(el => {
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
        const initial = ticker.textContent.trim();
        const msgs = [
            initial,
            'MODO LEITURA',
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

    // ── READING PROGRESS BAR ──
    const textEl    = document.getElementById('liv-book-text');
    const fillEl    = document.getElementById('liv-progress-fill');
    const pctEl     = document.getElementById('liv-progress-pct');

    function updateProgress() {
        if (!textEl || !fillEl || !pctEl) return;
        const rect   = textEl.getBoundingClientRect();
        const total  = textEl.offsetHeight;
        const viewed = Math.min(window.scrollY + window.innerHeight - rect.top, total);
        const pct    = Math.max(0, Math.min(100, Math.round((viewed / total) * 100)));

        fillEl.style.width   = pct + '%';
        pctEl.textContent    = pct + '%';

        // When fully read, glow the CTA button
        if (pct >= 95) {
            const btn = document.querySelector('.liv-cta-btn');
            if (btn && !btn.classList.contains('liv-cta-ready')) {
                btn.classList.add('liv-cta-ready');
                btn.style.animation = 'livCtaPulse 1.8s ease-in-out infinite';
            }
        }
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // Inject CTA pulse keyframe
    if (!document.getElementById('liv-anim-style')) {
        const s = document.createElement('style');
        s.id = 'liv-anim-style';
        s.textContent = `
            @keyframes livCtaPulse {
                0%, 100% { box-shadow: 0 4px 20px rgba(0,212,255,0.3); }
                50%       { box-shadow: 0 8px 40px rgba(0,212,255,0.65), 0 0 0 2px rgba(0,212,255,0.2); }
            }
        `;
        document.head.appendChild(s);
    }

    // ── CTA BUTTON: confirm animation before POST ──
    const ctaForm = document.getElementById('liv-cta-form');
    const ctaBtn  = document.querySelector('.liv-cta-btn');
    if (ctaForm && ctaBtn) {
        ctaForm.addEventListener('submit', function () {
            ctaBtn.textContent = 'CARREGANDO QUESTÕES…';
            ctaBtn.style.opacity = '0.7';
            ctaBtn.style.cursor  = 'not-allowed';
            // overlay fires, then form submits naturally
            if (overlay) {
                overlay.classList.add('active');
            }
        });
    }

    // ── KaTeX: render after DOM is ready (delegated — keeps original logic intact) ──
    // The template inlines its own KaTeX call; this block is a safety net
    // in case the template's inline script fires before KaTeX loads.
    if (typeof renderMathInElement === 'function') {
        const bookText = document.getElementById('liv-book-text');
        if (bookText) {
            renderMathInElement(bookText, {
                delimiters: [
                    { left: '$$', right: '$$', display: true  },
                    { left: '$',  right: '$',  display: false }
                ]
            });
        }
    }

})();