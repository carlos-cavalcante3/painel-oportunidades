# Painel de Oportunidades — Pré-Venda

Dashboard interno da Avantia com o pipeline comercial de pré-vendas. Aplicação
React + TypeScript + Vite, com dados carregados diretamente do Supabase
(view `privado.vw_oportunidades_prevendas`), pronta para deploy na Vercel.

O arquivo HTML estático original (que usava dados de uma planilha do
SharePoint) foi preservado em `legacy/painel-oportunidades.html` como
referência histórica — a versão em produção agora é o app em `src/`.

## Stack

- React 19 + TypeScript + Vite
- [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript) (somente leitura, via chave `anon`)
- Chart.js (gráficos de barras clicáveis)

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha com a URL e a `anon key` do
   seu projeto Supabase:

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key-publica
   ```

   > A `anon key` é uma chave pública, mas ainda assim só deve ter acesso ao
   > que está descrito em [`supabase/migrations`](./supabase/migrations) —
   > nunca use a `service_role key` no frontend.

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

## Configuração do banco (Supabase)

Antes do dashboard funcionar, rode os scripts em
[`supabase/migrations`](./supabase/migrations), **nessa ordem**, no SQL
Editor do Supabase:

1. **`001_expose_view_readonly.sql`** — concede ao role `anon` (usado pelo
   frontend público, sem login) acesso de **somente leitura** à view
   `privado.vw_oportunidades_prevendas`, e nada mais. Revoga explicitamente
   qualquer outro acesso do `anon` ao schema `privado`.
2. **`002_etl_sync_status.sql`** — cria a estrutura mínima para o badge de
   "última atualização dos dados" (ver seção abaixo).

Pré-requisito: o schema `privado` precisa estar na lista de **Exposed
schemas** em *Project Settings → Data API* (configuração de dashboard, não
via SQL) — já confirmado como feito neste projeto.

### Por que isso é seguro?

- O frontend só enxerga a `anon key`, que por definição é pública. A
  segurança não vem de "esconder" a chave, e sim de **limitar o que essa
  chave consegue fazer** no banco.
- O `anon` só tem `SELECT` na view do dashboard e na view de status do ETL
  — nenhuma tabela de origem, nenhuma outra view, e nenhum privilégio de
  escrita (`INSERT`/`UPDATE`/`DELETE`) em lugar nenhum.
- A tabela de histórico do ETL (`privado.etl_sync_log`, com detalhes de
  cada execução) permanece privada; só a última execução é exposta, via a
  view fina `privado.etl_sync_status`.
- Nenhuma credencial de escrita (senha do banco, `service_role key`) fica
  no código do frontend ou é necessária para o dashboard funcionar.

## "Última atualização dos dados"

O badge no topo do dashboard mostra quando o ETL rodou pela última vez,
lendo de `privado.etl_sync_status` — e não o horário em que o usuário abriu
a página.

Como os dados são carregados por um ETL diário via GitHub Actions (que já
escreve diretamente no Postgres), a forma mais confiável de alimentar esse
indicador é o **próprio job registrar sua execução** ao final da rotina —
isso reflete quando o ETL rodou de fato, mesmo em execuções em que nenhuma
linha tenha mudado.

Adicione ao final do script/workflow do ETL (ele já deve ter uma conexão
com privilégio de escrita ao Postgres) uma gravação como:

```sql
insert into privado.etl_sync_log (status, linhas_processadas)
values ('sucesso', :linhas_processadas);
```

Ou, via workflow do GitHub Actions (se o ETL não for facilmente editável e
você preferir um passo dedicado), usando `psql` e um secret com a
connection string do Postgres:

```yaml
      - name: Registrar execução do ETL
        if: success()
        run: |
          psql "$SUPABASE_DB_URL" -c \
            "insert into privado.etl_sync_log (status) values ('sucesso');"
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
```

> Importante: use a connection string direta do Postgres (ou uma role
> dedicada com permissão de escrita), nunca a `anon key` — ela não tem
> permissão de `INSERT` nessa tabela.

Se essa etapa ainda não tiver sido adicionada ao ETL, o badge exibe
"Última atualização indisponível" em vez de quebrar o dashboard.

## Ordenação da tabela "Detalhamento completo"

Implementada em [`src/lib/sorting.ts`](./src/lib/sorting.ts):

1. Oportunidades com **valor > 0**, da maior para a menor.
2. Entre as demais (valor ausente ou zero), as que têm **data de entrega**,
   da mais próxima para a mais distante.
3. Entre as que não têm valor nem data de entrega, pela **data de
   entrada**, da mais antiga para a mais recente.

## Deploy na Vercel

1. Suba este repositório no GitHub/GitLab (se ainda não estiver).
2. Na Vercel, importe o repositório — o framework Vite é detectado
   automaticamente (build command `npm run build`, output `dist`).
3. Em *Project Settings → Environment Variables*, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. O link gerado pela Vercel pode ser compartilhado livremente com
   qualquer colaborador — não há tela de login.

## Estrutura do projeto

```
src/
  components/   Componentes de UI (header, KPIs, cards, gráficos, tabela)
  hooks/        useOportunidades (dados) e useUltimaAtualizacao (badge)
  lib/          Tipos, parsing (moeda/data), agregações e ordenação
supabase/
  migrations/   Scripts SQL para rodar no SQL Editor do Supabase
legacy/
  painel-oportunidades.html   Versão estática original (referência)
```
