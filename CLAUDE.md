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
- Antes de dar uma tarefa por pronta: `npx expo lint` e `npx jest` (399 testes em 2026-11-27).
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
- Versão 1.1.1 aprovada no celular: o app pede para liberar da economia de bateria, e o painel
  mostra uma faixa quando as notificações estão desligadas ou o app está na economia de bateria.
  Na vivo, o botão leva à tela de liberação e o usuário escolhe "Nenhuma restrição".
- `main` igual ao `desenvolvimento` em 2026-11-19, com as etiquetas `v1.1.0` (81b59cf) e
  `v1.1.1` (c0b1110). A próxima entrega sobe a versão no `app.json`.
- 2026-11-23: avaliação técnica de um colega (apresentação TDS02, commit aa8501f) achou
  BUG-01 (nascimento aproximado virava exato ao editar o pet) e BUG-02 (aviso às 23:30 de um
  evento às 00:30 dizia "Hoje"). Corrigidos na 1.1.2 (bf956f1), com testes QA-01 a QA-04.
  Pacotes do Expo atualizados (`expo install --fix`) e `npm audit fix`: auditoria de 23 para 6
  itens; os 3 altos restantes (query-string/decode-uri-component dentro do expo-router) só
  saem no SDK 58. Build EAS cd4b87ca testada no celular (BUG-01 ok).
- 2026-11-25: lembrete de hoje com a hora passada fica atrasado (laranja); aviso de título some
  ao escolher o tipo; toda gravação no banco avisa `src/database/mudancas.js` e as notificações
  são reagendadas (antes, salvar um lembrete e sair direto deixava o aviso sem agendar), commit
  41a1da4. A cota gratuita do EAS acabou até 2026-12-01: APK gerado no computador (clone em
  pasta curta, `gradlew app:assembleRelease`), assinado com a chave de debug, então no celular
  precisa backup, desinstalar e instalar. **Aguardando o teste do usuário.**
- 69d3ec3: lembrete de Vacina/Banho e tosa/Outro cuidado/Consulta, ao ser marcado como feito,
  pergunta se quer registrar no pet e abre a dose, o registro do cuidado ou a consulta
  (`src/models/regrasLembrete.js`); ao criar um desses, uma dica leva à carteirinha, aos
  cuidados ou à consulta. Testado no emulador (APK local).
- Material da apresentação do grupo num doc do Claude ("Ajuda Pet — material para a
  apresentação"), com prints feitos no emulador com dados fictícios (Ana Souza, Luna, Mingau).

## Pendências

- M01: a ação de despedida do pet é difícil de achar.
- Centralizar o texto do chip do passeio.
- Documentação do projeto e manual de uso do app; atualizar os documentos de arquitetura,
  telas e relatório de testes (migrações até a 13, passeio em segundos, refeições,
  notificações, versionamento). Esses documentos estão fora do repositório.
