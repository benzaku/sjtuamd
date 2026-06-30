# Publishing Articles

New articles live in `content/articles` as Markdown files. They are included in
the home page, news archive, and article detail pages at build time.

## Add an Article

1. Copy `content/articles/_example.md`.
2. Rename it, for example `2026-07-01-summer-meetup.md`.
3. Fill in the frontmatter.
4. Put images in `public/uploads/articles`.
5. Run `npm run build`.

## Frontmatter

```md
---
title: 文章标题
date: 2026-07-01
slug: 2026-summer-meetup
excerpt: 这段文字会显示在新闻列表里。
image: /uploads/articles/summer-meetup.jpg
imageAlt: 活动现场合影
published: true
---
```

Required fields:

- `title`
- `date`, unless the filename begins with `YYYY-MM-DD`

Optional fields:

- `slug`: page URL. If omitted, the filename is used.
- `excerpt`: summary text for cards and metadata.
- `image`: lead image path from `public`.
- `imageAlt`: image alt text.
- `published: false` or `draft: true`: hide the article from the build.

The article URL will be `https://your-domain/<slug>`.
