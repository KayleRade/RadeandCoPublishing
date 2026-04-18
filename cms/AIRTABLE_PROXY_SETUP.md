# Airtable Proxy Deployment

This site now includes a serverless Airtable proxy scaffold in:

- `api/cms/books.js`
- `api/cms/blog-posts.js`
- `api/cms/_airtable.js`

This is designed for platforms like Vercel that support serverless functions.

## Important limitation

The Airtable invite link is **not** enough to power the API connection by itself.

You will still need:

- an Airtable Personal Access Token
- the Airtable Base ID

The invite link is useful for opening or sharing the base manually:

- https://airtable.com/invite/l?inviteId=invQciVTjyMSxIsTg&inviteToken=c42816bc5bde852724f8c6aed11e7b206581edf2bc2c648a91517ce5672890e2&utm_medium=email&utm_source=product_team&utm_content=transactional-alerts

## Environment variables

Set these in your deployment platform:

- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_BOOKS_TABLE`
- `AIRTABLE_BLOG_POSTS_TABLE`

Use `.env.example` as the reference.

## Frontend switch

When the proxy is live, update:

- `assets/js/site-config.js`

Change:

- `contentProvider: "auto"`

to:

- `contentProvider: "airtable-proxy"`

And set:

- `proxyBaseUrl: "/api/cms"`

## Proxy endpoints

The frontend content adapter expects:

- `/api/cms/books`
- `/api/cms/blog-posts`

If you keep the included Vercel structure, those endpoints will work without changing page templates.

## Airtable field mapping

### Books

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

Optional fields supported by the proxy if you add them later:

- `Who This Book Is For`
- `Problem It Solves`
- `Reader Outcome`
- `Review Headline`
- `Review Snippet`

### Blog Posts

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

Optional fields:

- `Featured`
- `CTA Heading`
- `CTA Copy`

## Manual Amazon workflow

Automatic extraction from Amazon is not implemented.

For each book, paste these values manually into Airtable:

- `Amazon URL`
- `Cover Image`
- `Title`
- `Short Description`
- optional `Rating`
- optional `Review Count`

That keeps the content entry process simple and admin-friendly.

## Suggested deploy path

1. Push this site to GitHub.
2. Import the repo into Vercel.
3. Add the Airtable environment variables.
4. Switch `site-config.js` to `airtable-proxy`.
5. Redeploy.

The Books page, individual book pages, homepage featured shelves, blog listing, and blog post pages are already structured to use this shared content layer.
