# Zenora Mining Tracker

A simple one-page web app for Zenora miners. Built for the Kane CLI Online Hackathon.

## What it does

- **8-hour mining timer:** Start a session, watch the live countdown, Claim when it finishes, then Start again.
- **Reward log:** Add rewards (+ $ZNR and + Node Points, task name, date). Totals update automatically and are saved in the browser.
- **Daily Rewards checklist:** Check off daily tasks (claim session, check Rewards menu, and more). Progress is saved.

## How to run

No build step, no server needed.

1. Open `index.html` directly in a browser (double-click it), or
2. Serve the folder, for example:
   ```bash
   cd kane-zenora-tracker
   python3 -m http.server 8000
   ```
   Then open http://localhost:8000

Data is saved in the browser with localStorage.

## How to test manually

1. **Timer:** Click **Start Session** — the timer should start counting down from 08:00:00 and the Start button becomes disabled. Click **Test: finish session in 3 seconds** — after 3 seconds the timer shows 00:00:00 and **Claim Session** becomes enabled. Click **Claim Session** — the "Sessions claimed" count goes up by 1 and the timer resets to 08:00:00.
2. **Reward log:** Fill in task name, $ZNR, Node Points and date, then click **Add Reward**. The new entry appears in Reward History and Total $ZNR / Total Node Points update. Reload the page — the entry is still there. Click **Delete** on an entry to remove it and see the totals drop.
3. **Checklist:** Tick a task — it gets struck through and "X of 5 done" updates. Reload the page — the tick is still there. Click **Reset Checklist** to clear all ticks.

## Kane CLI flows to test (simple English)

1. **Timer flow:** "Open the app, click Start Session, verify the timer starts counting down from 08:00:00."
2. **Reward flow:** "Open the app, add a reward with task name 'Test task', 5 $ZNR and 2 Node Points, verify the totals update to 5.0 $ZNR and 2.0 Node Points."
3. **Claim flow:** "Open the app, click Test: finish session in 3 seconds, wait for the timer to reach 00:00:00, verify Claim Session becomes enabled, click Claim Session, verify the Sessions claimed count increases by 1."

See `KANE_FLOWS.md` for the full step-by-step flows.
