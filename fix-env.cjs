const https = require('https')
const fs = require('fs')

// Get Vercel token
const token = JSON.parse(fs.readFileSync(require('os').homedir() + '/.vercel/token.json', 'utf8')).token
const projectId = 'prj_5bGjXbqkGkqjVfKqjVfKqjVf' // We need to get this

// Actually, let's just use the vercel CLI with a file
const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://jhvrkhhsuwtsgifvkofh.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_KEGz0QArgLUH1vsWWluvbQ_M8UjUHs3'
}

// Write to .env.production.local
const content = Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n')
fs.writeFileSync('.env.production.local', content)
console.log('Created .env.production.local')
