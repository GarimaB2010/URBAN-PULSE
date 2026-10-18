# UrbanPulse micro:bit and formula verification

## USB sensor setup
1. Use a BBC micro:bit v1 or v2 and a USB **data** cable.
2. Flash `microbit_firmware.py` using the micro:bit Python editor.
3. Close other serial monitors/editors that hold the serial port.
4. Open the deployed HTTPS website in desktop Chrome or Edge. Click **Connect Micro:bit**, select the device and grant permission.
5. The status changes to connected. Raw light (0–255), estimated irradiance, and solar shock change with light. A rapid light rise adds a temporary modeled heat pulse.
6. If no readings arrive, check the firmware and USB cable. On mobile, use Virtual IoT mode: Web Serial USB is not broadly supported.

The chip temperature in the status line is the micro:bit chip reading, **not** outdoor air temperature. Solar irradiance is a modeled estimate from light level, **not** a calibrated W/m² sensor measurement.

## Formulas used
- Heat diffusion: `Tnext = T + alpha*(neighborAverage - T) + landUseForcing + environmentalForcing`.
- Light mapping: `S = Smin + clamp(light,0,255)/255 * (Smax-Smin)`.
- Failures: nodes exceeding thresholds fail; directed dependencies propagate failure.
- Tree ROI: compare predicted next-step temperature with and without canopy, divided by relative cost.
- Downtime cost: add each node's fixed failure charge **once per new failure**, plus an incremental modeled cost per simulated minute while failed.
- Electricity load: `baseLoad*(1 + gamma*max(0,T-threshold))`.
- Resilience: clamped survival factor times thermal factor, in percent.

**Assumptions:** Rates, failure thresholds and pulse strength are educational model parameters. They are not measured municipal costs or calibrated forecasts.

## Test
Run `npm test` with Node.js 18+. Use the browser to verify that peak/average change with light, failures change resilience, and costs only accrue for failures. Physical USB connection has to be tested with your actual micro:bit.
