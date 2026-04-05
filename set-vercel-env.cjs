const { execSync } = require('child_process')

const vars = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'https://jhvrkhhsuwtsgifvkofh.supabase.co' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'sb_publishable_KEGz0QArgLUH1vsWWluvbQ_M8UjUHs3' },
]

for (const v of vars) {
  try {
    execSync(`npx vercel env add ${v.key} production <<< "${v.value}"`, { stdio: 'inherit' })
    console.log(`Set ${v.key}`)
  } catch (e) {
    console.error(`Failed to set ${v.key}`)
  }
}
