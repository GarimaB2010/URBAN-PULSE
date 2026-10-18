# v14 Failure Event Stream fix

- Active failures appear as persistent red cards above the event history in All and Failures filters.
- Each card shows the node, failure reason, live temperature, failure threshold, fixed estimated cost, and escalation rate.
- Clicking a card selects its infrastructure node.
- Historic failure, warning, and recovery events remain in the event stream.
- Event cards are no longer recreated on every animation frame, reducing visual flicker and DOM work.
- Financial amounts and failure thresholds are illustrative model assumptions.

To test: start the DOMINO_CASCADE_CRITICAL scenario, increase solar intensity or activate the flashlight shock, and watch the event stream. Check both All and Failures filters.
