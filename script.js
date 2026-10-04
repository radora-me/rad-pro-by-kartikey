document.addEventListener('DOMContentLoaded', () => {
    initHeroVideo();
    initGSAPObjects();
    initScrollAnimations();
    initHeadingAnimations();
    initAboutTypewriter();
    initNavbar();
    initCursorGlow();
    initMobileMenu();
    initSmoothScroll();
    initFaq();
    initForm();
    initRoadmap();
});

function initHeroVideo() {
    const videos = document.querySelectorAll('.hero-video, .about-video, .why-card-video, .stack-video, .stack-item-video');
    const interactiveVideos = document.querySelectorAll('.why-card-video, .stack-item-video');
    const play = video => {
        video.muted = true;
        video.defaultMuted = true;
        video.play().catch(() => {});
    };
    const pause = video => {
        video.pause();
    };

    if (!('IntersectionObserver' in window)) {
        videos.forEach(play);
    } else {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.matches('.why-card-video, .stack-item-video')) play(entry.target);
                else pause(entry.target);
            });
        }, { rootMargin: '120px 0px', threshold: 0.01 });
        videos.forEach(video => observer.observe(video));
    }

    interactiveVideos.forEach(video => {
        const card = video.closest('.why-card, .stack-item');
        if (!card) return;
        card.addEventListener('pointerenter', () => play(video));
        card.addEventListener('pointerleave', () => pause(video));
    });
}

function initGSAPObjects() {
    if (typeof gsap === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

    const consoleObject = document.querySelector('.glass-console');
    const metrics = document.querySelectorAll('.floating-metric');
    const orb = document.querySelector('.glass-orb');
    if (!consoleObject || !orb) return;

    gsap.from('.reference-card', {
        y: 70,
        opacity: 0,
        duration: 1.1,
        stagger: .12,
        ease: 'power4.out',
        delay: .15
    });

    gsap.set([consoleObject, ...metrics, orb], { transformPerspective: 1100, transformOrigin: '50% 50%' });
    gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from(consoleObject, { opacity: 0, y: 40, rotateX: 68, duration: 1.4 })
        .from(metrics, { opacity: 0, scale: .65, y: 26, stagger: .16, duration: .7 }, '-=.8')
        .from(orb, { opacity: 0, scale: 0, duration: .7 }, '-=.55');

    gsap.to(consoleObject, { y: -9, rotateZ: -3.5, duration: 3.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to(metrics, { y: -13, duration: 2.7, repeat: -1, yoyo: true, stagger: .4, ease: 'sine.inOut' });
    gsap.to(orb, { y: -20, rotation: 360, duration: 7, repeat: -1, ease: 'none' });

    const stage = document.querySelector('.hero-object-stage');
    if (stage && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const quickX = gsap.quickTo(stage, 'rotationY', { duration: .8, ease: 'power3' });
        const quickY = gsap.quickTo(stage, 'rotationX', { duration: .8, ease: 'power3' });
        stage.addEventListener('pointermove', event => {
            const bounds = stage.getBoundingClientRect();
            quickX(((event.clientX - bounds.left) / bounds.width - .5) * 8);
            quickY(-((event.clientY - bounds.top) / bounds.height - .5) * 6);
        });
        stage.addEventListener('pointerleave', () => { quickX(0); quickY(0); });
    }

    if (typeof ScrollTrigger !== 'undefined') {
        gsap.to('.hero-object-stage', {
            y: 180, opacity: .18, scale: .78,
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
        });
        gsap.utils.toArray('.stage-card, .phase').forEach(card => {
            gsap.from(card, {
                y: 45, opacity: 0, duration: .8, ease: 'power3.out',
                scrollTrigger: { trigger: card, start: 'top 86%', once: true }
            });
        });
    }
}

function initScrollAnimations() {
    const items = document.querySelectorAll('.anim-in');
    const headings = document.querySelectorAll('.section-heading');
    if (!('IntersectionObserver' in window)) {
        items.forEach(item => item.classList.add('visible'));
        return;
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const delay = entry.target.dataset.delay;
            if (delay) entry.target.style.transitionDelay = `${delay}ms`;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
    items.forEach(item => observer.observe(item));

    const headingObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            headingObserver.unobserve(entry.target);
        });
    }, { threshold: .01, rootMargin: '0px 0px -4% 0px' });
    headings.forEach(heading => headingObserver.observe(heading));

    requestAnimationFrame(() => {
        items.forEach(item => {
            const bounds = item.getBoundingClientRect();
            const isVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
            if (isVisible && !item.classList.contains('visible')) {
                const delay = item.dataset.delay;
                if (delay) item.style.transitionDelay = `${delay}ms`;
                item.classList.add('visible');
                observer.unobserve(item);
            }
        });
        headings.forEach(heading => {
            const bounds = heading.getBoundingClientRect();
            const isVisible = bounds.bottom > 0 && bounds.top < window.innerHeight * .96;
            if (isVisible && !heading.classList.contains('visible')) {
                heading.classList.add('visible');
                headingObserver.unobserve(heading);
            }
        });
    });
}

function initHeadingAnimations() {
    const headings = document.querySelectorAll('.section-heading');
    if (!headings.length) return;

    const revealVisibleHeadings = () => {
        headings.forEach(heading => {
            if (heading.classList.contains('visible')) return;
            const bounds = heading.getBoundingClientRect();
            if (bounds.bottom > 0 && bounds.top < window.innerHeight * .92) {
                heading.classList.add('visible');
            }
        });
    };

    window.addEventListener('scroll', revealVisibleHeadings, { passive: true });
    requestAnimationFrame(revealVisibleHeadings);
}

function initAboutTypewriter() {
    const heading = document.querySelector('.about-typewriter');
    if (!heading || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const text = heading.textContent.trim();
    heading.setAttribute('aria-label', text);
    heading.textContent = '';
    [...text].forEach((character, index) => {
        const span = document.createElement('span');
        span.className = 'typewriter-char';
        span.textContent = character === ' ' ? '\u00a0' : character;
        span.style.setProperty('--char-index', index);
        heading.appendChild(span);
    });

    const reveal = entries => {
        if (!entries[0].isIntersecting) return;
        heading.classList.add('is-typing');
        observer.disconnect();
    };
    const observer = new IntersectionObserver(reveal, { threshold: .35 });
    observer.observe(heading);
}

function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const update = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initCursorGlow() {
    const cursor = document.getElementById('cursorGlow');
    if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let x = innerWidth / 2; let y = innerHeight / 2; let currentX = x; let currentY = y;
    window.addEventListener('pointermove', event => { x = event.clientX; y = event.clientY; }, { passive: true });
    const loop = () => {
        currentX += (x - currentX) * .12; currentY += (y - currentY) * .12;
        cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
    };
    loop();
}

function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');
    if (!hamburger || !menu) return;
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        menu.classList.toggle('active');
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
        hamburger.classList.remove('active'); menu.classList.remove('active');
    }));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', event => {
        const selector = anchor.getAttribute('href');
        if (!selector || selector === '#') return;
        const target = document.querySelector(selector);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
}

function initFaq() {
    document.querySelectorAll('.faq-question').forEach(question => question.addEventListener('click', () => {
        const item = question.closest('.faq-item');
        document.querySelectorAll('.faq-item.open').forEach(openItem => {
            if (openItem !== item) openItem.classList.remove('open');
        });
        item.classList.toggle('open');
    }));
}

function initForm() {
    const form = document.getElementById('eaForm');
    if (!form) return;
    form.addEventListener('submit', event => {
        event.preventDefault();
        const button = form.querySelector('.btn-submit');
        button.textContent = 'Request received ✓';
        button.disabled = true;
    });
}

function initRoadmap() {
    const fill = document.getElementById('roadmapFill');
    const track = document.querySelector('.roadmap-track');
    const phases = [...document.querySelectorAll('.roadmap-phases .phase')];
    if (!fill || !track || !phases.length) return;

    let frameRequested = false;
    const updateProgress = () => {
        frameRequested = false;
        const bounds = track.getBoundingClientRect();
        const isVertical = window.matchMedia('(max-width: 800px)').matches;
        const progress = isVertical
            ? (window.innerHeight * .5 - bounds.top - 18) / Math.max(1, bounds.height - 36)
            : (window.innerHeight * .82 - bounds.top) / (window.innerHeight * .54);
        const clampedProgress = Math.min(1, Math.max(0, progress));

        if (isVertical) {
            fill.style.height = `${clampedProgress * 100}%`;
        } else {
            fill.style.width = `${clampedProgress * 90}%`;
        }

        phases.forEach((phase, index) => {
            const milestone = index / (phases.length - 1);
            phase.classList.toggle('is-reached', clampedProgress >= milestone);
        });
    };

    const requestProgressUpdate = () => {
        if (frameRequested) return;
        frameRequested = true;
        requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', requestProgressUpdate, { passive: true });
    window.addEventListener('resize', requestProgressUpdate);
    requestProgressUpdate();
}
