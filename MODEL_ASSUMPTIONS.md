# UrbanPulse model assumptions and verification

This is a **prototype digital twin**, not a calibrated city forecast. The seven formulas are implemented in `js/formulas.js` and unit-tested in `tests/formulas.test.mjs`.

- Grid: 8×8 (64 cells); simulation time is 1 second per tick, speed controls accelerate simulated time.
- Heat diffusion: 4-neighbor stencil, alpha=0.20 (documented example). Additional environmental relaxation, land-use heating, and wind coefficients are reconstructed assumptions.
- Sensor: micro:bit light is **relative brightness 0–255**, not a calibrated lux meter. The solar W/m² display is an **estimated linear mapping**, not measured irradiance.
- Failures: thermal threshold `T > threshold`, with directed power→pump→hospital cascading shutdown. No permanent failure latching; nodes recover when conditions are safe.
- Economics: simulated base dispatch costs plus escalation cost per simulated minute, not sourced city financial data. Fixed charge is applied once per failure transition; escalation applies only during downtime.
- Greedy tree optimizer evaluates one-step predicted city temperature changes, not a trained machine-learning model. Its cost is a relative unit.
- Resilience: composite formula measures model node survival and average thermal stress, not an officially validated urban resilience index.
- Node thresholds, cost values, load sensitivity, and scenario forcing are educational assumptions, unless otherwise noted in the interface.
- The original deployed JavaScript was unavailable. This code is a reconstruction of the provided specification and original-style UI, **not a byte-for-byte copy**.

## Judge demo
1. Open the site and check that the grid and live metrics render.
2. Switch to Critical Domino; watch peak/average temperatures change and failure costs rise after a failure.
3. Pause; verify simulation-driven values stop updating.
4. Reset; demonstrate tree placement and the optimizer.
5. Open Formulas to explain the math; run `npm test` to demonstrate deterministic tests.
