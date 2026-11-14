<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d6501bff-e63b-479b-9756-de926483d792

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key.
3. Configure Supabase in `.env` using the variable names shown in [.env.example](.env.example). Use only the project's publishable/anon key; never put a `service_role` or secret key in frontend environment variables.
4. Test the Supabase Auth API connection:
   `npm run test:supabase`
5. Fetch the `etudiants` table:
   `npm run fetch:etudiants`
   Optionally, set `ETUDIANTS_COLUMNS` in `.env` to limit the returned columns (for example `id,nom,email`).
6. Run the app:
   `npm run dev`

The connection test checks whether the Supabase Auth API is reachable with the configured project URL and public key. The fetch command reads rows allowed by the table's Row Level Security (RLS) policies; it does not write data. Keep RLS enabled and use only a publishable/anon key, never a `service_role` or secret key.





URL {
  href: 'https://ekcgkvgiduigbdbvuvad.supabase.co/rest/v1/etudiants?select=*',
  origin: 'https://ekcgkvgiduigbdbvuvad.supabase.co',
  protocol: 'https:',
  username: '',
  password: '',
  host: 'ekcgkvgiduigbdbvuvad.supabase.co',
  hostname: 'ekcgkvgiduigbdbvuvad.supabase.co',
  port: '',
  pathname: '/rest/v1/etudiants',
  search: '?select=*',
  searchParams: URLSearchParams { 'select' => '*' },
  hash: ''
}

