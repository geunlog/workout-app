# v1.1-CALENDAR-REVIEW-FIX

Baseline main 86b52f80e399f1dace7b352a9cd74e8c8d4458e8; reviewed candidate ad6978476b7242caf9cc95cff552091aa6745aa0, parent afd2a7bf9dedc8ea5012037e0e768cb418c0ac5c, tree e33a9f6ebc641687dc481e1912841fd9cfd40bdf. PR12 Draft, mergeable, matches instruction. PR1/2 unchanged. Existing untracked evidence/node_modules preserved.

Hypothesis: body calendar opens successfully but then dereferences a nonexistent .body-form-scroll and raises TypeError. That element belongs to the measurement editor, not this calendar. Git -S traces the statement to 0257916. Each calendar is newly created, so it has no previous scroll position to restore. Remove exactly that statement; preserve focus, date strings, local timezone handling and all other application bytes. Synchronize only app.js hash in sw.js, keep unreleased v161.

Call paths: body measurement add/edit, graph custom period, body-history date filters use dateControls -> calendar. Workout records use a separate workout-date-dialog and are unchanged.

Test: actual Chromium date-button click/Enter, calendar close/reopen, year/month controls, previous/next month, date and apply Enter, selected date persistence. Four widths 320/360/390/430, four routes per arm. A is exact reviewed candidate extracted from Git; B is current source. Assert A TypeError per calendar open and B zero exceptions, while measuring selection success separately. Add/edit save and reload, modified form cancellation, exact unrelated records/storage preserved; custom/history filters use actual calendar, never assign hidden date values.

Success: null DOM error removed, all selections correct, opens/closes successful, no pre-save changes, zero candidate overflow and errors. Stop on unexpected application/data regression. No new performance experiment; existing UI/body A/B evidence remains valid because all other app code, index/style/manifest are byte-identical.

npm test:mobile keeps existing non-benchmark regression and uses calendar-review-browser; prior full UI/body A/B stays available as test:mobile:full but is intentionally not repeated. Existing CI workflow and automated PWA gates unchanged. Local browser limitation from preceding task reused; real browser A/B executes on GitHub Actions. Android keyboard/installed PWA NOT_RUN; desktop keyboard navigation is separate. Manual offline excluded. No main/Pages/Worker/Gemini/settings change authorized or performed.
