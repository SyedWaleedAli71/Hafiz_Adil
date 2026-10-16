/**
 * Hafiz Adil Rabri House — app.js
 * Handles:
 *   1. Sticky header state (transparent over hero → solid on scroll)
 *   2. Mobile nav panel behaviour (close on link click)
 *   3. Hero image parallax
 *   4. Scroll-reveal system (IntersectionObserver, staggered, fail-safe)
 *   5. Contact form validation (front-end demo only)
 *
 * Progressive enhancement: all hidden/animated states are gated behind the
 * `js` class added by a tiny inline script in <head>. If JavaScript is
 * unavailable the site renders fully visible and static.
 */

/* ── 1. Header state ─────────────────────────────────────── */
(function () {
    var header = document.getElementById('siteHeader');
    if (!header) return;

    var solid = false;
    function update() {
        var shouldBeSolid = window.scrollY > 40 || header.classList.contains('is-menu-open');
        if (shouldBeSolid !== solid) {
            solid = shouldBeSolid;
            header.classList.toggle('is-solid', solid);
        }
    }
    window.addEventListener('scroll', update, { passive: true });
    update();

    /* Mobile menu open/close keeps the header solid for readability */
    var nav = document.getElementById('siteNav');
    if (nav) {
        nav.addEventListener('show.bs.collapse', function () {
            header.classList.add('is-menu-open');
            update();
        });
        nav.addEventListener('hidden.bs.collapse', function () {
            header.classList.remove('is-menu-open');
            update();
        });

        /* Close the mobile panel after choosing a link */
        nav.addEventListener('click', function (e) {
            var link = e.target.closest('a');
            if (!link) return;
            if (!window.matchMedia('(max-width: 991.98px)').matches) return;
            var Collapse = window.bootstrap && window.bootstrap.Collapse;
            if (!Collapse) return;
            var inst = Collapse.getInstance(nav) || Collapse.getOrCreateInstance(nav);
            inst.hide();
        });
    }
})();

/* ── 2. Hero parallax ──────────────────────────────────────
   (The hero entrance itself is a pure-CSS animation, so it can
   never be left stuck hidden by JS timing.) */
(function () {
    var img = document.querySelector('.hero__img');

    /* Parallax: very subtle, desktop only, disabled for reduced motion */
    if (!img) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var desktop = window.matchMedia('(min-width: 992px)');
    var ticking = false;

    function apply() {
        ticking = false;
        if (reduced.matches || !desktop.matches) {
            img.style.transform = '';
            return;
        }
        var y = Math.min(window.scrollY * 0.16, 260);
        img.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(1.04)';
    }
    window.addEventListener('scroll', function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(apply);
        }
    }, { passive: true });
    reduced.addEventListener && reduced.addEventListener('change', apply);
    desktop.addEventListener && desktop.addEventListener('change', apply);
    apply();
})();

/* ── 3. Scroll-reveal system ─────────────────────────────── */
(function () {
    var elements = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!elements.length) return;

    window.__revealInit = true;

    /* Stagger siblings that reveal together (cards inside a grid) */
    elements.forEach(function (el) {
        var parent = el.parentElement;
        if (!parent) return;
        var group = [];
        for (var i = 0; i < parent.children.length; i++) {
            if (parent.children[i].hasAttribute('data-reveal')) {
                group.push(parent.children[i]);
            }
        }
        if (group.length < 2) return;
        var index = group.indexOf(el);
        el.style.setProperty('--dd', (Math.min(index, 5) * 90) + 'ms');
    });

    function settle(el, delay) {
        window.setTimeout(function () {
            el.classList.add('is-settled');
        }, 900 + delay);
    }

    function reveal(el) {
        el.classList.add('is-visible');
        var dd = parseInt(el.style.getPropertyValue('--dd'), 10) || 0;
        settle(el, dd);
    }

    /* Fallback: no IntersectionObserver → reveal everything immediately */
    if (!('IntersectionObserver' in window)) {
        elements.forEach(function (el) { el.classList.add('is-visible', 'is-settled'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                reveal(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
})();

/* ── 4. Contact form validation ──────────────────────────────
   Front-end demonstration only — no data is transmitted or
   stored anywhere. The success note says exactly that.        */
(function () {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var successMsg = document.getElementById('form-success');
    var fields = [
        { id: 'cf-name',    message: 'Please enter your name (at least 2 characters).' },
        { id: 'cf-email',   message: 'Please enter a valid email address, e.g. name@example.com.' },
        { id: 'cf-subject', message: 'Please add a short subject (at least 3 characters).' },
        { id: 'cf-message', message: 'Please write a message (at least 10 characters).' }
    ];

    function get(id) { return document.getElementById(id); }

    function showError(id, msg) {
        var field = get(id);
        var error = get(id + '-error');
        if (field) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
        }
        if (error) {
            error.textContent = msg;
            error.classList.add('visible');
        }
    }

    function clearError(id) {
        var field = get(id);
        var error = get(id + '-error');
        if (field) {
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        }
        if (error) {
            error.textContent = '';
            error.classList.remove('visible');
        }
    }

    function isValid(field) {
        var el = get(field.id);
        if (!el) return true;
        var value = (el.value || '').trim();
        if (field.id === 'cf-email') {
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        }
        var min = field.id === 'cf-name' ? 2 : field.id === 'cf-subject' ? 3 : 10;
        return value.length >= min;
    }

    /* Clear errors while typing */
    fields.forEach(function (field) {
        var el = get(field.id);
        if (el) {
            el.addEventListener('input', function () { clearError(field.id); });
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var firstInvalid = null;
        fields.forEach(function (field) {
            if (!isValid(field)) {
                showError(field.id, field.message);
                if (!firstInvalid) firstInvalid = get(field.id);
            } else {
                clearError(field.id);
            }
        });

        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        form.reset();
        if (successMsg) {
            successMsg.classList.add('visible');
            window.setTimeout(function () {
                successMsg.classList.remove('visible');
            }, 9000);
        }
    });
})();
