@AGENTS.md

# Ajuda Pet — contexto para continuar o desenvolvimento

Converse sempre em **português do Brasil**. Textos do app, commits e documentos também em pt-BR.

## O projeto

App de cuidados com pets (projeto do curso "PI"): Expo SDK 57, React Native, JavaScript,
Expo Router (`src/app/`) e SQLite local (`expo-sqlite`). Sem servidor e sem login.

Camadas: `src/models` (regras puras, testáveis), `src/database` (migrações e repositórios),
`src/services` (casos de uso), `src/hooks`, `src/components`, `src/app` (telas).

## Decisões de escopo (não mudar sem o usuário pedir)

- Só **Android**. Sem iPhone, sem sincronização entre aparelhos, sem tela de PIN, sem SQLCipher,
  sem Play Store. Documentos não devem listar esses itens como próximos passos.
- B01 (backup marcado como feito ao fechar o compartilhamento) fica aberto por decisão do usuário.

## Convenções

- Trabalho no branch `desenvolvimento`. Levar ao `main` (e criar etiquetas de versão) **só com OK
  do usuário**.
- Antes de dar uma tarefa por pronta: `npx expo lint` e `npx jest` (351 testes em 2026-11-19).
- Migrações do banco (`src/database/migracoes.js`): só acrescentar no fim. A última é a 13.
- Versão: `version` do `app.json` em MAIOR.MENOR.CORREÇÃO, subir a cada entrega. O número da
  compilação (versionCode) fica na nuvem do EAS (`appVersionSource: remote`, `autoIncrement` no
  perfil preview). A aba Tutor mostra "versão X (compilação N)".
- O usuário testa cada entrega no celular (vivo, Android) com o APK do EAS:
  `EAS_SKIP_AUTO_FINGERPRINT=1 npx eas-cli@latest build -p android --profile preview --non-interactive --no-wait`
  (precisa estar logado no Expo; na nuvem, pela variável `EXPO_TOKEN`). A fila gratuita leva uns
  10 min, e a compilação, uns 15 a 20. O APK atualiza o app instalado sem desinstalar.
- Commits: mensagem em pt-BR, título curto e lista do que mudou, do ponto de vista do usuário.

## Notificações (o que já se aprendeu)

- Avisos locais com `expo-notifications`, gatilho DATE, canal `avisos` de importância alta
  (o canal antigo `lembretes` é apagado; o Android não deixa mudar a importância de um canal).
- `reagendar` apaga tudo e agenda de novo, em ordem de horário, cada aviso no seu try/catch.
- Refeições: aviso na hora e 1 h depois se não for marcada, para 7 dias.
- Celulares como o vivo seguram os avisos até o app ser aberto se ele estiver na economia de
  bateria. Na 1.1.1 o app pede para sair da economia (expo-battery + expo-intent-launcher) e
  as Preferências mostram o estado.

## Onde paramos (2026-11-19)

- Versão 1.1.0 aprovada no celular (versão no app, sem microfone, botão "Novo plano", avisos
  por cima de outros apps, aviso de 1 h depois).
- Versão 1.1.1 (commit ccb56e5) com o pedido de liberar da economia de bateria: build EAS
  41bbae22, **aguardando o teste do usuário**. Dúvida principal: o "Permitir" da janela do
  Android muda a tela Energia da vivo para "Nenhuma restrição"?
- `main` parado em 5c99e7d. Depois da aprovação, com OK do usuário: levar o `desenvolvimento`
  ao `main` (`git merge --ff-only`) e criar as etiquetas `v1.1.0` e `v1.1.1`.

## Pendências

- Testes automatizados de cuidados e de importar a ficha de outra pessoa.
- M01: a ação de despedida do pet é difícil de achar.
- Centralizar o texto do chip do passeio.
- Documentação do projeto e manual de uso do app; atualizar os documentos de arquitetura,
  telas e relatório de testes (migrações até a 13, passeio em segundos, refeições,
  notificações, versionamento). Esses documentos estão fora do repositório.
