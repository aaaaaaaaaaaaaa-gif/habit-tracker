import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { HomeIcon, BarChartIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon, ClockIcon, GearIcon, Cross2Icon, CheckCircledIcon, CircleIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/600.css';
import '@fontsource/noto-sans-kr/700.css';
import 'react-circular-progressbar/dist/styles.css';
import { STORAGE_KEY, localDate, addDays, displayDate, weekday, monday, createTracker, goalsOn, doneOn, canRecord, progress, streak, parseDate, type Goal, type Tracker, type Status } from './tracker';

function readTracker(): Tracker {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.version === 1 && saved.startDate && saved.goals?.length && saved.records) {
        return { ...saved, schedule: saved.schedule || {} };
      }
    }
  } catch { /* A visible save error is surfaced if storage is unavailable. */ }
  return createTracker();
}

function Mark({ done, small = false }: { done: boolean; small?: boolean }) {
  return <span className={`mark ${done ? 'is-done' : ''} ${small ? 'small' : ''}`} aria-hidden="true">{done ? <CheckIcon /> : <CircleIcon />}</span>;
}

export default function Prototype() {
  const [data, setData] = useState<Tracker>(readTracker);
  const [today, setToday] = useState(localDate);
  const [view, setView] = useState<'today' | 'stats' | 'plan'>('today');
  const [selected, setSelected] = useState('study');
  const [settings, setSettings] = useState(false);
  const [historyDate, setHistoryDate] = useState<string | null>(null);
  const [calendarStart, setCalendarStart] = useState(() => addDays(monday(localDate()), -7));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<Tracker>(data);
  const [planDate, setPlanDate] = useState(() => addDays(monday(localDate()), 7));
  const [planDraft, setPlanDraft] = useState<Goal[]>(data.goals);

  useEffect(() => {
    const refresh = () => setToday(localDate());
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    setCalendarStart(addDays(monday(today), -7));
  }, [today]);
  useEffect(() => {
    try { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { setError('이 브라우저에서 기록을 저장할 수 없습니다. 저장 공간을 확인해주세요.'); }
    // Persist the selected starting day on the first visit, before any records exist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function save(next: Tracker): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setData(next); setError(''); return true;
    } catch {
      setError('기록을 저장하지 못했습니다. 브라우저의 저장 공간을 확인해주세요.'); return false;
    }
  }
  function record(day: string, goal: Goal, status: Status) {
    const current = localDate();
    setToday(current);
    if (!canRecord(data, day, current)) return;
    const next: Tracker = { ...data, records: { ...data.records, [day]: { ...data.records[day], [goal.id]: { status, goal: { ...goal }, updatedAt: new Date().toISOString() } } } };
    if (save(next)) setNotice(`${goal.category} ${status === 'complete' ? '완료' : '미완료'} 저장됨`);
  }
  function recordToday() {
    const date = localDate();
    const goal = goalsOn(data, date).find(g => g.id === selected) || goalsOn(data, date)[0];
    record(date, goal, data.records[date]?.[goal.id]?.status === 'complete' ? 'incomplete' : 'complete');
  }
  const goals = goalsOn(data, today);
  const active = goals.find(g => g.id === selected) || goals[0];
  const activeDone = data.records[today]?.[active.id]?.status === 'complete';
  const p = progress(data, today);
  const percentLabel = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(p.percent);
  const currentWeek = addDays(monday(today), -7);
  const allDates = Object.keys(data.records).filter(date => date >= data.startDate && date <= today).sort();

  function openSettings() { setDraft(structuredClone(data)); setSettings(true); }
  function saveSettings(event: FormEvent) {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const goals = draft.goals.map(goal => ({
      ...goal,
      title: String(form.get(`title-${goal.id}`) || goal.title).trim(),
      time: String(form.get(`time-${goal.id}`) || goal.time),
      detail: String(form.get(`detail-${goal.id}`) || '').trim(),
    }));
    if (save({ ...data, startDate: String(form.get('startDate') || draft.startDate), milestone: Number(form.get('milestone') || draft.milestone) as 7 | 30 | 90, goals })) {
      setSettings(false); setNotice('목표 설정 저장됨');
    }
  }
  function setPlanDay(day: string) { setPlanDate(day); setPlanDraft(structuredClone(data.schedule[day] || data.goals)); }
  function savePlan(event: FormEvent) {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const planned = planDraft.map(goal => ({ ...goal, time: String(form.get(`plan-${goal.id}`) || goal.time) }));
    if (save({ ...data, schedule: { ...data.schedule, [planDate]: planned } })) {
      setPlanDraft(planned); setNotice('선택한 날짜의 계획 저장됨');
    }
  }
  function changeView(next: 'today' | 'stats' | 'plan') {
    setView(next);
    if (next === 'plan') setPlanDay(addDays(monday(today), 7));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return <div className="tracker-app" data-testid="tracker-app">
    <header className="app-header">
      <div className="title-line"><h1>Habit Tracker</h1><button className="icon-button settings-button" aria-label="목표와 시작일 설정" onClick={openSettings}><GearIcon /></button></div>
      <div className="header-meta"><span data-testid="today-date">{displayDate(today)} {weekday(today)}요일</span><span className="meta-divider" /><span data-testid="day-number">{p.day ? `Day ${p.day}` : '시작 전'}</span><span className="no-end">종료일 없음</span></div>
    </header>

    {error && <div className="storage-error" role="alert">{error}</div>}

    <main className={`main-content view-${view}`}>
      {view === 'today' && <>
        <section className="schedule-section" aria-labelledby="today-heading">
          <div className="section-heading"><h2 id="today-heading">오늘 일정</h2><span className="today-count" aria-live="polite" data-testid="today-count"><strong>{doneOn(data, today)}</strong> / {goals.length} <small>완료</small></span></div>
          <div className="timeline">
            {goals.map(goal => {
              const done = data.records[today]?.[goal.id]?.status === 'complete';
              return <button key={goal.id} className={`timeline-row ${active.id === goal.id ? 'selected' : ''}`} aria-pressed={active.id === goal.id} aria-label={`${goal.category} ${goal.title} 선택`} onClick={() => setSelected(goal.id)}>
                <span className="timeline-time">{goal.time}</span><span className="timeline-dot" />
                <span className="goal-body"><span className="goal-title"><strong>{goal.category}</strong><span className="goal-separator">·</span><span>{goal.title}</span></span>{goal.detail && <span className="goal-detail"><ClockIcon />{goal.detail}</span>}</span>
                <span className={`goal-state ${done ? 'done' : ''}`}><Mark done={done} /><span>{done ? '완료' : '미완료'}</span></span>
              </button>;
            })}
          </div>
          {!p.day && <p className="subtle-note">{displayDate(data.startDate)} 시작 · 시작일 전에는 기록할 수 없습니다.</p>}
        </section>

        <section className="progress-section" aria-labelledby="progress-heading">
          <h2 id="progress-heading">진행 현황</h2>
          <div className="progress-layout">
            <div className="progress-ring" role="img" aria-label={`마일스톤 목표 달성률 ${percentLabel}%`}>
              <CircularProgressbar value={p.percent} strokeWidth={9} styles={buildStyles({ pathColor: '#078584', trailColor: '#e5e9ef', strokeLinecap: 'round', pathTransitionDuration: 0.35 })} />
              <span className="ring-label"><strong data-testid="progress-percent">{percentLabel}%</strong><small>{p.completed} / {p.total} 목표</small></span>
            </div>
            <div className="milestone-copy"><h3>{data.milestone}일 마일스톤</h3><p>진행률 <strong>{percentLabel}%</strong></p><small>{displayDate(p.from, false)} – {displayDate(p.to, false)}</small></div>
            <div className="streak-copy"><span><LightningBoltIcon /><strong>{streak(data, today)}일 연속</strong></span><small>전체 목표 완료 기준</small></div>
          </div>
        </section>

        <section className="history-section" aria-labelledby="history-heading">
          <div className="section-heading history-heading"><h2 id="history-heading">지난 기록</h2><div className="calendar-controls"><button className="icon-button" aria-label="이전 2주 기록" disabled={addDays(calendarStart, -1) < data.startDate} onClick={() => setCalendarStart(addDays(calendarStart, -14))}><ChevronLeftIcon /></button><span>{displayDate(calendarStart)} – {displayDate(addDays(calendarStart, 13), false)}</span><button className="icon-button" aria-label="다음 2주 기록" disabled={calendarStart >= currentWeek} onClick={() => setCalendarStart(addDays(calendarStart, 14))}><ChevronRightIcon /></button></div></div>
          <div className="week-labels" aria-hidden="true">{['월', '화', '수', '목', '금', '토', '일'].map(day => <span key={day}>{day}</span>)}</div>
          <div className="history-grid">{Array.from({ length: 14 }, (_, i) => {
            const day = addDays(calendarStart, i);
            const done = doneOn(data, day), count = goalsOn(data, day).length;
            const disabled = !canRecord(data, day, today);
            return <button key={day} disabled={disabled} className={`calendar-day ${day === today ? 'is-today' : ''} ${done === count ? 'all-done' : ''}`} aria-label={`${displayDate(day)} ${weekday(day)}요일, ${done}개 완료 기록 보기`} aria-current={day === today ? 'date' : undefined} onClick={() => setHistoryDate(day)}><span>{parseDate(day).getDate()}</span>{done > 0 && done < count ? <span className="day-count">{done}/{count}</span> : <Mark small done={done === count} />}</button>;
          })}</div>
          <p className="calendar-caption">날짜를 눌러 기록 확인 <span>완료 {p.completed} / {p.total} 목표</span></p>
        </section>
      </>}

      {view === 'stats' && <section className="secondary-page" aria-labelledby="stats-title">
        <div className="section-heading"><h2 id="stats-title">기록 통계</h2><span className="pill">{data.milestone}일 마일스톤</span></div>
        <p className="period-line">{displayDate(p.from)} – {displayDate(p.to)}</p>
        <div className="stat-summary"><div><strong>{percentLabel}%</strong><span>목표 달성률</span></div><div><strong>{p.completed}<small> / {p.total}</small></strong><span>완료한 목표</span></div></div>
        <h3 className="list-heading">습관별 완료 기록</h3>
        {data.goals.map(goal => {
          const done = allDates.filter(date => date >= p.from && date <= p.to && data.records[date][goal.id]?.status === 'complete').length;
          return <div className="habit-stat" key={goal.id}><div><strong>{goal.category}</strong><span>{done} / {data.milestone}회</span></div><progress value={done} max={data.milestone} /></div>;
        })}
        <div className="recent-heading"><h3>날짜별 기록</h3><span>완료 / 전체 목표</span></div>
        {allDates.length ? [...allDates].reverse().map(date => <button className="record-summary" key={date} onClick={() => setHistoryDate(date)}><span>{displayDate(date)} {weekday(date)}</span><strong>{doneOn(data, date)} / {goalsOn(data, date).length}</strong><ChevronRightIcon /></button>) : <p className="empty-state">아직 저장한 기록이 없습니다.</p>}
      </section>}

      {view === 'plan' && <section className="secondary-page" aria-labelledby="plan-title">
        <h2 id="plan-title">다음 주 계획</h2><p className="period-line">{displayDate(addDays(monday(today), 7))} – {displayDate(addDays(monday(today), 13), false)}</p>
        <div className="plan-days">{Array.from({ length: 7 }, (_, i) => {
          const day = addDays(monday(today), 7 + i);
          return <button key={day} aria-pressed={day === planDate} onClick={() => setPlanDay(day)} className={day === planDate ? 'active' : ''}><small>{weekday(day)}</small><strong>{parseDate(day).getDate()}</strong>{data.schedule[day] && <CheckIcon />}</button>;
        })}</div>
        <h3 className="list-heading">{displayDate(planDate)} 목표 배정</h3>
        <form onSubmit={savePlan}><div className="plan-goals">{planDraft.map((goal, index) => <label key={goal.id} className="plan-goal"><span><strong>{goal.category}</strong><small>{goal.title}</small></span><input aria-label={`${goal.category} 배정 시간`} name={`plan-${goal.id}`} required type="time" value={goal.time} onChange={e => setPlanDraft(planDraft.map((g, i) => i === index ? { ...g, time: e.target.value } : g))} /></label>)}</div>
        <button type="submit" className="primary-button plan-save">선택한 날짜 계획 저장</button></form>
      </section>}
    </main>

    <div className="fixed-controls">
      {view === 'today' && <div className="record-action"><button data-testid="record-button" className={`primary-button ${activeDone ? 'undo-button' : ''}`} disabled={!canRecord(data, today)} onClick={recordToday}>{active.category} {activeDone ? '미완료로 변경' : '완료로 기록'}</button></div>}
      <nav className="bottom-nav" aria-label="주요 메뉴"><button aria-current={view === 'today' ? 'page' : undefined} onClick={() => changeView('today')}><HomeIcon /><span>오늘</span></button><button aria-current={view === 'stats' ? 'page' : undefined} onClick={() => changeView('stats')}><BarChartIcon /><span>통계</span></button><button aria-current={view === 'plan' ? 'page' : undefined} onClick={() => changeView('plan')}><CalendarIcon /><span>주간 계획</span></button></nav>
    </div>
    <div className={`save-notice ${notice ? 'visible' : ''}`} role="status" aria-live="polite"><CheckCircledIcon />{notice}</div>

    <Dialog.Root open={settings} onOpenChange={setSettings}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content settings-dialog"><Dialog.Title>목표·시작일 설정</Dialog.Title><Dialog.Description>예시 목표를 원하는 내용으로 변경하세요.</Dialog.Description><Dialog.Close className="icon-button dialog-close" aria-label="설정 닫기"><Cross2Icon /></Dialog.Close><form onSubmit={saveSettings}>
      <div className="form-grid"><label>시작일<input aria-label="챌린지 시작일" name="startDate" type="date" required value={draft.startDate} onChange={e => setDraft({ ...draft, startDate: e.target.value })} /></label><label>마일스톤<select aria-label="마일스톤 기간" name="milestone" value={draft.milestone} onChange={e => setDraft({ ...draft, milestone: Number(e.target.value) as 7 | 30 | 90 })}><option value="7">7일</option><option value="30">30일</option><option value="90">90일</option></select></label></div>
      {draft.goals.map((goal, index) => <fieldset className="goal-editor" key={goal.id}><legend>{goal.category}</legend><label>오늘 목표<input aria-label={`${goal.category} 목표`} name={`title-${goal.id}`} required maxLength={50} value={goal.title} onChange={e => setDraft({ ...draft, goals: draft.goals.map((g, i) => i === index ? { ...g, title: e.target.value } : g) })} /></label><div className="form-grid"><label>예정 시간<input aria-label={`${goal.category} 예정 시간`} name={`time-${goal.id}`} required type="time" value={goal.time} onChange={e => setDraft({ ...draft, goals: draft.goals.map((g, i) => i === index ? { ...g, time: e.target.value } : g) })} /></label><label>세부 내용<input aria-label={`${goal.category} 세부 내용`} name={`detail-${goal.id}`} maxLength={40} placeholder="예: 60분" value={goal.detail} onChange={e => setDraft({ ...draft, goals: draft.goals.map((g, i) => i === index ? { ...g, detail: e.target.value } : g) })} /></label></div></fieldset>)}
      <button type="submit" className="primary-button">설정 저장</button>
    </form></Dialog.Content></Dialog.Portal></Dialog.Root>

    <Dialog.Root open={!!historyDate} onOpenChange={open => !open && setHistoryDate(null)}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content history-dialog"><Dialog.Title>지난 기록</Dialog.Title><Dialog.Description>{historyDate && `${displayDate(historyDate)} ${weekday(historyDate)}요일`}</Dialog.Description><Dialog.Close className="icon-button dialog-close" aria-label="기록 닫기"><Cross2Icon /></Dialog.Close>{historyDate && <>
      <label className="history-date-label">기록 날짜<input type="date" aria-label="기록 날짜" min={data.startDate} max={today} value={historyDate} onChange={e => { if (canRecord(data, e.target.value, today)) setHistoryDate(e.target.value); }} /></label>
      <div className="history-detail-list">{goalsOn(data, historyDate).map(goal => {
        const entry = data.records[historyDate]?.[goal.id];
        const done = entry?.status === 'complete';
        return <div className="history-detail-row" key={goal.id}><span><strong>{goal.category}</strong><small>{entry?.goal.title || goal.title}</small></span><button className={`status-toggle ${done ? 'done' : ''}`} aria-label={`${goal.category} ${done ? '미완료로 변경' : '완료로 기록'}`} onClick={() => record(historyDate, goal, done ? 'incomplete' : 'complete')}><Mark small done={done} />{done ? '완료' : '미완료'}</button></div>;
      })}</div>
      <p className="subtle-note">완료 {doneOn(data, historyDate)} / {goalsOn(data, historyDate).length} · 변경하면 바로 저장됩니다.</p>
    </>}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
