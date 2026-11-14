import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.PublishablekeySupperbase;

if (!supabaseUrl || !publishableKey) {
  console.error(
    "Configuration manquante. Définissez SUPABASE_URL et SUPABASE_PUBLISHABLE_KEY dans .env.",
  );
  process.exitCode = 1;
} else {
  let endpoint;

  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Protocole invalide");
    }
    endpoint = `${url.origin}${url.pathname.replace(/\/+$/, "")}/auth/v1/settings`;
  } catch {
    console.error("SUPABASE_URL doit être une URL HTTP(S) valide.");
    process.exitCode = 1;
  }

  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        headers: { apikey: publishableKey },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        console.error(
          `Échec de connexion Supabase (HTTP ${response.status}). Vérifiez l’URL et la clé publique.`,
        );
        process.exitCode = 1;
      } else {
        console.log("Connexion Supabase réussie (Auth API accessible).");
      }
    } catch {
      console.error(
        "Impossible de joindre Supabase. Vérifiez votre connexion réseau et SUPABASE_URL.",
      );
      process.exitCode = 1;
    }
  }
}
