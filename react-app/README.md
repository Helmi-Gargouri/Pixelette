# ArtVista React Starter

This is a lightweight Vite + React scaffold to migrate the provided static HTML template into a React app.

What I added
- Vite project files: `package.json`, `vite.config.js`, `index.html`
- React entry: `src/main.jsx`
- Router and loader: `src/App.jsx`, `src/components/TemplatePage.jsx`
- Example pages: `src/pages/Home.jsx`

Quick start

1. From the repository root, open a terminal and install dependencies:

```powershell
cd react-app; npm install
```

2. Copy the original template static assets into `react-app/public` so the app can serve CSS, images and the original HTML pages. For example, copy the existing `assets/` folder and the HTML files into `react-app/public` as:

```
react-app/public/assets/...
react-app/public/pages/about.html
react-app/public/pages/index.html
... other pages
```

You can create a `pages/` directory inside `public/` and put the original HTML pages there. The `TemplatePage` component fetches from `/pages/<pagename>`.

3. Run the dev server:

```powershell
npm run dev
```

Next steps
- Replace `TemplatePage` with React components for header, footer, and content.
- Convert shared elements into components and import the original CSS from `/assets/css/style.css` in `src/styles.css`.
