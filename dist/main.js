// types
//records
const STORAGE_KEY = 'bulls-cows-records-v1';
const TOP_N = 10;
const keyOf = (r) => `${r.length}/${r.base}`;
const compareRecords = (a, b) => a.attempts - b.attempts || a.timeMs - b.timeMs || a.at - b.at;
const loadRecords = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((r) => typeof r === 'object' &&
            r !== null &&
            typeof r.attempts === 'number' &&
            typeof r.timeMs === 'number');
    }
    catch {
        return [];
    }
};
const addRecord = (records, entry) => {
    const all = [...records, entry].sort(compareRecords);
    const byKey = new Map();
    return all.filter((r) => {
        const k = keyOf(r);
        const seen = byKey.get(k) ?? 0;
        if (seen >= TOP_N)
            return false;
        byKey.set(k, seen + 1);
        return true;
    });
};
const saveRecords = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};
const recordsFor = (records, length, base) => records.filter((r) => r.length === length && r.base === base);
// ui
const baseLabels = {
    2: 'bin',
    8: 'oct',
    10: 'dec',
    16: 'hex',
};
let state = null;
let records = loadRecords();
const $ = (sel) => document.querySelector(sel);
const fillList = (list, items, renderItem, emptyText) => {
    const nodes = items.length > 0 ? items.map(renderItem) : emptyText !== undefined ? [el('li', emptyText)] : [];
    list.replaceChildren(...nodes);
};
const renderSettings = () => {
    const lengthSel = $('#length');
    const baseSel = $('#base');
    const base = Number(baseSel.value);
    const maxLen = base === 2 ? 2 : 6;
    [...lengthSel.options].forEach((opt) => {
        const len = Number(opt.value);
        opt.disabled = len > base || len > maxLen;
        if (opt.disabled && lengthSel.value === opt.value) {
            lengthSel.value = '2';
        }
    });
    const len = Number(lengthSel.value);
    const total = countPossibleSecrets(len, base);
    $('#possible').textContent = `Возможных секретов: ${total}`;
};
const renderRecords = () => {
    if (!state)
        return;
    const top = recordsFor(records, state.settings.length, state.settings.base);
    fillList($('#records'), top, (r, i) => el('li', `${i + 1}. ${r.attempts} поп., ${(r.timeMs / 1000).toFixed(1)} с`), 'Пока пусто');
};
// logic
const ALPHABETS = {
    2: '01',
    8: '01234567',
    10: '0123456789',
    16: '0123456789abcdef',
};
const getAlphabet = (base) => ALPHABETS[base];
const normalize = (char) => char.toLowerCase();
const createDigitValidator = (base) => (char) => {
    if (char.length !== 1)
        return false;
    return getAlphabet(base).includes(char.toLowerCase());
};
const startGame = (settings, now = Date.now(), random = Math.random) => ({
    settings,
    secret: generateSecret(settings.length, settings.base, random),
    history: [],
    status: 'playing',
    startedAt: now,
});
const submitGuess = (state, guess) => {
    if (state.status !== 'playing') {
        return { ok: false, state, reason: 'finished' };
    }
    const { length, base } = state.settings;
    if (!isValidGuess(guess, length, base)) {
        return { ok: false, state, reason: 'invalid' };
    }
    const evaluation = evaluateGuess(state.secret, guess);
    const entry = { guess, ...evaluation };
    const won = evaluation.bulls === length;
    const next = {
        ...state,
        history: [...state.history, entry],
        status: won ? 'won' : 'playing',
    };
    return { ok: true, state: next };
};
const elapsedMs = (state, now = Date.now()) => now - state.startedAt;
// fucntions
const generateSecret = (length, base, random = Math.random) => {
    const pick = (pool, remaining, acc) => {
        if (remaining === 0)
            return acc;
        const idx = Math.floor(random() * pool.length);
        const chosen = pool[idx];
        const nextPool = pool.slice(0, idx) + pool.slice(idx + 1);
        return pick(nextPool, remaining - 1, acc + chosen);
    };
    return pick(getAlphabet(base), length, '');
};
const permutationsUncached = (length, base) => length <= 0 ? 1 : base < length ? 0 : base * permutationsUncached(length - 1, base - 1);
const countPossibleSecrets = (() => {
    const cache = new Map();
    return (length, base) => {
        const key = `${length}:${base}`;
        const cached = cache.get(key);
        if (cached !== undefined)
            return cached;
        const value = permutationsUncached(length, base);
        cache.set(key, value);
        return value;
    };
})();
const evaluateGuess = (secret, guess) => {
    const s = [...secret].map(normalize);
    const g = [...guess].map(normalize);
    const bulls = s.reduce((acc, digit, i) => (digit === g[i] ? acc + 1 : acc), 0);
    const intersectionSize = s.filter((digit) => g.includes(digit)).length;
    const cows = intersectionSize - bulls;
    return { bulls, cows };
};
const isValidGuess = (guess, length, base) => {
    if (guess.length !== length)
        return false;
    const validator = createDigitValidator(base);
    const chars = [...guess];
    if (!chars.every(validator))
        return false;
    const normalized = chars.map(normalize);
    return new Set(normalized).size === normalized.length;
};
//create el with text
const el = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined)
        node.textContent = text;
    return node;
};
const renderGame = () => {
    if (!state)
        return;
    fillList($('#history'), state.history, (h) => el('li', `${h.guess} → ${h.bulls} 🐂, ${h.cows} 🐄`));
    const input = $('#guess');
    input.maxLength = state.settings.length;
    const status = $('#status');
    if (state.status === 'won') {
        status.textContent = `Победа! `;
    }
    else {
        status.textContent = `Угадайте ${state.settings.length} в ${baseLabels[state.settings.base]}`;
    }
    input.disabled = state.status === 'won';
    $('#submit').disabled = state.status === 'won';
    renderRecords();
};
const startRound = () => {
    const length = Number($('#length').value);
    const base = Number($('#base').value);
    const settings = { length, base };
    state = startGame(settings);
    $('#settings').hidden = true;
    $('#game').hidden = false;
    renderGame();
};
const onSubmit = () => {
    if (!state)
        return;
    const guess = $('#guess').value;
    const result = submitGuess(state, guess);
    if (!result.ok) {
        if (result.reason === 'invalid') {
            $('#status').textContent = 'Недопустимая попытка';
        }
        return;
    }
    state = result.state;
    $('#guess').value = '';
    if (state.status === 'won') {
        const entry = {
            length: state.settings.length,
            base: state.settings.base,
            attempts: state.history.length,
            timeMs: elapsedMs(state),
            at: Date.now(),
        };
        records = addRecord(records, entry);
        saveRecords(records);
    }
    renderGame();
};
const newGame = () => {
    state = null;
    $('#settings').hidden = false;
    $('#game').hidden = true;
    $('#guess').value = '';
    $('#history').replaceChildren();
    renderSettings();
};
// init dom
const buildUi = () => {
    const root = document.body;
    const container = el('div');
    container.className = 'container';
    container.appendChild(el('h1', 'Bulls & Cows'));
    const settings = el('section');
    settings.id = 'settings';
    const lengthLabel = el('label', 'Длина: ');
    const lengthSel = el('select');
    lengthSel.id = 'length';
    ['2', '3', '4', '5', '6'].forEach((v) => {
        const opt = el('option', v);
        opt.value = v;
        lengthSel.appendChild(opt);
    });
    lengthLabel.appendChild(lengthSel);
    const baseLabel = el('label', 'Система: ');
    const baseSel = el('select');
    baseSel.id = 'base';
    [2, 8, 10, 16].forEach((v) => {
        const opt = el('option', baseLabels[v]);
        opt.value = String(v);
        if (v === 10)
            opt.selected = true;
        baseSel.appendChild(opt);
    });
    baseLabel.appendChild(baseSel);
    const possible = el('p');
    possible.id = 'possible';
    const startBtn = el('button', 'Начать');
    startBtn.id = 'start';
    settings.append(lengthLabel, baseLabel, possible, startBtn);
    // --- game layout ---
    const game = el('section');
    game.id = 'game';
    game.hidden = true;
    const statusP = el('p');
    statusP.id = 'status';
    const guessInput = el('input');
    guessInput.id = 'guess';
    guessInput.autocomplete = 'off';
    const submitBtn = el('button', 'Проверить');
    submitBtn.id = 'submit';
    const newBtn = el('button', 'Новая игра');
    newBtn.id = 'new';
    const historyH = el('h3', 'История');
    const historyUl = el('ul');
    historyUl.id = 'history';
    const recordsH = el('h3', 'Рекорды (топ-10)');
    const recordsUl = el('ul');
    recordsUl.id = 'records';
    game.append(statusP, guessInput, submitBtn, newBtn, historyH, historyUl, recordsH, recordsUl);
    container.append(settings, game);
    root.appendChild(container);
};
const init = () => {
    buildUi();
    $('#base').addEventListener('change', renderSettings);
    $('#length').addEventListener('change', renderSettings);
    $('#start').addEventListener('click', startRound);
    $('#submit').addEventListener('click', onSubmit);
    $('#new').addEventListener('click', newGame);
    $('#guess').addEventListener('input', () => {
        if (state)
            renderGame();
    });
    renderSettings();
};
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    }
    else {
        init();
    }
}
export { generateSecret, evaluateGuess, isValidGuess, createDigitValidator, countPossibleSecrets, startGame, submitGuess, elapsedMs, addRecord, recordsFor, };
