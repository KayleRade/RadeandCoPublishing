# Hostinger VPS Deployment

This site needs a real backend because the admin dashboard and Airtable APIs do not work on GitHub Pages.

## 1. Connect to your VPS

```bash
ssh root@72.62.160.184
```

## 2. Clone the repo

```bash
cd /opt
git clone https://github.com/KayleRade/RadeandCoPublishing.git radeco-site
cd /opt/radeco-site
```

If the folder already exists:

```bash
cd /opt/radeco-site
git pull origin main
```

## 3. Create the production env file

Create `/opt/radeco-site/.env` with your real values:

```env
AIRTABLE_PAT=your_airtable_personal_access_token
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_BOOKS_TABLE=Books
AIRTABLE_BLOG_POSTS_TABLE=Blog Posts
AIRTABLE_ADMIN_USERS_TABLE=Admin Users
AIRTABLE_HOMEPAGE_TABLE=Homepage Content
AIRTABLE_ANNOUNCEMENTS_TABLE=Announcements
AIRTABLE_SITE_SETTINGS_TABLE=Site Settings
AIRTABLE_MEDIA_TABLE=Media Library
AIRTABLE_SUBSCRIBERS_TABLE=Subscribers
ADMIN_SESSION_SECRET=replace_with_a_long_random_secret
ADMIN_COOKIE_SECURE=false
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
BONUS_FROM_EMAIL=hello@yourdomain.com
```

## 4. Start the site container

```bash
docker compose up -d --build
```

The site will then run at:

`http://YOUR_SERVER_IP:3000`

## 5. Point a domain or subdomain to the container

If you use your own reverse proxy or Traefik, route your chosen domain to:

`radeco-site:3000`

If you want to test first, open:

`http://72.62.160.184:3000`

## 6. Create the first admin login

Open:

`http://YOUR_DOMAIN/admin/login.html`

Then use your first admin credentials to bootstrap the admin account.

## 7. After HTTPS is live

Once your real domain is working over HTTPS, switch:

```env
ADMIN_COOKIE_SECURE=true
```

Then restart:

```bash
docker compose up -d --build
```

## Notes

- GitHub Pages can still host the public static site, but the admin login only works here on the VPS deployment.
- If you want me to tailor this for your existing Hostinger Traefik/n8n setup, the next step is to paste the output of:

```bash
docker ps
docker network ls
docker inspect n8n-traefik-1
```
