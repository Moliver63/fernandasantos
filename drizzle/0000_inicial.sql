DO $$ BEGIN
 CREATE TYPE "public"."categoria" AS ENUM('aneis', 'brincos', 'colares', 'pulseiras', 'aliancas', 'conjuntos');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."gateway_pagamento" AS ENUM('asaas', 'stripe');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."metodo_pagamento" AS ENUM('pix', 'boleto', 'cartao_credito');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_arte" AS ENUM('nao_aplicavel', 'aguardando_upload', 'em_analise', 'aprovada', 'reprovada');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_pedido" AS ENUM('aguardando_pagamento', 'pago', 'em_producao', 'pronto_envio', 'enviado', 'entregue', 'cancelado');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_personalizacao" AS ENUM('gravacao');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categoria_banners" (
	"categoria" varchar(40) PRIMARY KEY NOT NULL,
	"imagem_url" text,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "itens_kit" (
	"id" serial PRIMARY KEY NOT NULL,
	"kit_id" integer NOT NULL,
	"produto_id" integer NOT NULL,
	"quantidade" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "itens_pedido" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"produto_id" integer NOT NULL,
	"variante_banho_id" integer,
	"variante_tamanho_id" integer,
	"quantidade" integer DEFAULT 1 NOT NULL,
	"preco_unitario" numeric(10, 2) NOT NULL,
	"personalizado" boolean DEFAULT false NOT NULL,
	"arte_gravacao_url" text,
	"status_arte" "status_arte" DEFAULT 'nao_aplicavel' NOT NULL,
	"texto_gravacao" varchar(60),
	"observacoes_cliente" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(160) NOT NULL,
	"nome" varchar(160),
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "leads_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mensagens_contato" (
	"id" serial PRIMARY KEY NOT NULL,
	"resend_email_id" varchar(200),
	"remetente" varchar(200) NOT NULL,
	"destinatario" varchar(200),
	"assunto" varchar(250),
	"corpo_texto" text,
	"corpo_html" text,
	"anexos" jsonb,
	"lida" boolean DEFAULT false NOT NULL,
	"respondida" boolean DEFAULT false NOT NULL,
	"arquivada" boolean DEFAULT false NOT NULL,
	"excluida" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mensagens_contato_resend_email_id_unique" UNIQUE("resend_email_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mensagens_enviadas" (
	"id" serial PRIMARY KEY NOT NULL,
	"mensagem_origem_id" integer,
	"destinatario" varchar(200) NOT NULL,
	"assunto" varchar(250),
	"corpo" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pedido_eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"status" "status_pedido" NOT NULL,
	"descricao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pedidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo_pedido" varchar(20) NOT NULL,
	"cliente_nome" varchar(160) NOT NULL,
	"cliente_email" varchar(160) NOT NULL,
	"cliente_telefone" varchar(30),
	"cliente_documento" varchar(20),
	"endereco_entrega" jsonb,
	"status" "status_pedido" DEFAULT 'aguardando_pagamento' NOT NULL,
	"gateway" "gateway_pagamento" NOT NULL,
	"metodo_pagamento" "metodo_pagamento",
	"gateway_referencia_id" varchar(120),
	"subtotal" numeric(10, 2) NOT NULL,
	"custo_personalizacao_total" numeric(10, 2) DEFAULT '0',
	"frete" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"prazo_producao_estimado" timestamp,
	"transportadora" varchar(60),
	"codigo_rastreio" varchar(60),
	"desconto" numeric(10, 2) DEFAULT '0',
	"atribuicao" jsonb,
	"venda_reportada" boolean DEFAULT false NOT NULL,
	"lembrete_abandono_enviado" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_codigo_pedido_unique" UNIQUE("codigo_pedido")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "produtos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"categoria" "categoria" NOT NULL,
	"descricao" text,
	"preco_base" numeric(10, 2) NOT NULL,
	"preco_promocional" numeric(10, 2),
	"material" varchar(120),
	"pedras" varchar(160),
	"dimensoes" varchar(120),
	"garantia_meses" integer DEFAULT 12 NOT NULL,
	"hipoalergenica" boolean DEFAULT true NOT NULL,
	"destaque" boolean DEFAULT false NOT NULL,
	"novidade" boolean DEFAULT false NOT NULL,
	"personalizavel" boolean DEFAULT false NOT NULL,
	"tipo_personalizacao" "tipo_personalizacao",
	"custo_personalizacao" numeric(10, 2) DEFAULT '0',
	"preco_sob_consulta" boolean DEFAULT false NOT NULL,
	"controlar_estoque" boolean DEFAULT false NOT NULL,
	"estoque" integer DEFAULT 0 NOT NULL,
	"eh_kit" boolean DEFAULT false NOT NULL,
	"prazo_producao_dias" integer DEFAULT 2 NOT NULL,
	"cuidados" text DEFAULT 'Evite contato com perfume, cremes, cloro e água do mar. Guarde a peça separada, no saquinho ou estojo, e limpe com flanela seca.',
	"imagens" jsonb DEFAULT '[]'::jsonb,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "produtos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variantes_banho" (
	"id" serial PRIMARY KEY NOT NULL,
	"produto_id" integer NOT NULL,
	"nome" varchar(80) NOT NULL,
	"codigo_hex" varchar(7),
	"codigo_fornecedor" varchar(40),
	"imagem_url" text,
	"estoque_disponivel" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variantes_tamanho" (
	"id" serial PRIMARY KEY NOT NULL,
	"produto_id" integer NOT NULL,
	"nome" varchar(80) NOT NULL,
	"codigo_hex" varchar(7),
	"imagem_url" text,
	"estoque_disponivel" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_kit" ADD CONSTRAINT "itens_kit_kit_id_produtos_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_kit" ADD CONSTRAINT "itens_kit_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_variante_banho_id_variantes_banho_id_fk" FOREIGN KEY ("variante_banho_id") REFERENCES "public"."variantes_banho"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_variante_tamanho_id_variantes_tamanho_id_fk" FOREIGN KEY ("variante_tamanho_id") REFERENCES "public"."variantes_tamanho"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mensagens_enviadas" ADD CONSTRAINT "mensagens_enviadas_mensagem_origem_id_mensagens_contato_id_fk" FOREIGN KEY ("mensagem_origem_id") REFERENCES "public"."mensagens_contato"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pedido_eventos" ADD CONSTRAINT "pedido_eventos_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variantes_banho" ADD CONSTRAINT "variantes_banho_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variantes_tamanho" ADD CONSTRAINT "variantes_tamanho_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
