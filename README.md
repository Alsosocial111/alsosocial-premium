# AlsoSocial

A responsive agency website with Home, What We Do and Contact pages.

## Live website
https://alsosocial-premium.vercel.app/

## Files
- `index.html` contains the main website, styles and browser JavaScript.
- `contact/index.html` and `what-we-do/index.html` support direct subpage visits and refreshes.
- `assets/` contains local photographs and concept artwork.
- `api/contact.mjs` handles enquiry emails on Vercel.
- `vercel.json` configures routing and response headers.

## Editing
Edit index.html. Refresh the two subpage copies from the same source, retaining `<base href="/">` immediately after `<head>` in each subpage. Keep images in assets/.

## Vercel
Use Framework Preset Other, repository root as Root Directory, no build or install command, and `.` as Output Directory. Use Node.js 24.x. Changes on main should deploy to production after Git integration is connected.

## Contact email setup
The form needs these Production environment variables in Vercel:
- RESEND_API_KEY: a private sending API key.
- CONTACT_TO: the private destination email address.
- CONTACT_FROM: a sender on a domain verified in Resend.

Add actual values only in Vercel, never in this repository. Redeploy after changing variables. Verify a real enquiry arrives before relying on form delivery. If sending is not configured, the form reports that it is unavailable and displays the public contact email.

## Checks
JavaScript syntax, form validation, mocked email handler responses, responsive overflow at narrow phone/tablet widths, and live subpage refreshes were checked. Real email delivery depends on account configuration.

## Design assets
Concept mockups are illustrative, not client work or measured campaign results.
Canva concept layout: https://canva.link/it1434neq7ep1ix
Photography: Unsplash. Platform symbols identify advertised services and imply no partnership or certification.
