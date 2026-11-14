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
      throw new Error("SUPABASE_URL doit utiliser HTTP ou HTTPS.");
    }

    endpoint = new URL(
      `${url.pathname.replace(/\/+$/, "")}/rest/v1/etudiants`,
      url.origin,
    );
    endpoint.searchParams.set("select", process.env.ETUDIANTS_COLUMNS ?? "*");
  } catch {
    console.error("SUPABASE_URL doit être une URL HTTP(S) valide.");
    process.exitCode = 1;
  }

  if (endpoint) {
    let response;
    try {
      response = await fetch(endpoint, {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      const message =
        error instanceof Error && error.name === "TimeoutError"
          ? "Délai dépassé lors de la lecture de la table etudiants."
          : "Impossible de joindre Supabase pour lire la table etudiants.";
      console.error(message);
      process.exitCode = 1;
    }

    if (response && !response.ok) {
      console.error(
        `Échec de lecture de la table etudiants (HTTP ${response.status}). Vérifiez les permissions RLS et l’existence de la table.`,
      );
      process.exitCode = 1;
    } else if (response) {
      let students;
      try {
        students = await response.json();
      } catch {
        console.error("La réponse Supabase ne contient pas de JSON valide.");
        process.exitCode = 1;
      }

      if (Array.isArray(students)) {
        console.log(JSON.stringify(students, null, 2));
        console.log(endpoint)
        console.error(`${students.length} étudiant(s) récupéré(s).`);
      } else if (students !== undefined) {
        console.error("La réponse Supabase n’est pas une liste.");
        process.exitCode = 1;
      }
    }
  }
}
