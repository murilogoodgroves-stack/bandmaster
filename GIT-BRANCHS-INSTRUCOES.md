# Git: branches e como usar no projeto

Este arquivo explica de forma simples o que são branches, por que elas são úteis e como usar no projeto local.

## 1) O que é uma branch?

Uma branch é uma ramificação do projeto. Em vez de trabalhar diretamente na versão principal, você cria uma cópia do código e trabalha ali.

Pense assim:

- main = versão principal e estável
- feature-x = uma versão para uma funcionalidade nova
- fix-x = uma versão para corrigir algo

Você pode criar quantas branches quiser.

## 2) Por que usar branches?

Branches ajudam a:

- desenvolver sem quebrar a versão principal
- testar novas ideias isoladamente
- organizar tarefas por funcionalidade
- revisar mudanças antes de publicar
- voltar atrás facilmente se algo der errado

## 3) Branch principal

Normalmente o nome da branch principal é:

- main
- master

No projeto, o ideal é manter a branch principal como versão estável do sistema.

## 4) Como criar uma branch

No terminal, dentro da pasta do projeto, rode:

```bash
git checkout -b feature-bandmate-ai
```

Ou a forma mais moderna:

```bash
git switch -c feature-bandmate-ai
```

Exemplos de nomes válidos:

```bash
git checkout -b feature-dashboard
git checkout -b feature-ai-generator
git checkout -b feature-show-calendar
git checkout -b fix-db-connection
git checkout -b improve-ui
```

## 5) Como ver as branches existentes

```bash
git branch
```

## 6) Como trocar de branch

```bash
git checkout main
```

ou

```bash
git switch main
```

## 7) Como fazer commit na branch atual

Depois de editar os arquivos:

```bash
git add .
git commit -m "Descrição da alteração"
```

## 8) Como mesclar uma branch na principal

Primeiro volte para a branch principal:

```bash
git checkout main
```

Depois junte a outra branch:

```bash
git merge feature-bandmate-ai
```

Se a branch estiver pronta e testada, essa é a forma de “publicar” as mudanças na versão principal.

## 9) Quando usar branch

Use branch quando:

- for criar uma funcionalidade nova
- for corrigir um problema
- for testar uma ideia diferente
- for trabalhar em algo que pode quebrar o projeto

## 10) Fluxo recomendado para este projeto

Um fluxo simples e organizado seria:

```bash
git checkout -b feature-ai-tools
git checkout -b feature-show-management
git checkout -b feature-press-kit
git checkout -b fix-database-config
```

Assim cada tema fica em sua própria branch e a versão principal continua limpa.

## 11) Resumo prático

Branch é como uma cópia separada do projeto para você trabalhar sem medo de estragar o restante.

Em resumo:

- main = versão estável
- branch nova = trabalho isolado
- merge = juntar as mudanças na versão principal

## 12) Regra simples

Se a mudança for grande ou arriscada, trabalhe em uma branch separada.

Se a mudança for pequena e segura, ainda pode usar branch para manter organização.

## 13) Comando útil para começar

```bash
git status
git branch
git checkout -b feature-meu-trabalho
```

## 14) Dica para continuar depois

Para continuar o projeto em outra sessão ou outra máquina:

1. subir o projeto para GitHub ou salvar no repositório
2. clonar/abrir a pasta local
3. rodar os comandos de setup
4. confirmar em qual branch está trabalhando
5. continuar a evolução em uma branch específica

## 15) Exemplo de fluxo completo

```bash
git checkout -b feature-epk-generator
git add .
git commit -m "inicializa gerador de epk"
git checkout main
git merge feature-epk-generator
```

## 16) Conclusão

Branches são essenciais para manter o projeto organizado, seguro e fácil de evoluir. Para um sistema como este, usar branches por funcionalidade é a melhor prática.

Se você quiser, depois pode criar branches mais específicas para:

- IA
- dashboard
- shows
- agenda
- financeiro
- marketing
- upload de mídia

