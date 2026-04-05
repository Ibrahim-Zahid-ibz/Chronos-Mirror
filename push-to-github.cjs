const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO = 'SikandarMirza/chronos-mirror';
const TOKEN = process.env.GITHUB_TOKEN;
const BASE_DIR = 'F:\\Need For Speed The Run\\chronos-mirror';

function api(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'api.github.com',
      path: '/repos/' + REPO + urlPath,
      method,
      headers: {
        'Authorization': 'token ' + TOKEN,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'upload',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, data: d.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function getFiles(dir, baseDir) {
  const files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item === 'node_modules' || item === '.next' || item === '.vercel' || item === '.git') continue;
      files.push(...getFiles(fullPath, baseDir));
    } else {
      files.push({ path: relPath, fullPath });
    }
  }
  return files;
}

async function main() {
  console.log('Getting file tree...');
  const files = getFiles(BASE_DIR, BASE_DIR);
  console.log(`Found ${files.length} files to upload`);

  // Create blobs for all files
  console.log('Creating blobs...');
  const tree = [];
  for (const file of files) {
    const content = fs.readFileSync(file.fullPath);
    const blobResp = await api('POST', '/git/blobs', {
      content: content.toString('base64'),
      encoding: 'base64'
    });
    if (blobResp.status >= 400) {
      console.error(`Error creating blob for ${file.path}:`, JSON.stringify(blobResp.data).substring(0, 200));
      continue;
    }
    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blobResp.data.sha });
    console.log(`  ${file.path}`);
  }

  // Create tree
  console.log('Creating tree...');
  const treeResp = await api('POST', '/git/trees', { tree });
  if (treeResp.status >= 400) {
    console.error('Tree error:', JSON.stringify(treeResp.data).substring(0, 300));
    return;
  }
  console.log('Tree created:', treeResp.data.sha);

  // Create commit
  console.log('Creating commit...');
  const commitResp = await api('POST', '/git/commits', {
    message: 'Initial commit: Chronos Mirror - Self-Evolving Life Audit App',
    tree: treeResp.data.sha,
    parents: [] // No parent since repo was just created with auto_init
  });
  if (commitResp.status >= 400) {
    console.error('Commit error:', JSON.stringify(commitResp.data).substring(0, 300));
    return;
  }
  console.log('Commit created:', commitResp.data.sha);

  // Update branch
  console.log('Updating main branch...');
  const updateResp = await api('PATCH', '/git/refs/heads/main', {
    sha: commitResp.data.sha,
    force: true
  });
  if (updateResp.status >= 400) {
    console.error('Update error:', JSON.stringify(updateResp.data).substring(0, 300));
    return;
  }
  console.log('Branch updated!');
  console.log('https://github.com/SikandarMirza/chronos-mirror');
}

main().catch(console.error);
