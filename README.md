# RallyBro

Free tickets. Real friends. Game day.

## Security

### HSTS Preload

The app sends `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
To get full browser-level HSTS protection (block non-HTTPS connections before they even reach the server),
submit `rallybro.com` to the HSTS preload list:

**https://hstspreload.org**

This is a one-time, manual step that must be done after the domain is live on HTTPS.
Note: preload list inclusion is permanent — only submit once HTTPS is confirmed working.
