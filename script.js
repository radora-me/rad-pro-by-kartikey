document.addEventListener('DOMContentLoaded', () => {
    optimizeConstrainedDevices();
    initHeroVideo();
    initGSAPObjects();
    initScrollAnimations();
    initHeadingTextAnimations();
    initNavbar();
    initCursorGlow();
    initMobileMenu();
    initTeamCardFlips();
    initSmoothScroll();
    initPolicyDialogs();
    initFaq();
    initForm();
    initRoadmap();
});

function isConstrainedDevice() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return window.matchMedia('(max-width: 800px)').matches
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches
        || Boolean(connection && connection.saveData)
        || (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4);
}

function optimizeConstrainedDevices() {
    if (!isConstrainedDevice()) return;

    document.documentElement.classList.add('constrained-device');
    document.querySelectorAll('video').forEach(video => {
        video.pause();
        video.removeAttribute('autoplay');
        video.preload = 'none';
        video.querySelectorAll('source').forEach(source => {
            const sourceUrl = source.getAttribute('src');
            if (sourceUrl) source.dataset.src = sourceUrl;
            source.removeAttribute('src');
        });
        video.load();
    });
}

function initHeroVideo() {
    const videos = document.querySelectorAll('.hero-video, .about-video, .ea-video, .footer-video, .stack-video, .team-profile-video');
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
    if (typeof gsap === 'undefined' || isConstrainedDevice()) return;
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
        gsap.utils.toArray('.phase').forEach(card => {
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

function initHeadingTextAnimations() {
    const headings = document.querySelectorAll('main h1, main h2, main h3, main h4, .footer h1, .footer h2, .footer h3, .footer h4, .faq-question > span:first-child');
    if (!headings.length) return;
    if (isConstrainedDevice()) {
        headings.forEach(heading => heading.classList.add('visible'));
        return;
    }

    headings.forEach(heading => {
        const textCopy = heading.cloneNode(true);
        textCopy.querySelectorAll('br').forEach(lineBreak => lineBreak.replaceWith(' '));
        const text = textCopy.textContent.trim().replace(/\s+/g, ' ');
        heading.setAttribute('aria-label', text);

        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) {
            if (walker.currentNode.nodeValue.trim()) textNodes.push(walker.currentNode);
        }

        let characterIndex = 0;
        textNodes.forEach(textNode => {
            const fragment = document.createDocumentFragment();
            textNode.nodeValue.split(/(\s+)/).filter(Boolean).forEach(part => {
                if (/^\s+$/.test(part)) {
                    fragment.appendChild(document.createTextNode(part));
                    return;
                }

                const word = document.createElement('span');
                word.className = 'text-reveal-word';
                [...part].forEach(character => {
                    const span = document.createElement('span');
                    span.className = 'text-reveal-char';
                    span.textContent = character;
                    span.style.setProperty('--char-index', characterIndex);
                    characterIndex += 1;
                    word.appendChild(span);
                });
                fragment.appendChild(word);
            });
            textNode.replaceWith(fragment);
        });

        heading.classList.add('text-reveal');
    });

    if (!('IntersectionObserver' in window)) {
        headings.forEach(heading => heading.classList.add('is-typing'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-typing');
            observer.unobserve(entry.target);
        });
    }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    headings.forEach(heading => observer.observe(heading));
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
    let frameRequested = false;
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    window.addEventListener('pointermove', event => {
        x = event.clientX;
        y = event.clientY;
        if (frameRequested) return;
        frameRequested = true;
        requestAnimationFrame(() => {
            cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
            frameRequested = false;
        });
    }, { passive: true });
}

function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');
    if (!hamburger || !menu) return;

    const setMenuOpen = isOpen => {
        hamburger.classList.toggle('active', isOpen);
        menu.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        hamburger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        menu.setAttribute('aria-hidden', String(!isOpen));
        menu.inert = !isOpen;
        document.body.classList.toggle('menu-open', isOpen);
    };

    setMenuOpen(false);
    hamburger.addEventListener('click', () => {
        setMenuOpen(hamburger.getAttribute('aria-expanded') !== 'true');
        if (hamburger.getAttribute('aria-expanded') === 'true') {
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (hamburger.getAttribute('aria-expanded') === 'true') {
                    menu.querySelector('a')?.focus();
                }
            }));
        }
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
    menu.addEventListener('click', event => {
        if (event.target === menu) setMenuOpen(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
            setMenuOpen(false);
            hamburger.focus();
            return;
        }

        if (event.key === 'Tab' && hamburger.getAttribute('aria-expanded') === 'true') {
            const links = menu.querySelectorAll('a[href]');
            const firstLink = links[0];
            const lastLink = links[links.length - 1];
            if (!firstLink || !lastLink) return;
            if (!menu.contains(document.activeElement)) {
                event.preventDefault();
                (event.shiftKey ? lastLink : firstLink).focus();
            } else if (event.shiftKey && document.activeElement === firstLink) {
                event.preventDefault();
                lastLink.focus();
            } else if (!event.shiftKey && document.activeElement === lastLink) {
                event.preventDefault();
                firstLink.focus();
            }
        }
    });
}

function initTeamCardFlips() {
    document.querySelectorAll('.team-profile-flip').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.team-profile');
            if (!card) return;
            const isFlipped = card.classList.toggle('is-flipped');
            card.querySelectorAll('.team-profile-flip').forEach(toggle => {
                toggle.setAttribute('aria-expanded', String(isFlipped));
            });
        });
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', event => {
        if (anchor.hasAttribute('data-dialog-trigger')) return;
        const selector = anchor.getAttribute('href');
        if (!selector || selector === '#') return;
        const target = document.querySelector(selector);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
}

function initPolicyDialogs() {
    document.querySelectorAll('[data-dialog-trigger]').forEach(trigger => {
        const dialog = document.getElementById(trigger.dataset.dialogTrigger);
        if (!(dialog instanceof HTMLDialogElement)) return;

        trigger.addEventListener('click', event => {
            event.preventDefault();
            dialog.showModal();
        });
        const closeButton = dialog.querySelector('.privacy-dialog-close');
        if (closeButton) closeButton.addEventListener('click', () => dialog.close());
        dialog.addEventListener('cancel', event => {
            event.preventDefault();
            dialog.close();
        });
        dialog.addEventListener('click', event => {
            if (event.target === dialog) dialog.close();
        });
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
        }
    });
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

    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJ4BJ6UhiFltK3kgbpcaqm_kHiZAJ_XvoccPs_KHDB5vf0zMuaaorrGEvYEnu9NP4/exec';

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const button = form.querySelector('.btn-submit');

        if (!button) return;

        const originalText = button.textContent;

        button.disabled = true;
        button.textContent = 'Sending...';

        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: new FormData(form)
            });

            form.reset();
            form.hidden = true;
            const successMessage = document.getElementById('eaSuccess');
            if (successMessage) {
                successMessage.hidden = false;
                successMessage.focus();
            }
        } catch (error) {
            button.disabled = false;
            button.textContent = originalText;
            alert('Something went wrong. Please try again.');
        }
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
