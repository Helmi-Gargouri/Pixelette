const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const templateRoot = path.resolve(projectRoot, '..', 'artvista-HTML') // the provided template folder sibling to react-app
const publicDir = path.join(projectRoot, 'public')
const publicAssets = path.join(publicDir, 'assets')
const publicPages = path.join(publicDir, 'pages')
const srcPagesDir = path.join(projectRoot, 'src', 'pages')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  const items = fs.readdirSync(src)
  for (const item of items) {
    const s = path.join(src, item)
    const d = path.join(dest, item)
    const stat = fs.statSync(s)
    if (stat.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

// 1. Copy assets
console.log('Copying assets...')
copyDir(path.join(templateRoot, 'assets'), publicAssets)

// 2. Copy HTML pages into public/pages
if (!fs.existsSync(publicPages)) fs.mkdirSync(publicPages, { recursive: true })
const htmlFiles = fs.readdirSync(templateRoot).filter(f => f.endsWith('.html') || f.endsWith('.php'))
for (const f of htmlFiles) {
  const src = path.join(templateRoot, f)
  const dest = path.join(publicPages, f)
  fs.copyFileSync(src, dest)
}
console.log('Copied HTML pages to public/pages')

// 3. Generate simple React page components that import the page HTML and inject
if (!fs.existsSync(srcPagesDir)) fs.mkdirSync(srcPagesDir, { recursive: true })
function toComponentName(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/(^|_)([a-z])/g, (_, a, b) => b.toUpperCase())
}

for (const f of htmlFiles) {
  const name = f
  const compName = toComponentName(f.replace(/\.[^.]+$/, ''))
  const jsx = `import React from 'react'
import './_pageStyles.css'

export default function ${compName}() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/${name}?raw') }} />
}
`
  const outFile = path.join(srcPagesDir, `${compName}.jsx`)
  fs.writeFileSync(outFile, jsx)
}
console.log('Generated React page components in src/pages')

// 4. Update src/App.jsx to include routes for all pages
const appPath = path.join(projectRoot, 'src', 'App.jsx')
const routes = htmlFiles.map(f => {
  const routePath = f === 'index.html' ? '/' : '/' + f.replace(/\.html$/, '').replace(/\.php$/, '')
  const compName = toComponentName(f.replace(/\.[^.]+$/, ''))
  return `        <Route path="${routePath}" element={<${compName} />} />`
}).join('\n')

const imports = htmlFiles.map(f => {
  const compName = toComponentName(f.replace(/\.[^.]+$/, ''))
  return `import ${compName} from './pages/${compName}.jsx'`
}).join('\n')

const appContent = `import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
${imports}

export default function App() {
  return (
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
        <Link to="/">Home</Link>
      </nav>

      <Routes>
${routes}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </div>
  )
}
`
fs.writeFileSync(appPath, appContent)
console.log('Updated src/App.jsx with routes')

console.log('Conversion complete. Please run `npm install` and `npm run dev` in react-app')
