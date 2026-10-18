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

## v7: thermal palette, animated infrastructure, readable events
- Thermal view uses calibrated *display colors* (green at mild temperatures, amber/orange at 34–40°C, red above 43°C). No simulation formula was changed for the palette.
- Infrastructure circles pulse and network links show animated flow particles using requestAnimationFrame. Animation is visual only.
- Event log now distinguishes INFO, WARNING and CRITICAL events; startup event always appears and 10-second high-heat alerts are recorded.
- Existing micro:bit and mathematical formulas are preserved.

## v8 — animated connected infrastructure
- Stronger luminous directed links between SUB-A, PUMP-N, HOSP-1, DATA-1, PUMP-S and SUB-B.
- Three continuously moving light packets per connection, including reversed red motion for failed links.
- Double pulsing halos on infrastructure circles.
- All existing heatmap colors, sensor integration and formulas retained.


## v9: Plain thermal heatmap
Thermal Heatmap view displays only the colored temperature cells and their numeric temperatures, without land-cover emojis, coordinate labels, utility circles, or animated network links. Hybrid and Network views retain animated circles and connections.
