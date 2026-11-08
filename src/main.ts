// types

type Base = 2 | 8 | 10 | 16;

// ui
const baseLabels: Record<Base, string> = {
  2: 'bin',
  8: 'oct',
  10: 'dec',
  16: 'hex',
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

// init dom

const buildUi = (): void => {
  const root = document.body;

  root.appendChild(el('h1', 'Bulls & Cows'));

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

  root.append(settings, game);
};

const init = (): void => {
  buildUi();

  // renderSettings();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
