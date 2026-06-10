/* perfil-fut.js — NeoMind Perfil Premium Interactions v2.0
   Padrão idêntico a dashboard-fut.js
--------------------------------------------------------------- */
(function () {
    'use strict';

    /* ─────────────────────────────────────────────
       1. PAGE ENTRY ANIMATION (transition overlay)
    ───────────────────────────────────────────── */
    const overlay = document.getElementById('fut-transition');
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

    /* ─────────────────────────────────────────────
       2. XP BAR ANIMATED FILL
    ───────────────────────────────────────────── */
    const xpFill = document.getElementById('pfut-xp-fill');
    if (xpFill) {
        const pct = parseInt(xpFill.dataset.pct || '0', 10);
        const clamped = Math.min(Math.max(pct, 0), 100);
        setTimeout(() => {
            xpFill.style.width = clamped + '%';
        }, 700);
    }

    /* ─────────────────────────────────────────────
       3. PLAYER CARD — 3D TILT ON HOVER
    ───────────────────────────────────────────── */
    const playerCard = document.getElementById('pfut-player-card');
    if (playerCard) {
        playerCard.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            this.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 5}deg)`;
        });
        playerCard.addEventListener('mouseleave', function () {
            this.style.transition = 'transform 0.6s ease, box-shadow 0.35s, border-color 0.35s';
            this.style.transform = '';
        });
        playerCard.addEventListener('mouseenter', function () {
            this.style.transition = 'transform 0.1s ease, box-shadow 0.35s, border-color 0.35s';
        });
    }

    /* ─────────────────────────────────────────────
       4. INTEREST OPTIONS — RADIO SYNC
    ───────────────────────────────────────────── */
    const interestOptions = document.querySelectorAll('.pfut-interest-option');
    const hiddenSelect = document.getElementById('interesse');

    interestOptions.forEach(option => {
        option.addEventListener('click', function () {
            // Remove active from all
            interestOptions.forEach(o => o.classList.remove('pfut-io-active'));
            // Set active on clicked
            this.classList.add('pfut-io-active');
            // Sync value to hidden select for form POST
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                if (hiddenSelect) hiddenSelect.value = radio.value;
            }
            // Micro bounce
            this.style.transform = 'translateY(-3px) scale(1.04)';
            setTimeout(() => { this.style.transform = ''; }, 200);
        });
    });

    /* ─────────────────────────────────────────────
       5. FILE INPUT — PREVIEW + AVATAR PREVIEW
    ───────────────────────────────────────────── */
    const fotoInput = document.getElementById('foto');
    const filePreview = document.getElementById('file-preview');
    const avatarEl = document.getElementById('pfut-avatar');

    if (fotoInput) {
        fotoInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;
            // Update text preview
            if (filePreview) {
                filePreview.textContent = file.name;
                filePreview.style.color = 'rgba(0,212,255,0.65)';
            }
            // Live avatar preview
            if (avatarEl && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Replace placeholder or img with new img
                    if (avatarEl.tagName === 'DIV') {
                        const img = document.createElement('img');
                        img.className = 'pfut-avatar';
                        img.id = 'pfut-avatar';
                        img.alt = 'Avatar';
                        img.src = e.target.result;
                        img.style.opacity = '0';
                        img.style.transition = 'opacity 0.4s ease';
                        avatarEl.parentNode.replaceChild(img, avatarEl);
                        setTimeout(() => { img.style.opacity = '1'; }, 50);
                    } else {
                        avatarEl.style.opacity = '0';
                        setTimeout(() => {
                            avatarEl.src = e.target.result;
                            avatarEl.style.opacity = '1';
                        }, 300);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    /* ─────────────────────────────────────────────
       6. FILE ZONE DRAG & DROP VISUAL FEEDBACK
    ───────────────────────────────────────────── */
    const fileZone = document.getElementById('pfut-file-zone');
    if (fileZone && fotoInput) {
        ['dragenter', 'dragover'].forEach(evt => {
            fileZone.addEventListener(evt, (e) => {
                e.preventDefault();
                fileZone.style.borderColor = 'rgba(0,212,255,0.4)';
                fileZone.style.background = 'rgba(0,212,255,0.06)';
            });
        });
        ['dragleave', 'drop'].forEach(evt => {
            fileZone.addEventListener(evt, (e) => {
                e.preventDefault();
                fileZone.style.borderColor = '';
                fileZone.style.background = '';
                if (evt === 'drop') {
                    const dt = e.dataTransfer;
                    if (dt && dt.files.length) {
                        fotoInput.files = dt.files;
                        fotoInput.dispatchEvent(new Event('change'));
                    }
                }
            });
        });
    }

    /* ─────────────────────────────────────────────
       7. SAVE BUTTON — LOADING STATE
    ───────────────────────────────────────────── */
    const saveBtn = document.getElementById('pfut-btn-save');
    const form = document.getElementById('pfut-form');

    if (saveBtn && form) {
        form.addEventListener('submit', function () {
            saveBtn.classList.add('pfut-saving');
            const btnContent = saveBtn.querySelector('.pfut-btn-content');
            if (btnContent) {
                btnContent.innerHTML = '<span class="pfut-btn-icon-wrap" style="animation:pfutSpinner 0.8s linear infinite;">↻</span> SALVANDO...';
            }
        });
    }

    /* ─────────────────────────────────────────────
       8. NAV BADGE TICKER
    ───────────────────────────────────────────── */
    const ticker = document.getElementById('pfut-nav-badge');
    if (ticker) {
        const msgs = [
            'PERFIL DO JOGADOR',
            'GERENCIAR CONTA',
            'CONFIGURAÇÕES',
            'SISTEMA ONLINE'
        ];
        let idx = 0;
        ticker.style.transition = 'opacity 0.25s, transform 0.25s';
        setInterval(() => {
            idx = (idx + 1) % msgs.length;
            ticker.style.opacity = '0';
            ticker.style.transform = 'translateY(-4px)';
            setTimeout(() => {
                ticker.textContent = msgs[idx];
                ticker.style.opacity = '1';
                ticker.style.transform = 'translateY(0)';
            }, 250);
        }, 3500);
    }

    /* ─────────────────────────────────────────────
       9. TRANSITION ON LINKS
    ───────────────────────────────────────────── */
    function triggerTransition(href) {
        if (!overlay || !href) return;
        overlay.classList.add('active');
        setTimeout(() => {
            window.location.href = href;
        }, 350);
    }

    document.querySelectorAll('.pfut-quick-btn, .pfut-breadcrumb, .fut-nav-exit').forEach(el => {
        el.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript')) {
                e.preventDefault();
                triggerTransition(href);
            }
        });
    });

    /* ─────────────────────────────────────────────
       10. STAGGERED ENTRANCE — INTERSECTION OBSERVER
    ───────────────────────────────────────────── */
    if ('IntersectionObserver' in window) {
        const animEls = document.querySelectorAll(
            '.pfut-form-section, .pfut-mini-stat, .pfut-quick-btn'
        );
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(16px)';
                    setTimeout(() => {
                        entry.target.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 80 * (i % 5));
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        animEls.forEach(el => obs.observe(el));
    }

    /* ─────────────────────────────────────────────
       11. BIO TEXTAREA — LIVE SYNC TO CARD
    ───────────────────────────────────────────── */
    const recadoInput = document.getElementById('recado');
    const bioText = document.querySelector('.pfut-bio-text');
    if (recadoInput && bioText) {
        recadoInput.addEventListener('input', function () {
            bioText.textContent = '"' + (this.value || '...') + '"';
        });
    }

    /* ─────────────────────────────────────────────
       12. FLASH MESSAGES — AUTO DISMISS
    ───────────────────────────────────────────── */
    document.querySelectorAll('.pfut-flash').forEach(flash => {
        setTimeout(() => {
            flash.style.transition = 'opacity 0.5s ease, transform 0.5s ease, max-height 0.5s ease, margin 0.5s ease, padding 0.5s ease';
            flash.style.opacity = '0';
            flash.style.transform = 'translateY(-8px)';
            setTimeout(() => flash.remove(), 500);
        }, 4000);
    });

    /* ─────────────────────────────────────────────
       CSS KEYFRAME for spinner (injected dynamically)
    ───────────────────────────────────────────── */
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pfutSpinner {
            from { display: inline-block; transform: rotate(0deg); }
            to   { display: inline-block; transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

})();