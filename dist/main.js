// types
// ui
const baseLabels = {
    2: 'bin',
    8: 'oct',
    10: 'dec',
    16: 'hex',
};
let state = null;
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
};
// logic
const ALPHABETS = {
    2: '01',
    8: '01234567',
    10: '0123456789',
    16: '0123456789abcdef',
};
const getAlphabet = (base) => ALPHABETS[base];
const startGame = (settings, now = Date.now(), random = Math.random) => ({
    settings,
    secret: generateSecret(settings.length, settings.base, random),
    history: [],
    status: 'playing',
    startedAt: now,
});
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
        status.textContent = `Угадайте ${state.settings.length} цифр в ${baseLabels[state.settings.base]}`;
    }
    input.disabled = state.status === 'won';
    $('#submit').disabled = state.status === 'won';
    // renderRecords();
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
    // $('#new').addEventListener('click', newGame);
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
export { generateSecret };
