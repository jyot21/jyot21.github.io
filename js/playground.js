/* Overtime playground: a simplified, client-side model of the five-stage
   overtime pipeline shown in the "overtime" case study. It boots whenever
   the case modal opens with a [data-ot-lab] block inside it. */
(() => {
    'use strict';
    const pad = (n) => String(n).padStart(2, '0');
    const clock = (m) => `${pad(Math.floor(((m % 1440) + 1440) % 1440 / 60))}:${pad(m % 60)}`;
    const dur = (m) => {
        if (m <= 0) return '0';
        const h = Math.floor(m / 60), r = m % 60;
        return `${h ? `${h}h` : ''}${r ? `${pad(r)}m` : h ? '' : '0m'}`;
    };

    const init = (lab) => {
        if (lab.dataset.ready) return;
        lab.dataset.ready = '1';
        const q = (s) => lab.querySelector(s);
        const ctl = {
            shift: q('select[name="shift"]'), policy: q('select[name="policy"]'), day: q('select[name="day"]'),
            planned: q('select[name="planned"]'), inp: q('input[name="in"]'), out: q('input[name="out"]'),
        };
        const outs = {
            in: q('[data-out="in"]'), out: q('[data-out="out"]'), hours: q('[data-out="hours"]'), calc: q('[data-out="calc"]'),
        };
        const stage = {};
        lab.querySelectorAll('.ot-pipe li').forEach((li, i) => {
            li.style.setProperty('--i', i);
            stage[li.dataset.stage] = { li, val: li.querySelector('.st-val'), note: li.querySelector('.st-note') };
        });
        const result = q('.ot-result');
        const set = (key, state, val, note) => {
            const s = stage[key];
            s.li.classList.remove('on', 'skip', 'clip', 'pulse');
            if (state) s.li.classList.add(state);
            s.val.textContent = val;
            s.note.textContent = note;
            void s.li.offsetWidth; // restart the stage animation
            s.li.classList.add('pulse');
        };

        const run = () => {
            const [start, end] = ctl.shift.value.split('-').map(Number);
            const shiftLen = end - start;
            const punchIn = start + Number(ctl.inp.value);
            const punchOut = end + Number(ctl.out.value);
            const worked = punchOut - punchIn;
            const grace = 15;
            const shiftBound = ctl.policy.value === 'shift';
            const mult = Number(ctl.day.value);
            const dayLabel = ctl.day.options[ctl.day.selectedIndex].text.split(' · ')[0].toLowerCase();
            const cap = ctl.planned.value === 'none' ? null : Number(ctl.planned.value) * 60;

            outs.in.textContent = clock(punchIn);
            outs.out.textContent = clock(punchOut);

            let pre = 0, post = 0, normal = 0;
            if (shiftBound) {
                const before = start - punchIn;
                const after = punchOut - end;
                pre = before > grace ? before : 0;
                post = after > grace ? after : 0;
                set('pre', pre ? 'on' : 'skip', dur(pre), before > 0 ? `${clock(punchIn)} → ${clock(start)}` : `in ${clock(punchIn)} · on time`);
                set('post', post ? 'on' : 'skip', dur(post), after > 0 ? `${clock(end)} → ${clock(punchOut)}` : `out ${clock(punchOut)} · on time`);
                set('normal', 'skip', 'off', 'not in policy');
            } else {
                const extra = worked - shiftLen;
                normal = extra > grace ? extra : 0;
                set('pre', 'skip', 'off', 'not in policy');
                set('post', 'skip', 'off', 'not in policy');
                set('normal', normal ? 'on' : 'skip', dur(normal), `${dur(worked)} − ${dur(shiftLen)} shift`);
            }
            const raw = pre + post + normal;
            set('diff', raw ? 'on' : 'skip', `×${mult}`, `${dayLabel} pay`);

            let final = raw;
            if (cap === null) {
                set('planned', raw ? 'on' : 'skip', 'no cap', 'no approval needed');
            } else if (raw > cap) {
                final = cap;
                set('planned', 'clip', dur(cap), `cap ${dur(cap)} of ${dur(raw)}`);
            } else {
                set('planned', raw ? 'on' : 'skip', dur(raw), `≤ approved ${dur(cap)}`);
            }

            // the engine hands payroll classified hours; payroll applies the wage and prices them
            result.classList.toggle('zero', !final);
            outs.hours.textContent = final ? `${dur(final)} @ ${mult}×` : '0h';
            outs.calc.textContent = final ? `payroll applies the wage · ${dayLabel}` : 'no overtime · nothing sent to payroll';
        };

        Object.values(ctl).forEach((el) => el.addEventListener('input', run));
        run();
    };

    const modal = document.getElementById('case-modal');
    modal?.addEventListener('case:open', () => {
        const lab = modal.querySelector('[data-ot-lab]');
        if (lab) init(lab);
    });
    document.querySelectorAll('[data-ot-lab]').forEach(init); // in case one is ever placed inline
})();
