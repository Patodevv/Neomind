// NeoMind — FUT Dashboard JS
// Particle system, transitions, menu interactions

(function () {
    'use strict';

    // ── PARTICLE SYSTEM ──
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

                // Glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.alpha * p.life * 0.15})`;
                ctx.fill();
            });
            requestAnimationFrame(drawParticles);
        }
        drawParticles();
    }

    // ── PLAYER CARD 3D TILT ──
    const playerCard = document.querySelector('.fut-player-card');
    if (playerCard) {
        playerCard.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            this.style.transform = `perspective(800px) rotateY(${x * 15}deg) rotateX(${-y * 10}deg) scale(1.04)`;
        });
        playerCard.addEventListener('mouseleave', function () {
            this.style.transform = '';
            this.style.transition = 'transform 0.5s ease';
        });
        playerCard.addEventListener('mouseenter', function () {
            this.style.transition = 'transform 0.1s ease';
        });
    }

    // ── FUT MENU CARD INTERACTIONS ──
    const menuCards = document.querySelectorAll('.fut-menu-card');
    menuCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            menuCards.forEach(c => {
                if (c !== this) {
                    c.style.opacity = '0.6';
                    c.style.transform = 'translateX(0) scale(0.98)';
                }
            });
        });
        card.addEventListener('mouseleave', function () {
            menuCards.forEach(c => {
                c.style.opacity = '';
                c.style.transform = '';
            });
        });
    });

    // ── PAGE TRANSITION ──
    const overlay = document.getElementById('fut-transition');
    function triggerTransition(href) {
        if (!overlay || !href) return;
        overlay.classList.add('active');
        setTimeout(() => {
            window.location.href = href;
        }, 350);
    }

    document.querySelectorAll('.fut-menu-card, .fut-btn-primary, .fut-btn-secondary, .fut-tiers-cta a').forEach(el => {
        el.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript')) {
                e.preventDefault();
                triggerTransition(href);
            }
        });
    });

    // Fade in on page load
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

    // ── PROGRESS BAR ANIMATE ON LOAD ──
    setTimeout(() => {
        const fill = document.querySelector('.fut-progress-fill');
        const glow = document.querySelector('.fut-progress-glow');
        if (fill) fill.style.width = '35%';
    }, 800);

    // ── TIER CARDS HOVER GLOW ──
    document.querySelectorAll('.fut-tier-card').forEach(card => {
        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            this.style.setProperty('--mouse-x', x + '%');
            this.style.setProperty('--mouse-y', y + '%');
        });
    });

    // ── STATUS TICKER ──
    const ticker = document.querySelector('.fut-nav-badge');
    if (ticker) {
        const msgs = [
            'MODO TREINAMENTO',
            'IA GROQ ATIVA',
            'PLATAFORMA v2.0',
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

    // ── STEP CARDS STAGGER ──
    const stepCards = document.querySelectorAll('.fut-step-card');
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        entry.target.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 100);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        stepCards.forEach(el => obs.observe(el));
    }

})();
