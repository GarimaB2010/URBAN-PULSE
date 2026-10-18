# UrbanPulse  — Heatmap and Formula Verification

## Heatmap
- Thermal Heatmap and Dual Overlay now share a continuous cold-to-hot palette: **blue → cyan → teal → green → yellow → orange → red → dark red**.
- The on-screen legend is generated from the same exact temperature/color stops used by the canvas, spanning **22–65°C**. Temperatures outside that interval use the endpoint color (numbers continue changing).
- Network view and Land Cover keep their own palettes; offline utilities turn red in Land Cover and in the animated network.

## Mathematics
The seven models remain in `js/formulas.js` and are integrated with the simulation in `js/main.js`:
1. Heat diffusion updates all 64 temperatures on each simulation tick.
2. Micro:bit light levels map to estimated solar input and simulated heating.
3. Thermal thresholds and directed dependency graph trigger infrastructure failures.
4. Greedy tree ROI compares recalculated temperature predictions on copies of the grid.
5. Initial outage charges and per-minute costs accumulate while nodes are offline; heat-exposure impact is reported separately.
6. Electric load increases above the assumed temperature threshold.
7. Weighted Grid Health combines infrastructure, average heat, and hotspots.

**Model limitations:** The parameters are educational assumptions, not calibrated weather forecasts. The tree optimizer is a one-step thermal forecast, not an experimentally validated long-term cooling prediction. The physical micro:bit USB connection and full browser interactions must be tested on your demonstration computer. Passing unit tests does not verify hardware.

## Tests
Run `npm test` from the project folder. The suite includes explicit tests for each of the seven formulas and thermal color mapping.
