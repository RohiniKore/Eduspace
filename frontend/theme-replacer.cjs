const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Backgrounds
  { r: /bg-slate-950/g, to: 'bg-slate-50' },
  { r: /bg-slate-900\/80/g, to: 'bg-white/80' },
  { r: /bg-slate-900/g, to: 'bg-white' },
  { r: /bg-slate-800\/50/g, to: 'bg-slate-100/50' },
  { r: /bg-slate-800\/60/g, to: 'bg-slate-100/60' },
  { r: /bg-slate-800\/70/g, to: 'bg-slate-100/70' },
  { r: /bg-slate-800/g, to: 'bg-slate-100' },
  { r: /bg-slate-700/g, to: 'bg-slate-200' },
  { r: /bg-slate-600/g, to: 'bg-slate-300' },

  // Borders
  { r: /border-slate-800\/60/g, to: 'border-slate-200/60' },
  { r: /border-slate-800/g, to: 'border-slate-200' },
  { r: /border-slate-700\/50/g, to: 'border-slate-300/50' },
  { r: /border-slate-700/g, to: 'border-slate-300' },
  { r: /border-slate-600/g, to: 'border-slate-400' },

  // Text
  { r: /text-slate-100/g, to: 'text-slate-900' },
  { r: /text-slate-200/g, to: 'text-slate-800' },
  { r: /text-slate-300/g, to: 'text-slate-700' },
  { r: /text-slate-400/g, to: 'text-slate-600' },
  { r: /text-slate-500/g, to: 'text-slate-500' },
  
  // Custom specific
  { r: /bg-white\/5/g, to: 'bg-slate-900/5' },
  { r: /border-white\/10/g, to: 'border-slate-900/10' },
  
  // Hover & other utilities
  { r: /hover:bg-slate-800/g, to: 'hover:bg-slate-100' },
  { r: /hover:bg-slate-700/g, to: 'hover:bg-slate-200' },
  { r: /hover:text-slate-300/g, to: 'hover:text-slate-700' },
  { r: /hover:text-slate-100/g, to: 'hover:text-slate-900' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const rep of replacements) {
        content = content.replace(rep.r, rep.to);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir(srcDir);
