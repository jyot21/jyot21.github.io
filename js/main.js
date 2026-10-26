(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];

    /* ---------- navbar, rail, dock ---------- */
    const navbar = $('.navbar');
    const menu = $('#menu');
    const menuBtn = $('.menu-btn');
    const upBtn = $('.scroll-up-btn');
    const railFill = $('.rail-fill');
    const railPacket = $('.rail-packet');

    const onScroll = () => {
        const y = window.scrollY;
        navbar.classList.toggle('sticky', y > 20);
        upBtn.classList.toggle('show', y > 600);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, y / max) : 0;
        if (railFill) railFill.style.height = `${p * 100}%`;
        if (railPacket) railPacket.style.top = `calc(6px + ${p} * (100% - 12px))`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    menuBtn.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(open));
    });
    $$('#menu a').forEach((a) => a.addEventListener('click', () => {
        menu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
    }));
    upBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

    const sections = $$('section[id]');
    const links = $$('.menu a, .rail-stop, .dock a');
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const id = `#${e.target.id}`;
            links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));

    /* ---------- typing ---------- */
    const type = (el) => {
        const words = (el.dataset.words || '').split('|').filter(Boolean);
        if (!words.length || reduced) return;
        let w = 0, i = 0, del = false;
        const tick = () => {
            const word = words[w];
            i += del ? -1 : 1;
            el.textContent = word.slice(0, i);
            let wait = del ? 45 : 85;
            if (!del && i === word.length) { wait = 1700; del = true; }
            else if (del && i === 0) { del = false; w = (w + 1) % words.length; wait = 300; }
            setTimeout(tick, wait);
        };
        setTimeout(tick, 1200);
    };
    $$('[data-words]').forEach(type);

    /* ---------- reveal + counters ---------- */
    const count = (el) => {
        const to = Number(el.dataset.count);
        const from = Number(el.dataset.from ?? 0);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        if (reduced) { el.textContent = `${prefix}${to}${suffix}`; return; }
        const t0 = performance.now();
        const dur = 1400;
        const step = (t) => {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = `${prefix}${Math.round(from + (to - from) * eased)}${suffix}`;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    const reveal = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            $$('[data-count]', e.target).forEach((n) => { if (!n.dataset.done) { n.dataset.done = '1'; count(n); } });
            reveal.unobserve(e.target);
        });
    }, { threshold: .15 });
    $$('.reveal').forEach((el) => reveal.observe(el));

    /* ---------- experience tabs ---------- */
    const tabs = $$('.xp-tab');
    const panels = $$('.xp-panel');
    const select = (tab) => {
        tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
        panels.forEach((p) => p.classList.toggle('current', p.id === tab.getAttribute('aria-controls')));
    };
    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', (e) => {
            const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
            if (!dir) return;
            e.preventDefault();
            const next = tabs[(i + dir + tabs.length) % tabs.length];
            select(next);
            next.focus();
        });
    });
    const months = (a, b) => {
        const [ay, am] = a.split('-').map(Number);
        const end = b === 'now' ? new Date() : new Date(Number(b.split('-')[0]), Number(b.split('-')[1]) - 1);
        return (end.getFullYear() - ay) * 12 + (end.getMonth() + 1 - am) + 1;
    };
    panels.forEach((p) => {
        const dur = $('.dur', p);
        if (!dur || !p.dataset.start) return;
        const m = months(p.dataset.start, p.dataset.end || 'now');
        const y = Math.floor(m / 12), r = m % 12;
        dur.textContent = [y && `${y} yr${y > 1 ? 's' : ''}`, r && `${r} mo`].filter(Boolean).join(' ');
    });

    /* ---------- case studies ---------- */
    const modal = $('#case-modal');
    const services = $('#services');
    const more = $('.more-projects');
    const openCase = (id) => {
        const tpl = $(`#case-${id}`);
        const card = $(`.card[data-case="${id}"]`);
        if (!tpl || !modal?.showModal) return;
        $('.case-content', modal).replaceChildren(tpl.content.cloneNode(true));
        const media = $('.card-media', card);
        $('.case-media', modal).replaceChildren(media ? media.cloneNode(true) : '');
        modal.showModal();
        $('.modal-close', modal).focus();
    };
    window.openCase = openCase;
    $$('.card[data-case]').forEach((card) => {
        card.addEventListener('click', () => openCase(card.dataset.case));
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCase(card.dataset.case); } });
    });
    $('.modal-close', modal).addEventListener('click', () => modal.close());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
    more?.addEventListener('click', () => {
        const all = services.classList.toggle('all');
        more.setAttribute('aria-expanded', String(all));
        $('span', more).textContent = all ? 'Show fewer' : `Show all ${$$('.card', services).length} case studies`;
    });

    /* ---------- skill wiring ---------- */
    const WIRES = {
        java: { to: ['spring', 'vthreads', 'junit', 'hibernate'], sys: ['Java 25 fleet upgrade', 'every service'] },
        spring: { to: ['java', 'hibernate', 'junit', 'postgres'], sys: ['Attendance & Leave', 'Notification platform'] },
        hibernate: { to: ['spring', 'postgres', 'mysql'], sys: ['Attendance & Leave'] },
        vthreads: { to: ['java', 'docker'], sys: ['Java 25 fleet upgrade'] },
        python: { to: ['mcp', 'claude'], sys: ['MCP tools'] },
        sql: { to: ['postgres', 'mysql', 'migration'], sys: ['−40% query time', 'Migration'] },
        junit: { to: ['java', 'spring'], sys: ['every service'] },
        kafka: { to: ['events', 'locks', 'cdc', 'redis'], sys: ['Attendance engine', 'Notification platform', 'Transfers sync'] },
        postgres: { to: ['sql', 'hibernate', 'migration'], sys: ['Attendance engine', 'Migration'] },
        mysql: { to: ['sql', 'cdc'], sys: ['DB integration framework'] },
        redis: { to: ['locks', 'kafka'], sys: ['Transfers', 'Email system (30K/hr)'] },
        es: { to: ['postgres', 'sql'], sys: ['Search & reporting'] },
        mongo: { to: ['mcp'], sys: ['MCP tools'] },
        cdc: { to: ['kafka', 'migration', 'mysql'], sys: ['Migration'] },
        events: { to: ['kafka', 'locks'], sys: ['Attendance engine', 'Notification platform'] },
        locks: { to: ['redis', 'kafka', 'events'], sys: ['Transfers'] },
        migration: { to: ['cdc', 'postgres', 'sql'], sys: ['50M+ records, zero downtime'] },
        docker: { to: ['jenkins', 'gradle', 'vthreads'], sys: ['102 services containerised'] },
        jenkins: { to: ['docker', 'gradle'], sys: ['CI/CD'] },
        gradle: { to: ['java', 'jenkins'], sys: ['every service'] },
        aws: { to: ['docker'], sys: ['EC2 / S3'] },
        mcp: { to: ['claude', 'context', 'python', 'mongo'], sys: ['MCP tools over production data'] },
        claude: { to: ['mcp', 'codex', 'context'], sys: ['27-country payroll platform'] },
        codex: { to: ['claude', 'context'], sys: ['27-country payroll platform'] },
        context: { to: ['mcp', 'claude', 'codex'], sys: ['MCP tools'] },
    };
    const topo = $('#topology');
    const linksSvg = $('.topo-links', topo);
    const caption = $('.topo-caption');
    const chips = $$('.chip[data-skill]', topo);
    const chipById = Object.fromEntries(chips.map((c) => [c.dataset.skill, c]));
    const center = (el) => {
        const r = el.getBoundingClientRect(), t = topo.getBoundingClientRect();
        return { x: r.left - t.left + r.width / 2, y: r.top - t.top + r.height / 2 };
    };
    const wire = (chip) => {
        const w = WIRES[chip.dataset.skill];
        if (!w) return;
        unwire();
        topo.classList.add('wiring');
        chip.classList.add('src');
        const from = center(chip);
        w.to.forEach((id) => {
            const target = chipById[id];
            if (!target) return;
            target.classList.add('lit');
            const to = center(target);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', from.x); line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x); line.setAttribute('y2', to.y);
            linksSvg.append(line);
        });
        if (caption) caption.textContent = `${chip.textContent.trim()} → ${w.sys.join(' · ')}`;
    };
    const unwire = () => {
        topo.classList.remove('wiring');
        chips.forEach((c) => c.classList.remove('src', 'lit'));
        linksSvg.replaceChildren();
        if (caption) caption.textContent = '';
    };
    const touch = window.matchMedia('(hover: none)').matches;
    chips.forEach((chip) => {
        if (touch) {
            chip.addEventListener('click', () => (chip.classList.contains('src') ? unwire() : wire(chip)));
        } else {
            chip.addEventListener('mouseenter', () => wire(chip));
            chip.addEventListener('mouseleave', unwire);
        }
        chip.addEventListener('focus', () => wire(chip));
        chip.addEventListener('blur', unwire);
    });
    document.addEventListener('click', (e) => { if (touch && !e.target.closest('.chip')) unwire(); });

    /* ---------- contact ---------- */
    const form = $('#contact-form');
    const status = $('#status');
    const fileInput = $('#attachment', form);
    const fileField = fileInput?.closest('.field');
    const fileName = $('.file-name', fileField);
    const fileEmpty = fileName?.textContent;
    const maxBytes = Number(fileInput?.dataset.max) || 10 * 1024 * 1024;
    const fmtSize = (n) => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
    const showFile = () => {
        const f = fileInput.files[0];
        fileField.classList.toggle('has-file', !!f);
        fileName.textContent = f ? `${f.name} · ${fmtSize(f.size)}` : fileEmpty;
    };
    fileInput?.addEventListener('change', () => {
        const f = fileInput.files[0];
        if (f && f.size > maxBytes) {
            fileInput.value = '';
            status.className = 'err';
            status.textContent = `413 · ${f.name} is ${fmtSize(f.size)}; the limit is 10 MB.`;
        } else if (status.className === 'err') {
            status.className = '';
            status.textContent = '';
        }
        showFile();
    });
    form?.addEventListener('reset', () => setTimeout(showFile));
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = fileInput?.files[0];
        if (f && f.size > maxBytes) {
            status.className = 'err';
            status.textContent = `413 · attachment over 10 MB. Pick a smaller file.`;
            return;
        }
        const btn = $('.send-msg', form);
        btn.disabled = true;
        status.className = '';
        status.textContent = '→ sending…';
        try {
            const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
            if (!res.ok) throw new Error(String(res.status));
            status.className = 'ok';
            status.textContent = '201 Created · thanks, I\'ll reply soon.';
            form.reset();
        } catch (err) {
            status.className = 'err';
            status.textContent = `502 · couldn't send. Email me directly instead.`;
        } finally {
            btn.disabled = false;
        }
    });
    $$('.copy-email').forEach((b) => b.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(b.dataset.email);
            b.classList.add('copied');
            $('em', b).textContent = 'copied';
            setTimeout(() => { b.classList.remove('copied'); $('em', b).textContent = 'copy'; }, 1800);
        } catch { window.location.href = `mailto:${b.dataset.email}`; }
    }));

    /* ---------- hero: event stream ---------- */
    const canvas = $('.stream');
    const home = $('#home');
    if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        const LANES = 6;
        let W = 0, H = 0, dpr = 1, lanesY = [], packets = [], consumer = 0, last = 0, raf = 0, visible = true;
        const amber = [255, 176, 32], cyan = [34, 211, 238];
        const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

        const resize = () => {
            dpr = Math.min(2, window.devicePixelRatio || 1);
            W = home.clientWidth; H = home.clientHeight;
            canvas.width = W * dpr; canvas.height = H * dpr;
            canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const top = H * .22, gap = (H * .56) / (LANES - 1);
            lanesY = Array.from({ length: LANES }, (_, i) => top + i * gap);
            consumer = W * .86;
        };
        const spawn = (lane, x = -20, boost = 0) => packets.push({
            lane, x, v: 40 + Math.random() * 60 + boost, r: 2.5 + Math.random() * 2,
            c: Math.random() < .25 ? cyan : amber, a: 0,
        });
        const draw = (t) => {
            const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
            ctx.clearRect(0, 0, W, H);
            ctx.lineWidth = 1;
            const labels = W >= 760;
            lanesY.forEach((y, i) => {
                ctx.strokeStyle = 'rgba(31,42,61,.9)';
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                if (!labels) return;
                ctx.fillStyle = 'rgba(91,103,121,.7)';
                ctx.font = '11px JetBrains Mono, monospace';
                ctx.fillText(`partition-${i}`, W - 118, y - 8);
            });
            ctx.strokeStyle = 'rgba(34,211,238,.35)';
            ctx.setLineDash([4, 6]);
            ctx.beginPath(); ctx.moveTo(consumer, lanesY[0] - 24); ctx.lineTo(consumer, lanesY[LANES - 1] + 24); ctx.stroke();
            ctx.setLineDash([]);
            if (labels) {
                ctx.fillStyle = 'rgba(34,211,238,.6)';
                ctx.fillText('consumer', consumer + 8, lanesY[0] - 30);
            }

            if (!reduced && Math.random() < dt * 4) spawn(Math.floor(Math.random() * LANES));
            packets = packets.filter((p) => p.a < 1);
            packets.forEach((p) => {
                if (!reduced) p.x += p.v * dt;
                const y = lanesY[p.lane];
                if (p.x >= consumer) {
                    p.a += dt * 3;
                    const g = ctx.createRadialGradient(consumer, y, 0, consumer, y, 18);
                    g.addColorStop(0, rgba(p.c, .7 * (1 - p.a))); g.addColorStop(1, rgba(p.c, 0));
                    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(consumer, y, 18, 0, Math.PI * 2); ctx.fill();
                    return;
                }
                ctx.strokeStyle = rgba(p.c, .35);
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(p.x - 26, y); ctx.lineTo(p.x, y); ctx.stroke();
                ctx.fillStyle = rgba(p.c, .95);
                ctx.shadowColor = rgba(p.c, .8); ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(p.x, y, p.r, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            });
            if (visible) raf = requestAnimationFrame(draw);
        };
        const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); } };
        const stop = () => { cancelAnimationFrame(raf); raf = 0; };

        resize();
        for (let i = 0; i < 14; i++) spawn(Math.floor(Math.random() * LANES), Math.random() * W * .8);
        window.addEventListener('resize', resize);
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(home);
        document.addEventListener('visibilitychange', () => (document.hidden ? stop() : visible && start()));

        let lastPub = 0;
        const publish = (clientX, clientY) => {
            const now = performance.now();
            if (now - lastPub < 60) return;
            lastPub = now;
            const r = home.getBoundingClientRect();
            const x = clientX - r.left, y = clientY - r.top;
            let lane = 0, best = Infinity;
            lanesY.forEach((ly, i) => { const d = Math.abs(ly - y); if (d < best) { best = d; lane = i; } });
            if (best < 60) spawn(lane, x, 80);
        };
        home.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) publish(e.clientX, e.clientY); });
        home.addEventListener('pointerdown', (e) => publish(e.clientX, e.clientY));
        if (reduced) draw(performance.now());
    }
})();
