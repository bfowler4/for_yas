# Valentine's Day Website 💕

A single-page Valentine's ask with a fleeing "No" button, growing "Yes" button, heart rain, and photo gallery.

## Features

- **Ask view**: "Yas, will you be my valentine?" with Yes and No buttons.
- **No button**: Slides away as the cursor gets closer and is unclickable.
- **Yes button**: Grows over time until clicked.
- **On Yes**: Heart emojis rain down, then a fade to a photo gallery/slideshow.

## Customize photos

Edit `index.html` and replace the `src` in each `.slide img` with your own image URLs (or paths like `images/photo1.jpg` if you add an `images` folder).

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `valentines`).
2. Push this folder to the repo:
   ```bash
   git init
   git add .
   git commit -m "Valentine site"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages** → Source: **Deploy from a branch**.
4. Branch: **main**, folder: **/ (root)**. Save.
5. The site will be at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

No build step required—plain HTML, CSS, and JS.
