-- ============================================================
-- MARGARIDA MARIA
-- PRODUTOS NO SUPABASE - V59.1
--
-- CORREÇÃO:
-- Usa a tabela exclusiva public.produtos_mm
-- para não conflitar com uma tabela antiga chamada "produtos".
--
-- Pode executar este arquivo inteiro no SQL Editor.
-- ============================================================

create table if not exists public.produtos_mm (
  id text primary key,
  nome text not null,
  categoria text not null default 'Cama',
  preco numeric(12,2) not null default 0,
  estoque integer not null default 0,
  vendidos integer not null default 0,
  codigo text,
  descricao text not null default '',
  imagem text not null default 'sem-imagem.svg',
  imagens jsonb not null default '[]'::jsonb,
  lancamento boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint produtos_mm_preco_nao_negativo
    check (preco >= 0),

  constraint produtos_mm_estoque_nao_negativo
    check (estoque >= 0),

  constraint produtos_mm_vendidos_nao_negativo
    check (vendidos >= 0)
);

-- Código/EAN único quando estiver preenchido.
create unique index if not exists produtos_mm_codigo_unico
on public.produtos_mm (codigo)
where codigo is not null
  and btrim(codigo) <> '';

-- Ativa segurança por linha.
alter table public.produtos_mm enable row level security;

-- Permissões básicas.
grant select on public.produtos_mm to anon;
grant select, insert, update, delete on public.produtos_mm to authenticated;

-- Remove somente políticas desta tabela, caso você execute novamente.
drop policy if exists "publico_le_produtos_mm_ativos"
on public.produtos_mm;

drop policy if exists "admin_le_produtos_mm"
on public.produtos_mm;

drop policy if exists "admin_insere_produtos_mm"
on public.produtos_mm;

drop policy if exists "admin_atualiza_produtos_mm"
on public.produtos_mm;

drop policy if exists "admin_exclui_produtos_mm"
on public.produtos_mm;

-- Catálogo público:
-- pode ler somente produtos ativos.
create policy "publico_le_produtos_mm_ativos"
on public.produtos_mm
for select
to anon
using (ativo = true);

-- Administrador:
-- pode visualizar todos os produtos.
create policy "admin_le_produtos_mm"
on public.produtos_mm
for select
to authenticated
using (
  lower(
    coalesce(
      auth.jwt() ->> 'email',
      ''
    )
  ) = 'margaridamaria9530@gmail.com'
);

-- Administrador:
-- pode cadastrar.
create policy "admin_insere_produtos_mm"
on public.produtos_mm
for insert
to authenticated
with check (
  lower(
    coalesce(
      auth.jwt() ->> 'email',
      ''
    )
  ) = 'margaridamaria9530@gmail.com'
);

-- Administrador:
-- pode alterar.
create policy "admin_atualiza_produtos_mm"
on public.produtos_mm
for update
to authenticated
using (
  lower(
    coalesce(
      auth.jwt() ->> 'email',
      ''
    )
  ) = 'margaridamaria9530@gmail.com'
)
with check (
  lower(
    coalesce(
      auth.jwt() ->> 'email',
      ''
    )
  ) = 'margaridamaria9530@gmail.com'
);

-- Administrador:
-- pode excluir.
create policy "admin_exclui_produtos_mm"
on public.produtos_mm
for delete
to authenticated
using (
  lower(
    coalesce(
      auth.jwt() ->> 'email',
      ''
    )
  ) = 'margaridamaria9530@gmail.com'
);

-- ============================================================
-- TESTE FINAL
-- Se aparecer a linha produtos_mm | 0, deu certo.
-- ============================================================

select
  'produtos_mm' as tabela,
  count(*) as quantidade
from public.produtos_mm;
