(() => {
    const term = document.getElementById('term');
    const out = document.getElementById('term-out');
    const form = document.getElementById('term-form');
    const input = document.getElementById('term-input');
    const body = document.getElementById('term-body');
    if (!term || typeof term.showModal !== 'function') {
        document.querySelectorAll('.term-btn, .term-hint').forEach((el) => el.remove());
        return;
    }

    const NAME = 'Jyot Maheshwari';
    const EMAIL = 'jyotmmaheshwari@gmail.com';
    const PROMPT = 'jyot@prod:~$ ';
    const LINKS = {
        github: document.querySelector('.home-social a[aria-label="GitHub"]')?.href,
        linkedin: document.querySelector('.home-social a[aria-label="LinkedIn"]')?.href,
    };
    const resumeUrl = () => document.querySelector('a[href^="resume/"]').href;

    const text = (sel, root = document) => root.querySelector(sel)?.textContent.trim() ?? '';
    const cases = () => [...document.querySelectorAll('.card[data-case]')].map((card) => ({
        id: card.dataset.case,
        svc: text('.svc', card),
        name: text('.card-body .text', card),
        summary: text('.card-body p', card),
        status: text('.status', card),
    }));
    const jobs = () => [...document.querySelectorAll('.job')].map((job) => ({
        role: text('h3', job), company: text('.company', job), date: text('.date', job),
    }));
    const skills = () => [...document.querySelectorAll('.skill-group')].map((g) => ({
        name: text('h3', g), items: [...g.querySelectorAll('.chip')].map((c) => c.textContent.trim()),
    }));
    const sections = () => [...document.querySelectorAll('section[id]')].map((s) => s.id);

    const line = (...parts) => {
        const row = document.createElement('div');
        parts.forEach((part) => {
            if (typeof part === 'string') { row.append(part); return; }
            const el = document.createElement(part.href ? 'a' : 'span');
            el.textContent = part.text;
            if (part.cls) el.className = part.cls;
            if (part.href) { el.href = part.href; if (!part.href.startsWith('mailto:')) { el.target = '_blank'; el.rel = 'noopener'; } }
            row.append(el);
        });
        out.append(row);
        body.scrollTop = body.scrollHeight;
    };
    const accent = (t) => ({ text: t, cls: 't-accent' });
    const muted = (t) => ({ text: t, cls: 't-muted' });
    const link = (t, href) => ({ text: t, href });
    const go = (url, label) => { line(`opening ${label}…`); window.open(url, '_blank', 'noopener'); };
    const jump = (id, after) => {
        line(`→ ${id}`);
        setTimeout(() => { term.close(); document.getElementById(id)?.scrollIntoView(); after?.(); }, 300);
    };

    const commands = {
        help: {
            about: 'list commands',
            run: () => {
                Object.entries(commands).forEach(([name, cmd]) => { if (cmd.about) line(accent(name.padEnd(14)), muted(cmd.about)); });
                line(muted('tip: ↑/↓ for history, Tab to autocomplete, Esc to close. There are a few hidden ones.'));
            },
        },
        whoami: {
            about: 'who is this?',
            run: () => {
                line(accent(NAME), ' · Senior Backend Engineer · Bengaluru');
                line('Java, Spring Boot and Kafka microservices for an HRMS and payroll platform: 700+ clients, 500K+ users.');
                line('Event-driven systems, zero-downtime migrations, and MCP tooling over production data.');
            },
        },
        ls: {
            about: 'list case studies',
            run: () => cases().forEach((c) => line(accent(c.id.padEnd(14)), c.name, muted(`  [${c.status}]`))),
        },
        cases: {
            about: 'case studies with one-liners',
            run: () => cases().forEach((c) => { line(accent(c.name)); line(muted(`  ${c.summary}`)); }),
        },
        open: {
            about: 'open <case|resume|github|linkedin>',
            run: (args) => {
                const target = (args[0] || '').toLowerCase();
                if (!target) return line('usage: open <case|resume|github|linkedin>. Try ', accent('ls'), ' for case names.');
                if (target === 'resume') return go(resumeUrl(), 'resume');
                if (LINKS[target]) return go(LINKS[target], target);
                const c = cases().find((x) => x.id === target || x.svc.endsWith(`/${target}`));
                if (!c) return line(`open: ${target}: no such case. Try `, accent('ls'), '.');
                jump('projects', () => window.openCase?.(c.id));
            },
        },
        experience: {
            about: 'where I have worked',
            run: () => jobs().forEach((j) => line(accent(j.date.padEnd(22)), `${j.role} @ ${j.company}`)),
        },
        skills: {
            about: 'cat skills.txt',
            run: () => skills().forEach((g) => { line(accent(g.name)); line(muted(`  ${g.items.join(' · ')}`)); }),
        },
        resume: { about: 'open my resume', run: () => go(resumeUrl(), 'resume') },
        contact: {
            about: 'how to reach me',
            run: () => {
                line('email     ', link(EMAIL, `mailto:${EMAIL}`));
                if (LINKS.github) line('github    ', link('github', LINKS.github));
                if (LINKS.linkedin) line('linkedin  ', link('linkedin', LINKS.linkedin));
            },
        },
        'kafka-topics': {
            about: '--list the sections of this site',
            run: (args) => {
                if (args[0] === '--describe') {
                    sections().forEach((s, i) => line(accent(`Topic: ${s}`), muted(`  PartitionCount: ${i + 1}  ReplicationFactor: 3`)));
                    return;
                }
                sections().forEach((s) => line(s));
                line(muted('try: kafka-topics --describe, or cd <topic>'));
            },
        },
        tail: {
            about: '-f app.log · watch the stream',
            run: () => {
                const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
                const lines = [
                    ['INFO ', 'AttendanceConsumer', 'punch.in emp=48213 partition=4 offset=81723341'],
                    ['INFO ', 'AttendanceCalc', 'day recomputed emp=48213 in 412ms'],
                    ['INFO ', 'NotificationOrchestrator', 'OTP → immediate channel=push'],
                    ['INFO ', 'TransferService', 'lock acquired key=transfer:48213 ttl=30000'],
                    ['WARN ', 'QueryTuner', 'slow query detected (1.2s) → index suggested'],
                    ['INFO ', 'QueryTuner', 'avg query time −40% after partition pruning'],
                    ['INFO ', 'Fleet', 'java 25 · virtual threads · 102/102 services ✔'],
                ];
                lines.forEach(([lvl, src, msg], i) => setTimeout(() => line(muted(`${now()} `), accent(lvl), muted(`[${src}] `), msg), i * 260));
            },
        },
        neofetch: {
            about: 'system info',
            run: () => {
                const art = ['   ____  __  __ ', '  / / / / / / / ', ' / / / / /_/ /  ', '/_/ /_/\\__,_/   ', '   backend      '];
                const info = [
                    [accent('jyot'), '@', accent('prod')],
                    [muted('-----------')],
                    [accent('Role'), ': Senior Backend Engineer'],
                    [accent('Uptime'), `: ${new Date().getFullYear() - 2023}+ years in production`],
                    [accent('Stack'), ': Java 25 · Spring Boot · Kafka'],
                    [accent('Data'), ': PostgreSQL · Redis · Elasticsearch'],
                    [accent('Shell'), ': Claude Code · MCP'],
                ];
                if (body.clientWidth < 560) { info.forEach((p) => line(...p)); return; }
                const rows = Math.max(art.length, info.length);
                for (let i = 0; i < rows; i++) line({ text: (art[i] || '').padEnd(16), cls: 't-logo' }, '  ', ...(info[i] || []));
            },
        },
        sudo: {
            run: (args) => {
                if (args.join(' ').toLowerCase() === 'hire jyot') {
                    line(muted('[sudo] password for recruiter: ********'));
                    line(accent('✔ access granted.'), ' Good call.');
                    line('Drop me a line at ', link(EMAIL, `mailto:${EMAIL}`), ' and let\'s talk.');
                    return;
                }
                line('recruiter is not in the sudoers file. This incident will be reported. ', muted('(try: sudo hire jyot)'));
            },
        },
        cd: {
            run: (args) => {
                const id = (args[0] || '').replace(/^\.?\//, '');
                if (sections().includes(id)) return jump(id);
                line(`cd: ${args[0] || '~'}: try one of `, accent(sections().join(' ')));
            },
        },
        cat: {
            run: (args) => {
                const f = args[0] || '';
                if (f.startsWith('skills')) return commands.skills.run();
                if (f.startsWith('experience')) return commands.experience.run();
                if (f.startsWith('resume')) return commands.resume.run();
                line(`cat: ${f || '?'}: No such file. Try `, accent('cat skills.txt'), '.');
            },
        },
        clear: { about: 'clear the screen', run: () => out.replaceChildren() },
        exit: { about: 'close the terminal', run: () => term.close() },
        history: { run: () => history.forEach((c, i) => line(muted(String(i + 1).padStart(3)), `  ${c}`)) },
        pwd: { run: () => line('/home/jyot/portfolio') },
        date: { run: () => line(new Date().toString()) },
        echo: { run: (args) => line(args.join(' ')) },
        rm: { run: () => line('nice try. ', muted('this portfolio is append-only, like a good log.')) },
        vim: { run: () => line('you are now stuck in vim. just kidding: ', accent('exit'), ' works here.') },
        java: { run: () => { line('openjdk version "25" 2025-09-16 LTS'); line(muted('spring.threads.virtual.enabled=true')); } },
    };
    commands.about = { run: commands.whoami.run };
    commands.hire = { run: () => commands.sudo.run(['hire', 'jyot']) };
    commands.projects = { run: commands.cases.run };

    const history = [];
    let historyIndex = 0;

    const run = (raw) => {
        const value = raw.trim();
        line({ text: PROMPT, cls: 't-prompt' }, value);
        if (!value) return;
        history.push(value);
        historyIndex = history.length;
        const [name, ...args] = value.split(/\s+/);
        const cmd = commands[name.toLowerCase()];
        if (cmd) cmd.run(args);
        else line(`${name}: command not found. Type `, accent('help'), '.');
    };

    const banner = () => {
        line(accent(NAME), muted(' · portfolio shell'));
        line('Type ', accent('help'), ' to see what you can do, or try ', accent('tail -f'), '.');
        line(' ');
    };

    let lastFocus = null;
    const open = () => {
        if (term.open) return;
        lastFocus = document.activeElement;
        if (!out.childElementCount) banner();
        term.showModal();
        input.focus();
    };
    term.addEventListener('close', () => lastFocus?.focus?.());

    form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            historyIndex = Math.max(0, Math.min(history.length, historyIndex + (e.key === 'ArrowUp' ? -1 : 1)));
            input.value = history[historyIndex] ?? '';
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const [name, ...rest] = input.value.split(' ');
            const pool = rest.length ? ['resume', 'github', 'linkedin', ...cases().map((c) => c.id), ...sections()] : Object.keys(commands);
            const partial = rest.length ? rest[rest.length - 1] : name;
            const matches = pool.filter((o) => o.startsWith(partial.toLowerCase()));
            if (matches.length === 1) input.value = rest.length ? [name, ...rest.slice(0, -1), matches[0]].join(' ') : `${matches[0]} `;
            else if (matches.length > 1) line(muted(matches.join('  ')));
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            out.replaceChildren();
        }
    });

    body.addEventListener('click', () => { if (!window.getSelection()?.toString()) input.focus(); });
    term.querySelector('.modal-close').addEventListener('click', () => term.close());
    term.addEventListener('click', (e) => { if (e.target === term) term.close(); });
    document.querySelectorAll('.term-btn, .term-open').forEach((b) => b.addEventListener('click', open));
    document.addEventListener('keydown', (e) => {
        if (e.key !== '`' || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
        e.preventDefault();
        open();
    });
})();
