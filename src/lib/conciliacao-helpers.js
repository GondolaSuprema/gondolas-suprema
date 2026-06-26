// Helpers compartilhados pelos endpoints de conciliação.

// Detecta lançamentos que devem ser AUTOMATICAMENTE ignorados conforme
// as regras do Ale:
// - Transferências internas entre Gôndolas Suprema ↔ Suprema Instalações
// - PIX enviados/recebidos do Alessandro Thonsen (movimento pessoal)
// - PIX com Wiliam Zanella (sócio, reembolso pessoal)
//
// Retorna {ignorar: true, motivo: '...'} ou {ignorar: false}.
export function detectarIgnorar(descricao) {
  const d = String(descricao || "").toLowerCase();
  if (d.includes("alessandro thonsen")) {
    return { ignorar: true, motivo: "PIX pessoal do Alessandro" };
  }
  if (d.includes("gondolas suprema") || d.includes("gôndolas suprema")) {
    return { ignorar: true, motivo: "Transferência interna (Gôndolas Suprema)" };
  }
  if (d.includes("suprema instalacoes") || d.includes("suprema instalações")) {
    return { ignorar: true, motivo: "Transferência interna (Suprema Instalações)" };
  }
  if (d.includes("wiliam zanella") || d.includes("willian zanella")) {
    return { ignorar: true, motivo: "Reembolso pessoal do sócio Zanella" };
  }
  return { ignorar: false };
}

// Compara dois valores com tolerância de 1 centavo (arredondamento).
export function valoresIguais(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.01;
}

// Heurística: classifica tipo+categoria de uma despesa a partir do texto
// da descrição do extrato. Espelha a função `inferirTipoDespesa` do
// frontend, mas adicionando padrões específicos do extrato (postos,
// pedágios, fornecedores recorrentes).
export function inferirTipoCategoria(descricao) {
  const n = String(descricao || "").toLowerCase();

  // Fornecedores recorrentes
  if (/\brre\b/.test(n) || n.includes("rre maquinas") || n.includes("rre máquinas")) {
    return { tipo: "CMV", categoria: "Fornecedores Gôndolas" };
  }
  if (n.includes("imperio das gondolas") || n.includes("império das gôndolas")) {
    return { tipo: "CMV", categoria: "Fornecedores Gôndolas" };
  }
  if (n.includes("fibrasul")) {
    return { tipo: "CMV", categoria: "Fornecedores MDF" };
  }
  if (n.includes("doutor diesel")) {
    return { tipo: "DESPESA_LOGISTICA", categoria: "Manutenção Veículos" };
  }

  // Impostos
  if (n.includes("simples") || n.includes("das ") || n.includes("cef")) {
    return { tipo: "DEDUCAO_RECEITA", categoria: "Simples Nacional (DAS)" };
  }
  if (n.includes("icms")) return { tipo: "DEDUCAO_RECEITA", categoria: "ICMS" };

  // Anúncios
  if (n.includes("facebook") || n.includes("meta ads") || n.includes("instagram")) {
    return { tipo: "DESPESA_VENDAS", categoria: "Tráfego Pago" };
  }
  if (n.includes("google ads")) {
    return { tipo: "DESPESA_VENDAS", categoria: "Tráfego Pago" };
  }

  // Marketplace / loja
  if (n.includes("shpp brasil") || n.includes("shopee")) {
    return { tipo: "DESPESA_VENDAS", categoria: "Ferramentas Comerciais" };
  }

  // Combustível / postos / pedágios / lanche em rota
  if (
    n.includes("pista 4") || n.includes("pista 3") || n.includes("auto posto") ||
    n.includes("postos oficinas") || n.includes("posto rota") || n.includes("posto sulcar") ||
    n.includes("angeloni posto") || n.includes("posto torneg") || n.includes("posto") ||
    n.includes("autopista litoral") || n.includes("viacosteira") || n.includes("viasul") ||
    n.includes("selau e vaz") || n.includes("autopista")
  ) {
    return { tipo: "DESPESA_LOGISTICA", categoria: "Veículos" };
  }

  // Alimentação em rota (mercearias / supermercados / restaurantes / lanche)
  if (
    n.includes("mercearia") || n.includes("supermercado") || n.includes("mercadinho") ||
    n.includes("mercado") || n.includes("açougue") || n.includes("acougue") ||
    n.includes("restaurante") || n.includes("lancheria") || n.includes("confeitaria") ||
    n.includes("hipermercado") || n.includes("ifood")
  ) {
    return { tipo: "DESPESA_LOGISTICA", categoria: "Veículos" };
  }

  // Software
  if (
    n.includes("erp suite") || n.includes("totalcad") || n.includes("sistema") ||
    n.includes("software") || n.includes("vercel") || n.includes("anthropic") ||
    n.includes("openai") || n.includes("supabase")
  ) {
    return { tipo: "DESPESA_ADM", categoria: "Software & TI" };
  }

  // Tarifas bancárias
  if (n.includes("tarifa") || n.includes("cesta de") || n.includes("mercado pago instit")) {
    return { tipo: "DESPESA_FINANCEIRA", categoria: "Tarifa Bancária" };
  }
  if (n.includes("iof")) return { tipo: "DESPESA_FINANCEIRA", categoria: "IOF" };
  if (n.includes("juros")) return { tipo: "DESPESA_FINANCEIRA", categoria: "Juros Pagos" };

  // Encargos (exame demissional, INSS, FGTS)
  if (n.includes("asoprev") || n.includes("exame") || n.includes("inss") || n.includes("fgts")) {
    return { tipo: "DESPESA_ADM", categoria: "Encargos Trabalhistas" };
  }

  // Frete / transportadora
  if (n.includes("disk tenha") || n.includes("transportadora") || n.includes("frete")) {
    return { tipo: "DESPESA_LOGISTICA", categoria: "Frete Terceirizado" };
  }

  // Aluguel
  if (n.includes("aluguel") || n.includes("locação") || n.includes("locacao")) {
    return { tipo: "DESPESA_ADM", categoria: "Infraestrutura" };
  }

  // Pessoa (Martinho = fabricação)
  if (n.includes("martinho")) {
    return { tipo: "CMV", categoria: "Mão-de-obra Produção" };
  }

  // Empréstimo
  if (n.includes("empréstimo") || n.includes("emprestimo") || n.includes("dinheiro express")) {
    return { tipo: "RECEITA_FINANCEIRA", categoria: "Empréstimo" };
  }

  // Default
  return { tipo: "DESPESA_GERAL", categoria: "A classificar" };
}

// Gera um ID legível pra despesa criada a partir do extrato.
export function gerarIdDespesa(banco, data, descricao) {
  const slug = String(descricao || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  return `${banco}-rec-${data.replace(/-/g, "")}-${slug || "sem-desc"}-${Date.now().toString(36).slice(-4)}`;
}
