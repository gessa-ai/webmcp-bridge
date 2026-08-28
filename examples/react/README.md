# React integration example

`WebMcpSurface.tsx` shows the smallest React lifecycle integration: construct a
page-owned controller, reconcile the host-filtered descriptor set, forward
calls to the host invoker, and dispose every registration on context change or
unmount.

The example intentionally contains no authentication or action handler. Those
belong to the integrating application. Keep `descriptors` referentially stable
when its contents have not changed so React does not perform needless
reconciliation.
