### 1. Структуры данных и алгоритмы

Состояние игры — иммутабельный GameState в main.ts:

ts
{ settings, secret: string, history: readonly HistoryEntry[], status, startedAt }
secret — строка, а не число: сохраняет лидирующие нули ("0123") и работает для любой base.

history — readonly массив, попытки добавляются через [...state.history, entry], без push. Старое состояние остаётся валидным.

Все поля readonly — менять игру можно только вернув новое состояние из чистой функции.

settings зафиксированы в состоянии на старте раунда — UI не читает их из DOM.

История попыток — HistoryEntry { guess, bulls, cows } - Отдельный тип
evaluateGuess (main.ts) — через HOF:

ts
bulls = s.reduce((acc, d, i) => d === g[i] ? acc + 1 : acc, 0);
cows = s.filter(d => g.includes(d)).length - bulls;
Идея: cows = |secret ∩ guess| − bulls. Обе строки нормализуются toLowerCase — для hex a и A одна цифра.

countPossibleSecrets (main.ts) — число размещений P(base, length) рекурсивно:

ts
P(n,k) = n * P(n-1,k-1), P(n,0)=1, P(n,k>n)=0
Обёрнуто в мемоизацию через замыкание + Map с ключом ${length}:${base}: функция вызывается при каждом открытии настроек, повторные вычисления не нужны.

### 2. Сложность

Функция Big O Обоснование
generateSecret O(n·b) На каждом из n шагов slice(0,idx)+slice(idx+1) копирует пул длиной до b; при n≈b → O(n²).
evaluateGuess O(n²) reduce по n — O(n); filter по n, внутри guess.includes — линейный поиск O(n).
isValidGuess O(n) every по n с includes по алфавиту длины b≤16 (константа) + Set для уникальности O(n).
countPossibleSecrets O(n) первый вызов, O(1) повторный Рекурсия глубиной n, O(1) арифметики на шаг; кэш Map даёт O(1) на повторный вызов.

### 3. Принципы чистого кода

SRP — каждая функция делает одно: createDigitValidator, isValidGuess, evaluateGuess, generateSecret, countPossibleSecrets, submitGuess, addRecord в main.ts. Логика не знает про DOM.

Pure Functions — generateSecret(random), startGame(now, random), evaluateGuess, isValidGuess, elapsedMs(now) в main.ts не трогают внешний мир. Побочные эффекты изолированы в loadRecords/saveRecords и в DOM-функциях (buildUi, renderGame, init).

Immutability — readonly на GameState/Settings/RecordEntry; submitGuess использует [...state.history, entry] и {...state, ...}; addRecord возвращает новый массив; UI использует replaceChildren, не innerHTML.

HOF — evaluateGuess через map/filter/reduce; fillList(items, renderItem) в UI — параметризация рендера.

Каррирование — createDigitValidator(base) возвращает (char) => boolean; используется и в isValidGuess, и в UI-фильтре ввода (renderGame).

DRY — алфавиты в одной ALPHABETS (main.ts); нормализация регистра — одна normalize, применяется в evaluateGuess, isValidGuess, createDigitValidator.

Meaningful Names — bulls/cows, intersectionSize, permutationsUncached, SubmitResult.reason: 'invalid' | 'finished' в main.ts.

Fail Fast / Error Handling — isValidGuess проверяет длину первой; submitGuess возвращает дискриминированное объединение {ok, reason} вместо исключений; loadRecords устойчив к битому localStorage (try/catch, Array.isArray, фильтрация по форме).

YAGNI — нет классов Game/Board; нет реактивной библиотеки; нет отдельной таблицы рекордов на каждую пару (length, base) — единый список + recordsFor;
