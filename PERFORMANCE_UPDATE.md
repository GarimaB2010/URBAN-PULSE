# Performance update (v12)

- Cap the grid canvas device pixel ratio at 2 instead of forcing 2–3x resolution. This lowers canvas pixel processing while preserving crisp rendering on standard and Retina displays.
- Limit the decorative grid animation to approximately 20 frames per second instead of ~30.
- Skip decorative grid painting while the tab is hidden.
- Keep the mathematical simulation and micro:bit sampling schedules unchanged; no formulas or telemetry calculations have been removed.

This is a lightweight optimization, not a benchmark. Performance on the target presentation computer should still be tested.
