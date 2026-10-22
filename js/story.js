(() => {
    const prompt = document.querySelector('.story-prompt');
    const story = document.getElementById('story');
    const trigger = document.querySelector('.story-btn');
    if (!prompt || !story || !trigger) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scroller = story.querySelector('.story-scroll');
    const progress = story.querySelector('.story-progress i');
    const chapter = story.querySelector('.story-chapter');
    const scenes = [...story.querySelectorAll('.scene')];
    let lastFocus = null;
    let returnTo = null;

    /* ---------- prompt ---------- */
    const showPrompt = () => {
        lastFocus = document.activeElement;
        prompt.hidden = false;
        document.body.classList.add('story-open');
        prompt.querySelector('.story-prompt-go').focus();
    };
    const hidePrompt = () => {
        prompt.hidden = true;
        if (story.hidden) document.body.classList.remove('story-open');
    };
    trigger.addEventListener('click', showPrompt);
    prompt.querySelectorAll('[data-story="skip"]').forEach((el) => el.addEventListener('click', () => { hidePrompt(); lastFocus?.focus?.(); }));
    prompt.querySelector('[data-story="play"]').addEventListener('click', () => { hidePrompt(); play(); });

    /* ---------- scenes ---------- */
    const watcher = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.intersectionRatio >= .5) {
                e.target.classList.add('on');
                chapter.textContent = e.target.dataset.chapter || '';
            }
        });
    }, { root: null, threshold: [.5] });

    const onScroll = () => {
        const max = scroller.scrollHeight - scroller.clientHeight;
        progress.style.width = `${max > 0 ? (scroller.scrollTop / max) * 100 : 0}%`;
        story.classList.toggle('scrolled', scroller.scrollTop > 40);
    };

    const play = () => {
        story.hidden = false;
        document.body.classList.add('story-open');
        scroller.scrollTop = 0;
        scenes.forEach((s) => { s.classList.remove('on'); watcher.observe(s); });
        if (reduced) scenes.forEach((s) => s.classList.add('on'));
        scroller.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        story.querySelector('.story-exit').focus();
    };

    const exit = (target) => {
        story.hidden = true;
        document.body.classList.remove('story-open');
        scenes.forEach((s) => watcher.unobserve(s));
        scroller.removeEventListener('scroll', onScroll);
        if (target) document.querySelector(target)?.scrollIntoView();
        else (returnTo || lastFocus)?.focus?.();
        returnTo = null;
    };

    story.querySelectorAll('[data-story-exit]').forEach((el) => el.addEventListener('click', (e) => {
        const href = el.getAttribute('href');
        if (href && href.startsWith('#')) { e.preventDefault(); exit(href); }
        else exit();
    }));

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!story.hidden) { e.preventDefault(); exit(); }
        else if (!prompt.hidden) { e.preventDefault(); hidePrompt(); lastFocus?.focus?.(); }
    });

    /* keep focus inside the overlay while it is open */
    story.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusables = [...story.querySelectorAll('button, a[href]')].filter((el) => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
})();
