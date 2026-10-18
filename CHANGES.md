# Enhanced UrbanPulse
- Preserved original-style HTML dashboard, six land-cover brushes, four views, telemetry, and micro:bit support.
- Corrected failure propagation to use a directed graph rather than indefinitely accumulating downstream heat penalties.
- Applied fixed downtime charges on new failures and escalation only during failed simulated minutes.
- Labeled sensor irradiance as estimated; micro:bit light is a 0–255 level, not physical lux.
- Improved grid scaling, mobile stacking, focus indicators, and reduced-motion support.
- Added MODEL_ASSUMPTIONS.md with limitations and hackathon test plan.

## Peak temperature and cost update
- Flashlight shock now adds an immediate sensor-mapped heat impulse plus a decaying 12-second heating target.
- Critical Domino scenario heat forcing rises gradually (up to a modeled 26°C additional target) to reach infrastructure trip thresholds during a demonstration.
- Peak, average, health and history derive from the 64 simulated cell temperatures each tick.
- A node incurs one fixed simulated failure cost per new outage plus an escalating per-minute charge while failed.
- These forcing values and cost rates are illustrative assumptions, not calibrated measurements.

## v5 — sharper dashboard
- Render city canvas at 2–3× internal resolution for crisp labels on high-DPI displays.
- Increased temperature label size and contrast; strengthened grid borders.
- Reduced glow blur around text and infrastructure nodes.
- Improved telemetry and event log contrast without changing the mathematical engine.
- Preserved all existing formulas, costs, thresholds, and dynamic simulation logic.
