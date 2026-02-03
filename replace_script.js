const fs = require('fs');
const path = require('path');

const root = 'c:\\Users\\karth\\Downloads\\HMS-main_2\\my-hospital-app\\src';
const API_URL = 'process.env.NEXT_PUBLIC_API_URL';

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fp = path.join(dir, file);
        if (fs.statSync(fp).isDirectory()) {
            walk(fp);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            processFile(fp);
        }
    }
}

function processFile(fp) {
    let content = fs.readFileSync(fp, 'utf8');
    let original = content;

    // Pattern 1: Standalone string 'http://localhost:5000' or "..." (no trailing slash)
    // Replace with variable directly
    content = content.replace(/(["'])https?:\/\/localhost:5000\1/g, API_URL);

    // Pattern 2: URL with path inside quotes 'http://localhost:5000/...'
    // Replace with template literal
    content = content.replace(/(["'])https?:\/\/localhost:5000\/(.*?)\1/g, (match, quote, rest) => {
        // If the original string had ${} it implies it was already a template literal or had issues, 
        // but looking for ' or " implies simple string usually. 
        // However, if we are replacing 'http://...' with `${...}`, we convert to backtick.
        return `\`\${${API_URL}}/${rest}\``;
    });

    // Pattern 3: URL with path inside backticks `http://localhost:5000/...`
    // We need to inject the variable.
    content = content.replace(/`https?:\/\/localhost:5000\/(.*?)`/g, (match, rest) => {
        return `\`\${${API_URL}}/${rest}\``;
    });

    if (content !== original) {
        console.log('Modified:', fp);
        fs.writeFileSync(fp, content);
    }
}

console.log('Starting global replacement...');
walk(root);
console.log('Done.');
