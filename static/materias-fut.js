// NeoMind — Matérias Page JS
// Mirrors dashboard-fut.js: particles, transitions, hover effects, search, filters

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

                // Glow halo
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.alpha * p.life * 0.15})`;
                ctx.fill();
            });
            requestAnimationFrame(drawParticles);
        }
        drawParticles();
    }

    // ── PAGE TRANSITION (same overlay logic as dashboard-fut.js) ──
    const overlay = document.getElementById('mat-transition');

    function triggerTransition(href) {
        if (!overlay || !href) return;
        overlay.classList.add('active');
        setTimeout(() => {
            window.location.href = href;
        }, 350);
    }

    // Fade-in on load
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

    // Apply transition to all navigational links on the page
    document.querySelectorAll('.mat-card, .mat-back-link, .mat-breadcrumb, .fut-btn-primary, .fut-btn-secondary').forEach(el => {
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
        const msgs = [
            'SUAS MATÉRIAS',
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

    // ── SUBJECT CARD: HOVER FOCUS (mirror of menu-card dimming in dashboard-fut.js) ──
    const matCards = document.querySelectorAll('.mat-card');

    matCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            matCards.forEach(c => {
                if (c !== this) {
                    c.style.opacity = '0.6';
                    c.style.transform = 'scale(0.98)';
                }
            });
        });
        card.addEventListener('mouseleave', function () {
            matCards.forEach(c => {
                c.style.opacity = '';
                c.style.transform = '';
            });
        });
    });

    // ── PROGRESS BARS: ANIMATE ON LOAD ──
    // Animate fills after a brief delay so the entrance animation plays first
    setTimeout(() => {
        document.querySelectorAll('.mat-card-fill').forEach(fill => {
            const target = fill.dataset.pct || '0';
            fill.style.width = target + '%';
        });
    }, 600);

    // ── PROGRESS BARS: ANIMATE ON SCROLL (IntersectionObserver, like step-cards in dashboard-fut.js) ──
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target.querySelector('.mat-card-fill');
                    if (fill) {
                        const target = fill.dataset.pct || '0';
                        setTimeout(() => { fill.style.width = target + '%'; }, 200);
                    }
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        matCards.forEach(card => obs.observe(card));
    }

    // ── SEARCH: LIVE FILTER ──
    const searchInput = document.getElementById('mat-search');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            filterCards();
        });
    }

    // ── FILTER PILLS ──
    const filterPills = document.querySelectorAll('.mat-filter-pill');
    let activeFilter = 'all';

    filterPills.forEach(pill => {
        pill.addEventListener('click', function () {
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            activeFilter = this.dataset.filter || 'all';
            filterCards();
        });
    });

    function filterCards() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        let visible = 0;

        matCards.forEach(card => {
            const name  = (card.dataset.name  || '').toLowerCase();
            const tags  = (card.dataset.tags  || '').toLowerCase();
            const group = (card.dataset.group || '').toLowerCase();

            const matchesSearch = !query || name.includes(query) || tags.includes(query);
            const matchesFilter = activeFilter === 'all' || group === activeFilter || tags.includes(activeFilter);

            if (matchesSearch && matchesFilter) {
                card.style.display = '';
                visible++;
            } else {
                card.style.display = 'none';
            }
        });

        // Update count badge
        const badge = document.querySelector('.mat-count-badge span');
        if (badge) badge.textContent = visible;

        // Show/hide empty state
        const empty = document.querySelector('.mat-empty');
        if (empty) {
            empty.classList.toggle('visible', visible === 0);
        }
    }

    // ── CARD 3D TILT ON HOVER (like player-card in dashboard-fut.js) ──
    matCards.forEach(card => {
        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 8;
            const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 6;
            this.style.transition = 'transform 0.08s ease, box-shadow 0.3s, border-color 0.3s, background 0.3s, opacity 0.3s';
            this.style.transform  = `perspective(900px) rotateY(${x}deg) rotateX(${-y}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', function () {
            this.style.transition = 'transform 0.45s ease, box-shadow 0.3s, border-color 0.3s, background 0.3s, opacity 0.3s';
            this.style.transform  = '';
        });
        card.addEventListener('mouseenter', function () {
            this.style.transition = 'transform 0.08s ease, box-shadow 0.3s, border-color 0.3s, background 0.3s, opacity 0.3s';
        });
    });

    // ── INITIAL COUNT ──
    const badge = document.querySelector('.mat-count-badge span');
    if (badge) badge.textContent = matCards.length;

})();
