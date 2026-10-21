# The symbol deck — review (draft)

Approved 2026-10-16 and applied to `mobile/src/content/cardsDeck.ts`. Card names and symbols are unchanged; only the lines.

## What's wrong now
1. **Statements about the person.** 20 of the 38 cards state something
   about what's inside the reader — "Something in you is quietly
   responding to someone else", "Your body is carrying about as much as
   it can…", "You're arriving back somewhere familiar…". RULES.md: never
   say anything about what's inside someone.
2. **Russian uses «ты»; the rest of the app uses «вы».**
3. **Russian assumes a man**: «перестал», «отпустил», «подошёл», «не
   выбрал», «не заметил» — the app avoids gendered forms everywhere else.
4. **A few instructions presuppose the answer** ("Notice where your body
   has been asked to hold more than its own shape" assumes it has), and
   one reassures ("…and that's allowed").

## The fix
- Every statement becomes an invitation to **notice whether** — or a
  general truth about how things go, followed by "notice if…". The
  image stays; the claim goes. All cards then carry the "Notice" label
  (`kind: 'instruction'`), since none asserts anything to receive.
- Russian: «вы», and forms that don't assume a gender.

Format: **id** — English / Russian. Changed cards first.

## Statements, rewritten
- **openSystem** — Some doors stay open long after anyone means to come back through them. Notice if one of yours has. / Некоторые двери остаются открытыми ещё долго после того, как через них собирались вернуться. Заметьте, нет ли такой у вас.
- **standingWave** — Notice whether something you thought was released is still moving, quietly, underneath. / Заметьте, не движется ли ещё тихо, где-то внизу, то, что казалось отпущенным.
- **fixedPoint** — In the middle of everything that shifts, notice if anything has stayed exactly still. / Посреди всего, что меняется, заметьте — не осталось ли что-то совершенно неподвижным.
- **signalBeneathNoise** — Under everything loud today, listen for anything quieter trying to be heard. / Под всем громким сегодня прислушайтесь — нет ли чего-то тихого, что пытается быть услышанным.
- **cycleBeginning** — Some things start long before anything shows. Notice if something has. / Некоторые вещи начинаются задолго до того, как это видно. Заметьте, не началось ли что-то.
- **cycleTurning** — Things often turn before we see them turn. Notice if anything feels close to reversing. / Вещи часто поворачивают раньше, чем мы это видим. Заметьте, не близко ли что-то к развороту.
- **threshold** — Notice if anything is standing at the exact centre, not yet leaning either way. / Заметьте, нет ли чего-то, что стоит в самой середине, ещё не склонившись ни в одну сторону.
- **hiddenRoot** — What can't be seen directly often shapes what can. Notice where that might be true today. / То, чего не видно напрямую, часто формирует то, что видно. Заметьте, где это может быть так сегодня.
- **theReturn** — Coming back somewhere familiar by a different path changes the place. Notice if you're returning anywhere. / Если вернуться в знакомое место другой дорогой, оно меняется. Заметьте, не возвращаетесь ли вы куда-то.
- **theFold** — Some things stand only because nothing has nudged them yet. Notice if anything is like that. / Некоторые вещи держатся только потому, что их ещё никто не толкнул. Заметьте, нет ли такого.
- **settledAmplitude** — What's left once the rest quiets down isn't nothing. Notice what's left. / То, что остаётся, когда всё остальное затихло, — не пустота. Заметьте, что осталось.
- **broadcastingField** — Notice anything that's clear right now, whether or not anyone else can see it. / Заметьте то, что сейчас ясно, — видит это кто-то ещё или нет.
- **theSplit** — When a path becomes two, not choosing yet is also a place to stand. Notice if you're there. / Когда путь раздваивается, ещё не выбирать — тоже место, где можно стоять. Заметьте, не там ли вы.
- **bodyLoadLow** — Notice any small weight your body is holding that it hasn't mentioned. / Заметьте небольшой груз, который ваше тело держит, не говоря о нём.
- **bodyLoadMid** — Notice how much your body is carrying, and whether you'd noticed the carrying. / Заметьте, сколько несёт ваше тело — и замечали ли вы, что оно несёт.
- **mindDriveLow** — Listen for one clear thought running underneath everything else, quiet enough to miss. / Прислушайтесь — нет ли одной ясной мысли под всем остальным, достаточно тихой, чтобы её пропустить.
- **mindDriveMid** — A thought can find its full volume without shouting. Notice if one has. / Мысль может обрести полную громкость, не повышая голоса. Заметьте, не произошло ли этого.
- **heartCouplingLow** — Notice whether something in you is responding to someone else, more than either of you has said. / Заметьте, не отзывается ли в вас что-то на другого человека — больше, чем вы оба сказали вслух.
- **heartCouplingMid** — Two things that moved separately can begin to move as one, without anyone noticing when. Notice if anything has. / Две вещи, двигавшиеся порознь, могут начать двигаться как одна — незаметно. Заметьте, не произошло ли этого.
- **spiritFieldLow** — Notice anything quietly present in the background, not yet asking to be named. / Заметьте то, что тихо присутствует на фоне и пока не просит, чтобы его назвали.
- **spiritFieldMid** — Notice anything that isn't concentrated anywhere — just evenly everywhere at once. / Заметьте то, что нигде не сгущено, — просто есть везде и сразу, ровно.

## Instructions, adjusted
- **cycleRising** — Notice where momentum is building — sometimes we're moving before we've decided to. / Заметьте, где нарастает движение: иногда мы уже в пути, ещё не решив этого.
- **belowThreshold** — Notice how close you are. Not whether to cross — just how close. / Заметьте, насколько вы близко. Не стоит ли переступать — просто насколько близко.
- **seeker** — Notice the searching itself, not what it's looking for. / Заметьте сам поиск, а не то, что он ищет.
- **bodyLoadHigh** — Notice if anywhere your body is holding more than its own shape. / Заметьте, не держит ли тело где-то больше, чем позволяет его форма.
- **mindDriveHigh** — Notice if any thought has been pushed past the point where it still sounds like itself. / Заметьте, не подтолкнули ли какую-то мысль дальше той точки, где она ещё звучала как она сама.
- **heartCouplingHigh** — Notice whether staying in step with someone has cost you any of your own motion. / Заметьте, не стоило ли вам то, что вы держите шаг с другим, части вашего собственного движения.

## Instructions, Russian only («вы»; English unchanged)
- **whatYoureCarrying** — Заметьте, что вы несёте. Не зачем — просто его вес, прямо сейчас.
- **interference** — Позвольте обоим голосам звучать одновременно. Не выбирайте. Просто слушайте, что происходит, когда они накладываются.
- **incompleteResonance** — Дайте этой мысли снова прийти. Не пытайтесь её закончить.
- **cyclePeak** — Возможно, это самая полная точка. Заметьте её, пока она не начала меняться.
- **cycleReleasing** — Заметьте, что само ослабляет хватку — без того, чтобы вам нужно было это отпускать.
- **cycleRest** — Здесь ничего не просит быть сделанным. Заметьте, каково позволить этому быть правдой.
- **guardian** — Заметьте, что сейчас удерживается внутри границы, — не решая, нужна ли она ещё.
- **union** — Заметьте, как две вещи, начавшие не в такт, тихо находят общий ритм.
- **smallerDoor** — Заметьте, где стена на самом деле тоньше, чем казалось.
- **heldCourse** — Заметьте, что вы тихо выравниваете, момент за моментом, чтобы удержать это ровно.
- **spiritFieldHigh** — Заметьте, что происходит, когда не остаётся пустого места, куда это могло бы прийти.
