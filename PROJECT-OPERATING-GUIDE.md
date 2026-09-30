# Guia operativo do projeto Bandmaster

## Objetivo deste documento

Este arquivo serve como referência para qualquer pessoa ou IA que continuar o projeto depois de uma sessão, especialmente após alterações de conteúdo, onboarding e setup de ambiente.

## Estado atual do projeto

- O sistema foi limpo para arrancar sem dados demo embutidos.
- O app não carrega conteúdo placeholder por padrão.
- A criação de banda agora passa por um wizard guiado para coletar dados reais da banda.
- A base da aplicação continua funcionando sem depender de dados falsos.

## Regras de segurança para futuras alterações

1. Nunca reintroduzir conteúdo demo como valor default no app.
2. Sempre manter um início em estado limpo ou em onboarding.
3. Antes de mexer em dados iniciais, criar uma branch nova.
4. Se for necessário restaurar dados de exemplo, fazer isso de forma explícita e isolada, não como estado default.
5. Qualquer mudança grande deve ser documentada aqui.

## Branch ativa

A branch usada para estes ajustes foi:

- cleanup-placeholder-content-wizard

Se for continuar o desenvolvimento, use uma branch nova por funcionalidade.

Exemplo:

```bash
git checkout -b feature-dashboard-ai
git checkout -b feature-band-setup
git checkout -b fix-calendar-loading
```

## Como o wizard funciona

O wizard está dentro do modal de criação de banda e agora funciona como uma entrevista real de setup da banda. Ele coleta:

- nome da banda
- gênero
- cidade
- país
- estágio atual da banda
- status de release
- título e data de lançamento
- status de tour
- agenda de shows
- foco atual
- bio e notas internas

Esses campos alimentam o estado da banda sem forçar conteúdo placeholder. A qualquer momento o usuário pode clicar em "Skip for now" para continuar em branco e depois completar a banda usando o ícone discreto ao lado do nome da banda.

## O que foi limpo

Os dados default foram removidos de:

- dados iniciais das bandas
- usuários demo
- tarefas demo
- eventos demo
- transações demo
- releases demo
- merch demo
- setlists demo
- gigs demo
- projetos demo
- campanhas demo
- royalties demo
- arquivos de mídia demo

Isso evita que a aplicação seja entregue pronta com nomes, álbuns e projetos falsos.

## Como reverter se algo quebrar

Se uma mudança posterior comprometer o funcionamento:

1. voltar para a branch principal ou para a branch de referência
2. confirmar o último commit estável
3. verificar o estado de localStorage e do wizard
4. remover mudanças semânticas duplicadas
5. revalidar com build do projeto

Comando útil:

```bash
git checkout main
git log --oneline --decorate -n 10
```

## Fluxo recomendado para continuar

- trabalhar em branch por funcionalidade
- validar build sempre que houver mudança grande
- manter dados reais e band-specific na criação da banda
- evitar guardar dados de exemplo como padrão do app
- respeitar o fluxo de onboarding e o "skip for now" para não bloquear a experiência inicial
- usar o ícone de edição discreto para reabrir o wizard e ajustar os dados sem quebrar o estado atual

## Arquivos-chave relacionados

- App.tsx
- data/initialData.ts
- types.ts

## Observação final

O app deve abrir em estado limpo e exigir que o usuário configure a banda real do início. Isso reduz ruído, evita placeholders e deixa o sistema mais profissional e pronto para uso real.
