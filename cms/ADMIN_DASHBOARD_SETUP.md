# Admin Dashboard Setup

This project now includes a lightweight admin CMS with:

- secure admin login
- server-side session cookies
- books CRUD
- blog post CRUD
- homepage content editing
- announcement banner management
- media library
- basic site settings

## Admin routes

- `/admin/login.html`
- `/admin/index.html`

All admin API routes live under:

- `/api/admin/*`

## Security model

- Admin passwords are stored as salted `scrypt` hashes in Airtable.
- Sessions use an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
- Admin API endpoints require an authenticated session.
- The first admin account is created through the bootstrap flow only when no admin users exist yet.

## Required Airtable tables

### Existing public content tables

- `Books`
- `Blog Posts`

### New admin/CMS tables

- `Admin Users`
- `Homepage Content`
- `Announcements`
- `Site Settings`
- `Media Library`
- `Subscribers`

## Airtable fields

### Admin Users

- `Email`
- `Password Hash`
- `Name`

### Homepage Content

- `Hero Headline`
- `Hero Subheadline`
- `Featured Bestseller Slug`
- `New Release Slug`
- `Category Section Text`
- `Professional Tools Text`
- `Kids & Family Text`
- `Journals & Wellness Text`
- `Organizing Text`

### Announcements

- `Text`
- `Link`
- `Active`

### Site Settings

- `Site Title`
- `Footer Text`
- `Contact Email`
- `Instagram URL`
- `Facebook URL`
- `YouTube URL`
- `Amazon Author URL`
- `TikTok URL`

### Media Library

- `Title`
- `Category`
- `Image URL`
- `Alt Text`

### Subscribers

- `Name`
- `Email`
- `Book Slug`
- `Bonus Title`
- `Bonus URL`
- `Source`
- `Subscribe Date`

## Environment variables

Set these in Vercel:

- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_BOOKS_TABLE`
- `AIRTABLE_BLOG_POSTS_TABLE`
- `AIRTABLE_ADMIN_USERS_TABLE`
- `AIRTABLE_HOMEPAGE_TABLE`
- `AIRTABLE_ANNOUNCEMENTS_TABLE`
- `AIRTABLE_SITE_SETTINGS_TABLE`
- `AIRTABLE_MEDIA_TABLE`
- `AIRTABLE_SUBSCRIBERS_TABLE`
- `ADMIN_SESSION_SECRET`
- `RESEND_API_KEY`
- `BONUS_FROM_EMAIL`

Use a long random string for `ADMIN_SESSION_SECRET`.

## First-time setup flow

1. Deploy the project.
2. Open `/admin/login.html`.
3. If no admin user exists yet, the page switches to bootstrap mode automatically.
4. Create the first admin email and password.
5. Sign in and begin managing content.

## Notes

- The dashboard currently uses image URLs rather than binary file uploads.
- That keeps the CMS lightweight and easy to run on a static + serverless stack.
- The media library provides a reusable place to store those URLs.
- Bonus delivery emails are wired for Resend when `RESEND_API_KEY` and `BONUS_FROM_EMAIL` are configured.
