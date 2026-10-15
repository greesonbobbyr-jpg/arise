# Test-only vendored code

`jsQR.js` — jsQR 1.4.0 by Cosmo Wolfe (https://github.com/cozmo/jsQR), Apache License 2.0 (see `jsQR.LICENSE`).
Used only by the browser tests to decode the QR code the app draws and confirm it opens the exact link.
It is never loaded by the app and is not in the service worker cache.
