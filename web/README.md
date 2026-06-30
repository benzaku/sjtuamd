# SJTUAMD Web

Modern static rebuild of the legacy Drupal/PHP site for deployment on Vercel.

## Local Workflow

```bash
npm install
npm run extract
npm run dev
```

The extractor reads the Drupal SQL dump from `../database/68970m55641_1.sql` and legacy files from `../files/htdocs-lftp/drupal-7.12/sites/default/files`.

## Publishing New Articles

New articles are Markdown files in `content/articles`. Copy
`content/articles/_example.md`, rename it with a date prefix, edit the
frontmatter and body, then run `npm run build`.

Article images should go in `public/uploads/articles` and be referenced as
`/uploads/articles/file-name.jpg`.

See `content/README.md` for the full publishing format.

## Deployment

Deploy the `web/` directory to Vercel. The app is a Next.js static-first site and does not require PHP or a MySQL database at runtime.
