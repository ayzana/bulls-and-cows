// types

type Base = 2 | 8 | 10 | 16;

interface Settings {
  readonly length: number;
  readonly base: Base;
}

type GameStatus = 'playing' | 'won';

interface HistoryEntry {
  guess: string;
  bulls: number;
  cows: number;
}

interface GameState {
  readonly settings: Settings;
  readonly secret: string;
  readonly history: readonly HistoryEntry[];
  readonly status: GameStatus;
  readonly startedAt: number;
}

// ui
const baseLabels: Record<Base, string> = {
  2: 'bin',
  8: 'oct',
  10: 'dec',
  16: 'hex',
};

let state: GameState | null = null;

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector(sel) as T;

const fillList = <T>(
  list: HTMLUListElement,
  items: readonly T[],
  renderItem: (item: T, index: number) => HTMLLIElement,
  emptyText?: string,
): void => {
  const nodes: HTMLLIElement[] =
    items.length > 0 ? items.map(renderItem) : emptyText !== undefined ? [el('li', emptyText)] : [];
  list.replaceChildren(...nodes);
};

const renderSettings = (): void => {
  const lengthSel = $<HTMLSelectElement>('#length');
  const baseSel = $<HTMLSelectElement>('#base');
  const base = Number(baseSel.value) as Base;
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
const ALPHABETS: Record<Base, string> = {
  2: '01',
  8: '01234567',
  10: '0123456789',
  16: '0123456789abcdef',
};

const getAlphabet = (base: Base): string => ALPHABETS[base];

const startGame = (
  settings: Settings,
  now: number = Date.now(),
  random: () => number = Math.random,
): GameState => ({
  settings,
  secret: generateSecret(settings.length, settings.base, random),
  history: [],
  status: 'playing',
  startedAt: now,
});
// fucntions
const generateSecret = (length: number, base: Base, random: () => number = Math.random): string => {
  const pick = (pool: string, remaining: number, acc: string): string => {
    if (remaining === 0) return acc;
    const idx = Math.floor(random() * pool.length);
    const chosen = pool[idx];
    const nextPool = pool.slice(0, idx) + pool.slice(idx + 1);
    return pick(nextPool, remaining - 1, acc + chosen);
  };
  return pick(getAlphabet(base), length, '');
};

//create el with text

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
};

const renderGame = (): void => {
  if (!state) return;

  fillList($('#history'), state.history, (h) =>
    el('li', `${h.guess} → ${h.bulls} 🐂, ${h.cows} 🐄`),
  );

  const input = $<HTMLInputElement>('#guess');

  input.maxLength = state.settings.length;

  const status = $('#status');
  if (state.status === 'won') {
    status.textContent = `Победа! `;
  } else {
    status.textContent = `Угадайте ${state.settings.length} цифр в ${
      baseLabels[state.settings.base]
    }`;
  }

  input.disabled = state.status === 'won';
  $<HTMLButtonElement>('#submit').disabled = state.status === 'won';

  // renderRecords();
};

const startRound = (): void => {
  const length = Number($<HTMLSelectElement>('#length').value);
  const base = Number($<HTMLSelectElement>('#base').value) as Base;
  const settings: Settings = { length, base };
  state = startGame(settings);
  $('#settings').hidden = true;
  $('#game').hidden = false;
  renderGame();
};

// init dom

const buildUi = (): void => {
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
  ([2, 8, 10, 16] as Base[]).forEach((v) => {
    const opt = el('option', baseLabels[v]);
    opt.value = String(v);
    if (v === 10) opt.selected = true;
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

const init = (): void => {
  buildUi();

  $<HTMLSelectElement>('#base').addEventListener('change', renderSettings);
  $<HTMLSelectElement>('#length').addEventListener('change', renderSettings);
  $('#start').addEventListener('click', startRound);

  // $('#new').addEventListener('click', newGame);
  $<HTMLInputElement>('#guess').addEventListener('input', () => {
    if (state) renderGame();
  });

  renderSettings();
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export { generateSecret };
