# Airtable Content Setup

This site is now structured around a content layer that can use:

- `local` content for safe static hosting and local previews
- `airtable-proxy` later, with minimal redesign
- `auto` to try the proxy first and fall back to local content if the proxy is unavailable

The current site intentionally does **not** call Airtable directly from the browser. That keeps Airtable personal access tokens out of public frontend code.

## Current architecture

- Local source:
  - `assets/js/book-library.js`
  - `assets/js/blog-library.js`
- Shared content config:
  - `assets/js/site-config.js`
- Shared content adapter:
  - `assets/js/content-store.js`

To switch later, update `window.RADE_SITE_CONFIG.contentProvider` to:

- `auto`
- `local`
- `airtable-proxy`

If using `airtable-proxy`, set:

- `window.RADE_SITE_CONFIG.airtable.proxyBaseUrl`

Expected endpoints:

- `/api/cms/books`
- `/api/cms/blog-posts`
- `/api/cms/site-content`

These endpoints should return arrays already shaped like the local content model, or close enough for the normalizer in `content-store.js`.

## Books table

Create an Airtable table named `Books` with these fields:

- `Title`
- `Category`
- `Amazon URL`
- `Cover Image`
- `Short Description`
- `Long Description`
- `Rating`
- `Review Count`
- `Featured`
- `New Release`
- `Series`
- `Author`
- `Slug`

Recommended additional optional fields for the current site:

- `Hero Stat 1`
- `Hero Stat 2`
- `Who This Book Is For`
- `Problem It Solves`
- `Reader Outcome`
- `Review Headline`
- `Review Snippet`

## Blog Posts table

Create an Airtable table named `Blog Posts` with these fields:

- `Title`
- `Category`
- `Featured Image`
- `Excerpt`
- `Body Content`
- `Author`
- `Publish Date`
- `Reading Time`
- `Slug`
- `Related Book`

Recommended additional optional fields for the current site:

- `Featured`
- `Intro`
- `CTA Heading`
- `CTA Copy`

## Admin workflow for Amazon links

For each book entry, paste these values manually into Airtable:

- `Amazon URL`
- `Cover Image`
- `Title`
- `Short Description`
- optional `Rating`
- optional `Review Count`

Automatic extraction from Amazon is **not** implemented in this site architecture. Manual entry is the cleanest and most reliable approach here.

## Why the Airtable connection is staged

For a static site, direct Airtable calls from frontend JavaScript would require exposing credentials or relying on fragile public workarounds. The safer path is:

1. Keep the current local content source for design and development.
2. Add a lightweight backend or serverless proxy later.
3. Point `proxyBaseUrl` at that endpoint.
4. Leave the page templates and rendering logic unchanged.

## Minimal future connection path

When you are ready to connect Airtable:

1. Create a Personal Access Token in Airtable with read access to the base.
2. Build a small serverless function that reads `Books` and `Blog Posts`.
3. Normalize Airtable fields into the same shape used by `content-store.js`.
4. Return JSON from:
   - `/api/cms/books`
   - `/api/cms/blog-posts`
   - `/api/cms/site-content`
5. Switch `contentProvider` to `airtable-proxy`.

That lets the site become CMS-driven without redesigning the homepage, books page, book pages, blog listing, or blog post pages.
