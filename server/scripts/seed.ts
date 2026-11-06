/**
 * seed.ts — catálogo de DEMONSTRAÇÃO
 *
 * Peças e preços abaixo são exemplos para o site não abrir vazio em
 * desenvolvimento. Antes de ir ao ar, cadastre as peças reais pelo
 * /admin/produtos (com fotos) e desative ou apague estas.
 *
 *   npm run seed
 */
import "dotenv/config";
import { db } from "../db";
import { produtos, variantesBanho, variantesTamanho } from "../../shared/schema";

type NovoProduto = typeof produtos.$inferInsert;

const BANHO_OURO = { nome: "Ouro 18k", codigoHex: "#D4AF37" };
const BANHO_RODIO = { nome: "Ródio branco", codigoHex: "#D9DCE1" };
const BANHO_ROSE = { nome: "Ouro rosé", codigoHex: "#C99A86" };

const PECAS: {
  produto: NovoProduto;
  banhos?: { nome: string; codigoHex: string }[];
  tamanhos?: string[];
}[] = [
  {
    produto: {
      nome: "Anel Solitário Luz",
      slug: "anel-solitario-luz",
      categoria: "aneis",
      descricao: "Solitário com zircônia central de 6 mm em garras finas. Delicado para o dia a dia, marcante o bastante para um pedido especial.",
      precoBase: "189.90",
      material: "Latão com banho de ouro 18k",
      pedras: "Zircônia branca 6 mm",
      destaque: true,
      novidade: true,
      controlarEstoque: true,
      estoque: 12,
    },
    banhos: [BANHO_OURO, BANHO_RODIO],
    tamanhos: ["Aro 12", "Aro 14", "Aro 16", "Aro 18", "Aro 20"],
  },
  {
    produto: {
      nome: "Anel Aparador Cravejado",
      slug: "anel-aparador-cravejado",
      categoria: "aneis",
      descricao: "Meia-aliança cravejada para usar sozinha ou compor com o solitário.",
      precoBase: "159.90",
      precoPromocional: "129.90",
      material: "Latão com banho de ouro 18k",
      pedras: "Zircônias brancas",
      controlarEstoque: true,
      estoque: 8,
    },
    banhos: [BANHO_OURO, BANHO_RODIO, BANHO_ROSE],
    tamanhos: ["Aro 12", "Aro 14", "Aro 16", "Aro 18"],
  },
  {
    produto: {
      nome: "Brinco Ponto de Luz",
      slug: "brinco-ponto-de-luz",
      categoria: "brincos",
      descricao: "O clássico que combina com tudo. Zircônia de 5 mm e tarraxa de pressão.",
      precoBase: "89.90",
      material: "Latão com banho de ouro 18k",
      pedras: "Zircônia branca 5 mm",
      destaque: true,
      controlarEstoque: true,
      estoque: 30,
    },
    banhos: [BANHO_OURO, BANHO_RODIO],
  },
  {
    produto: {
      nome: "Argola Gota Polida",
      slug: "argola-gota-polida",
      categoria: "brincos",
      descricao: "Argola média em formato de gota, leve e com acabamento espelhado.",
      precoBase: "139.90",
      material: "Latão com banho de ouro 18k",
      dimensoes: "2,5 cm",
      novidade: true,
      controlarEstoque: true,
      estoque: 15,
    },
    banhos: [BANHO_OURO],
  },
  {
    produto: {
      nome: "Colar Riviera Fina",
      slug: "colar-riviera-fina",
      categoria: "colares",
      descricao: "Riviera de zircônias cravejadas em toda a volta, com fecho ajustável.",
      precoBase: "329.90",
      material: "Latão com banho de ródio",
      pedras: "Zircônias brancas",
      dimensoes: "40 cm + 5 cm de extensor",
      destaque: true,
      controlarEstoque: true,
      estoque: 5,
    },
    banhos: [BANHO_RODIO, BANHO_OURO],
  },
  {
    produto: {
      nome: "Gargantilha Coração Vazado",
      slug: "gargantilha-coracao-vazado",
      categoria: "colares",
      descricao: "Pingente de coração vazado em corrente veneziana. Presente certeiro.",
      precoBase: "149.90",
      material: "Latão com banho de ouro 18k",
      dimensoes: "Pingente 1,2 cm · corrente 45 cm",
      controlarEstoque: true,
      estoque: 20,
    },
    banhos: [BANHO_OURO, BANHO_ROSE],
  },
  {
    produto: {
      nome: "Pulseira Riviera",
      slug: "pulseira-riviera",
      categoria: "pulseiras",
      descricao: "Riviera clássica de zircônias quadradas, brilho do pulso ao jantar.",
      precoBase: "269.90",
      material: "Latão com banho de ouro 18k",
      pedras: "Zircônias brancas",
      dimensoes: "17 cm + 3 cm de extensor",
      destaque: true,
      controlarEstoque: true,
      estoque: 6,
    },
    banhos: [BANHO_OURO, BANHO_RODIO],
  },
  {
    produto: {
      nome: "Par de Alianças Tradicional 4 mm",
      slug: "aliancas-tradicional-4mm",
      categoria: "aliancas",
      descricao: "Par de alianças abauladas de 4 mm, polidas. Gravação interna de nomes e data inclusa.",
      precoBase: "349.90",
      material: "Prata 925 com banho de ouro 18k",
      dimensoes: "4 mm de largura",
      garantiaMeses: 12,
      personalizavel: true,
      tipoPersonalizacao: "gravacao",
      custoPersonalizacao: "0",
      prazoProducaoDias: 7,
      destaque: true,
    },
    banhos: [BANHO_OURO],
    tamanhos: ["Aros sob medida (informe na gravação)"],
  },
  {
    produto: {
      nome: "Alianças em Ouro 18k",
      slug: "aliancas-ouro-18k",
      categoria: "aliancas",
      descricao: "Ouro 18k maciço, feitas sob medida. O valor depende do peso e da numeração do casal: chame no atendimento.",
      precoBase: "0",
      precoSobConsulta: true,
      material: "Ouro 18k (750)",
      hipoalergenica: true,
      garantiaMeses: 0,
      prazoProducaoDias: 15,
    },
  },
  {
    produto: {
      nome: "Conjunto Gota Cristal",
      slug: "conjunto-gota-cristal",
      categoria: "conjuntos",
      descricao: "Colar e brincos com gota de cristal lapidado. Já vai no estojo de presente.",
      precoBase: "249.90",
      precoPromocional: "219.90",
      material: "Latão com banho de ouro 18k",
      pedras: "Cristal lapidado",
      novidade: true,
      controlarEstoque: true,
      estoque: 10,
    },
    banhos: [BANHO_OURO, BANHO_RODIO],
  },
];

async function seed() {
  // Idempotente: roda no start do Render (SEED_DEMO=true) sem duplicar
  const existente = await db.query.produtos.findFirst();
  if (existente) {
    console.log("Catálogo já tem peças — seed de demonstração ignorado.");
    process.exit(0);
  }
  console.log("Populando catálogo de demonstração FS Joias...");

  for (const { produto, banhos, tamanhos } of PECAS) {
    const [criado] = await db.insert(produtos).values({ imagens: [], ...produto }).returning();

    if (banhos?.length) {
      await db
        .insert(variantesBanho)
        .values(banhos.map((b) => ({ produtoId: criado.id, ...b })));
    }
    if (tamanhos?.length) {
      await db
        .insert(variantesTamanho)
        .values(tamanhos.map((nome) => ({ produtoId: criado.id, nome })));
    }
    console.log(`  ✓ ${criado.nome}`);
  }

  console.log("Pronto.");
  process.exit(0);
}

seed().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
