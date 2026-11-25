# Kane CLI Verification Flows — Zenora Mining Tracker

These flows are written in plain English for Kane CLI. Each flow describes the app in natural language, runs it in a real browser, and returns pass or fail. All selectors below are stable element IDs in `index.html`.

App to open: `index.html` (or http://localhost:8000 when served).

---

## Flow 1 — Timer starts and counts down

**Goal:** Prove the 8-hour mining timer works end-to-end.

**Steps:**
1. Open the app.
2. Verify the timer display shows "08:00:00" and the button "Start Session" is enabled.
3. Click "Start Session".
4. Wait 3 seconds.
5. Verify the timer display no longer shows "08:00:00" — it is counting down (for example "07:59:57").
6. Verify the "Start Session" button is now disabled and the "Claim Session" button is still disabled.
7. Verify the progress text is no longer "0% complete".

**Pass if:** The timer starts at 08:00:00, counts down live after Start is clicked, Start becomes disabled, and Claim stays disabled while mining is in progress.

**Fail if:** The timer does not start, does not count down, or Claim is enabled before the session finishes.

---

## Flow 2 — Add a reward and totals update

**Goal:** Prove the reward log updates the totals and saves the entry.

**Steps:**
1. Open the app.
2. Note the current "Total $ZNR" and "Total Node Points" values at the top.
3. In the "Log Reward" form, type "Test task" in the Task name field.
4. Type "5" in the "$ZNR earned" field.
5. Type "2" in the "Node Points earned" field.
6. Pick today's date in the Date field (it is filled in by default).
7. Click "Add Reward".
8. Verify a new entry appears in "Reward History" with the text "Test task" and "+5.0 $ZNR · +2.0 pts".
9. Verify "Total $ZNR" increased by 5.0 and "Total Node Points" increased by 2.0.
10. Reload the page.
11. Verify the "Test task" entry is still in Reward History and the totals are unchanged.

**Pass if:** The entry appears, both totals increase by the exact amounts, and the entry survives a page reload (localStorage).

**Fail if:** The entry does not appear, the totals do not update, or the entry disappears after reload.

---

## Flow 3 — Finish a session and claim it (closed loop)

**Goal:** Prove the full session lifecycle works: start → finish → claim → ready again. This uses the built-in 3-second test helper so the 8-hour wait does not block verification.

**Steps:**
1. Open the app.
2. Click "Test: finish session in 3 seconds".
3. Wait 4 seconds.
4. Verify the timer display shows "00:00:00" and the status text says "Session complete!".
5. Verify the "Claim Session" button is now enabled.
6. Note the current "Sessions claimed" count at the top.
7. Click "Claim Session".
8. Verify the "Sessions claimed" count increased by 1.
9. Verify the timer display is back to "08:00:00", the "Start Session" button is enabled again, and the "Claim Session" button is disabled again.
10. Click "Start Session" and verify the timer starts counting down again.

**Pass if:** Claim becomes enabled only after the timer finishes, clicking Claim increases the claimed count by 1, and the app returns to a ready state where a new session can start.

**Fail if:** Claim is enabled early, clicking Claim does not increase the count, or a new session cannot start after claiming.

---

## Notes for the verifier

- The "Test: finish session in 3 seconds" button is a deliberate test helper, not a shortcut in the real mining flow. The normal flow is Start → wait 8 hours → Claim.
- All state (timer, rewards, checklist) is stored in localStorage under the keys `zenoraTimer`, `zenoraRewards`, `zenoraChecklist`, and `zenoraSessionsClaimed`.
- No login, no server, and no network calls are needed. The app works from a plain `file://` open or from `python3 -m http.server`.
