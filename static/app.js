document.addEventListener('DOMContentLoaded', function () {

    // ── STAGGERED CARD ANIMATIONS ──
    const cards = document.querySelectorAll(
        '.nm-action-card, .nm-subject-card, .nm-topic-card, ' +
        '.nm-history-card, .nm-stat-card, .nm-hstat'
    );
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 80 + i * 50);
    });
    document.querySelectorAll('.nm-alt-label').forEach(label => {
        label.addEventListener('click', function () {
            document.querySelectorAll('.nm-alt-label').forEach(l => {
                l.classList.remove('nm-alt-selected');
            });
            this.classList.add('nm-alt-selected');
            // Haptic-like pulse on letter badge
            const letter = this.querySelector('.nm-alt-letter');
            if (letter) {
                letter.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.2)' },
                    { transform: 'scale(1)' }
                ], { duration: 200, easing: 'ease-out' });
            }
        });
    });
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) {
        quizForm.addEventListener('submit', function () {
            const btn = quizForm.querySelector('.nm-btn-submit-quiz');
            if (btn) {
                btn.textContent = '⏳ Verificando...';
                btn.disabled = true;
                btn.style.opacity = '0.7';
            }
        });
    }
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('nm-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.nm-step, .nm-levels-card, .nm-tips-card').forEach(el => {
            observer.observe(el);
        });
    }
    const xpEl = document.querySelector('.nm-xp-pop');
    if (xpEl) {
        xpEl.animate([
            { transform: 'scale(0) translateY(10px)', opacity: 0 },
            { transform: 'scale(1.2) translateY(-5px)', opacity: 1, offset: 0.6 },
            { transform: 'scale(1) translateY(0)', opacity: 1 }
        ], { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'both', delay: 200 });
    }
    const ticker = document.querySelector('.nm-status-text');
    if (ticker) {
        const msgs = [
            ticker.textContent,
            'PLATAFORMA NEOMIND · VERSÃO 2.0',
            'IA GROQ ATIVA · QUESTÕES INÉDITAS'
        ];
        let idx = 0;
        setInterval(() => {
            idx = (idx + 1) % msgs.length;
            ticker.style.opacity = '0';
            setTimeout(() => {
                ticker.textContent = msgs[idx];
                ticker.style.opacity = '1';
            }, 300);
        }, 4000);
        ticker.style.transition = 'opacity 0.3s ease';
    }
});