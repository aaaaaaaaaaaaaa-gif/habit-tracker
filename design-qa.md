# Habit Tracker · STEP 4 QA

final result: passed

## Target and browser evidence

- Source visual truth path: `qa/reference.png`, copied unchanged from the second displayed Image Gen result `exec-28d645e6-5d37-4ea2-9b82-b1410afc4100.png`.
- Browser-rendered implementation screenshot: inline CUA capture in this Work conversation, cloud tab 5, `http://terminal.local:4173/qa/mobile.html`. The tool returned the image inline, without a filesystem export path. The comparison harness is retained at `qa/mobile.html` for reproduction; it is excluded from the production entry/build.
- Full-view comparison evidence: the source and live implementation were rendered adjacent in the SAME browser screenshot, not two separately viewed images. Source 853 × 1844 pixels normalized to 390 × 844 CSS pixels; live iframe 390 × 844 CSS pixels. Native desktop scrollbar leaves 375 pixels of app width. No raster scaling of the app; the app is real HTML/CSS/React.
- Desktop viewport: 1363 × 936; responsive content 760 pixels wide. Mobile iframe viewport: 390 × 844. No horizontal overflow: app scrollWidth = app width = 375. Record button 347 × 48.64 CSS pixels; nav targets at least 64 pixels high.
- State: local date 2026-10-29 Thursday, chosen start 2026-10-18 produces Day 12, study selected, workout complete, hobby incomplete. One historical completion was added through the calendar during QA. Production origin has no injected demo completion history.
- Focused-region review: timeline labels, statuses, ring and bottom action were legible in the combined full-view screenshot. A separate cropped screenshot attempt timed out; it was not used as evidence or claimed as a saved image.

## Required fidelity surfaces

- Typography: locally bundled Noto Sans KR matches the clean Korean sans-serif direction. Hierarchy retains title, section headings, category labels, secondary goal text, compact metadata. No clipping of goal labels or record button.
- Spacing/layout: chosen timeline → progress ring/streak → two-week history → pinned recording action → navigation order is preserved. Native page scrolling is available. Minor mobile vertical spacing differences remain P3; history can require a small scroll. Persistent record/navigation controls remain visible and usable.
- Colors/tokens: white surface, dark graphite type, teal selected outline/fill, teal completed indicators, gray uncompleted indicators and date cells. Semantic labels supplement color.
- Images/assets: selected target has no required raster illustration. Standard Radix icon library and a circular progress component are used. No device frames/status bars/home indicators; DOM check found zero such runtime chrome nodes. Original template runtime files/assets are retained unused, per the user's explicit web-only runtime override in AGENTS.md.
- Copy/content: source's fixed Day/progress/streak/history values are replaced by actual local date and saved-record calculations. The motivational sentence in the generated source is removed as explicitly requested. End date remains unlimited; percentages describe the current 7/30/90-day milestone, not lifetime elapsed time.

## Core interaction evidence

1. Opened the real app in cloud browser. Local date displays 2026.10.29 Thursday; new state is Day 1.
2. Tapped study record at 390px viewport: count 0/3 → 1/3; milestone progress 0% → 1.1% (1/90 goals).
3. Reloaded the page: count 1/3 and 1.1% persisted. Tapped again: state changed to incomplete and progress returned to zero.
4. Changed starting date through the settings form. Initial verification found native date input value not reaching the saved React draft. Fixed save to read validated native FormData. Re-tested: 2026-10-18 persists and Day 12 displays correctly.
5. Selected workout and recorded completion. Primary CTA changes to the selected habit; undo is available.
6. Opened calendar 2026-10-28, recorded hobby complete, closed and reloaded: historical count remains 1/3 and overall milestone progress becomes 2.2% (two actual stored completions).
7. Future 2026-10-30 calendar button is disabled. Both UI and data write guard prevent future records.
8. Statistics navigation shows actual 2/90 stored completions and habit totals. Weekly-plan navigation opens date/time assignment and its save action works.
9. Runtime integrity, TypeScript build and Sites Worker tests pass. A bounded Node assertion run verified month rollover (Oct31→Nov1), year rollover (Dec31→Jan1), record-based progress and future-date guard.
10. Browser console inspection showed extension metadata errors under `chrome-extension://…`; no app errors were observed in the rendered workflow. Extension messages are not attributed to the app.

## Findings and comparison history

- Fixed: starting date save used a stale draft for native date input. FormData save verified the new date and Day number.
- Fixed: first mobile layout placed extra vertical spacing above history. One compact spacing pass retained the source hierarchy and accessible record action.
- Accepted product differences: fresh user data is empty; actual percentages and streak differ from the source's invented 40%/4-day data. Data is not fabricated to match the mock.
- P3 follow-up only: mobile history density, exact icon fill and small typography/spacing refinements can be considered in STEP 5. Per user scope no repeated fine-design iterations were run.

## Handoff boundary

Core MVP uses only browser localStorage. Records are device/browser/origin-specific. Advanced project lifecycle/timers, detailed workout measurements, photo archive and reminder notifications are outside this core five-feature implementation. No GitHub or Vercel publication is performed. The verified build is handed to authorized private Sites preview hosting.
