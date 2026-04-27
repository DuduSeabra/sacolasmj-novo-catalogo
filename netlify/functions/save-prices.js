exports.handler = async (event) => {
  const json = (status, body) => ({
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  let prices;
  try {
    prices = JSON.parse(event.body).prices;
  } catch {
    return json(400, { error: "JSON inválido" });
  }
  if (!prices) return json(400, { error: "Preços ausentes no body" });

  const ghToken = process.env.GH_TOKEN;
  const owner   = process.env.GH_OWNER;
  const repo    = process.env.GH_REPO;
  const branch  = process.env.GH_BRANCH || "main";

  if (!ghToken || !owner || !repo) {
    return json(500, { error: "Variáveis de ambiente não configuradas no Netlify" });
  }

  const ghHeaders = {
    Authorization: `Bearer ${ghToken}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  // Get current file SHA
  const getRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/prices.json?ref=${branch}`,
    { headers: ghHeaders }
  );
  if (!getRes.ok) {
    const err = await getRes.json().catch(() => ({}));
    return json(502, { error: err.message || "Erro ao acessar GitHub" });
  }
  const { sha } = await getRes.json();

  // Commit updated prices
  const content = Buffer.from(JSON.stringify(prices, null, 2) + "\n").toString("base64");
  const putRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/prices.json`,
    {
      method: "PUT",
      headers: ghHeaders,
      body: JSON.stringify({
        message: "Atualiza tabela de preços via admin",
        content,
        sha,
        branch,
      }),
    }
  );
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return json(502, { error: err.message || "Erro ao commitar" });
  }

  return json(200, { ok: true });
};
