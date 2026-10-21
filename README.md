# Ajuda Pet

App mobile para cuidar de pets: cadastro, saúde, rotina, memorial e compartilhamento entre tutores.
Tudo fica guardado no celular (SQLite), sem nuvem.

Feito com React Native (Expo SDK 57), **JavaScript** (arquivos `.js`) e `expo-router`.

## Como rodar

```bash
npm install
npx expo start
```

Instale o app **Expo Go** no celular e leia o QR code que aparece no terminal.
Tudo o que existe hoje funciona no Expo Go (SQLite, câmera, galeria e fontes).

Outros comandos:

```bash
npm test            # testes das regras e do banco (SQLite de verdade, inclusive a atualização entre versões)
```

Os testes de banco usam o SQLite embutido do Node 22.5 ou mais novo. Em versões antigas eles são pulados.

## O que já funciona

- **Painel do dia** (tela inicial): saudação, lembretes de hoje (atrasados primeiro), próximos lembretes,
  atalhos e fileira de pets com o contador de atrasados
- **Carteirinha de vacinas** na aba Saúde do pet: um cartão por vacina, com o histórico de doses dentro
  - situação em texto e cor: em dia, vence em breve (30 dias ou menos), atrasada e sem previsão
  - a próxima dose é calculada pelo intervalo, e pode ser ajustada à mão
  - sugestões de vacinas comuns por espécie (confira sempre o intervalo com o veterinário)
  - registrar, editar e excluir doses; o rótulo é sugerido (1ª, 2ª, 3ª dose e Reforço)
- **Peso** (aba Saúde): peso atual e variação no período (3 meses, 6 meses, 1 ano ou tudo), gráfico de linha e histórico
  - guardado em gramas; aceita quilos ou gramas ao digitar
  - pergunta "Confere?" se o valor muda mais de 20% em relação à última pesagem (pega erro de digitação)
  - aviso neutro se o peso variou 10% ou mais em 60 dias (não vale para filhotes com menos de 1 ano)
  - sugere uma nova pesagem no painel depois de 30 dias sem pesar
- **Consultas** (aba Saúde): próxima consulta, histórico, gasto do ano e retorno
  - a mesma tela registra a consulta que já aconteceu ou agenda uma futura (vira lembrete no painel)
  - anexos em foto (receitas, exames), cada um podendo ser marcado como privado
  - **bloco privado**: valor e anotações pessoais ficam em tabela separada e nunca saem do aparelho
- **Rotina** (aba do perfil, um cartão para cada bloco):
  - **Alimentação**: plano com ração, quantidade e horários; marcar cada refeição como feita (guarda quem marcou);
    estimativa de quantos dias o saco dura; lembretes de refeição no painel (podem ser desligados);
    trocar o plano guarda o anterior no histórico
  - **Passeios**: cronômetro com pausa e marcações (xixi, cocô, brincou, cansado). O tempo vem dos horários guardados,
    então continua certo com a tela bloqueada ou o app fechado. Gráfico da semana (segunda a domingo), meta diária,
    histórico e registro de passeio que já aconteceu. Guarda só a distância que você informar, nunca o trajeto
  - **Cuidados**: banho, tosa, antipulgas, vermífugo e os que você criar; a próxima data é calculada pelo último
    registro; botão "feito hoje"; agendamento por data futura; valor pago fica no bloco privado
- **Agenda** (aba): calendário do mês com tudo que tem data, lista do dia e filtro por pet
  - junta vacinas (próxima dose), cuidados, consultas, retornos e lembretes avulsos, de todos os pets
  - pontos coloridos por dia: atrasado, hoje, em breve e já passou (com legenda; o estado também vem em texto)
  - **lembretes avulsos**: vacina, consulta, medicação, banho e tosa, outro cuidado ou passeio, com hora opcional,
    repetição (15 dias, todo mês, 3 meses, todo ano) e aviso com antecedência; "marcar como feito" avança a data
  - tocar em um evento abre a tela do pet no lugar certo
- **Notificações no celular** (locais, sem servidor): o app agenda os avisos dos próximos 90 dias a partir da
  agenda (um aviso com antecedência, 3 dias por padrão, e um no dia, às 9h ou 1 hora antes da hora marcada).
  A permissão só é pedida quando o tutor toca em "Ativar notificações". Tocar em uma notificação abre a tela certa.
  O módulo nativo é carregado com proteção: se não estiver disponível no ambiente, o app segue sem notificações
- **Fotos** (aba do perfil): galeria em grade de 3 colunas, agrupada por mês, com miniaturas
  - adicionar pela câmera ou pela galeria do celular (até 10 de uma vez, sem recorte, reduzidas ao salvar)
  - tocar abre a foto grande, com legenda, "definir como capa", compartilhar e excluir
  - segurar (ou "Selecionar") liga o modo de seleção: definir capa (uma foto) e excluir (várias)
  - a foto do pet é a capa e sempre faz parte da galeria: trocar a capa nunca apaga a foto anterior
- **Cartão de emergência** (botão no Resumo do pet): foto, nome, espécie, idade e peso, vacinas (nenhuma atrasada ou
  quais estão), alergias e observações, microchip e botões grandes para ligar para o tutor, o contato de
  emergência e a veterinária. Compartilha como texto. Nunca mostra valores, anotações pessoais nem memorial
- **Tutor** (aba): perfil com nome, apelido, telefone e e-mail, e os contatos de confiança (veterinário, pet shop e
  contato de emergência). O contato de emergência é só informativo: o app não envia mensagens a ninguém.
  O apelido aparece na saudação do painel ("Bom dia, Ana") e o veterinário já vem preenchido nas consultas
- **Preferências** (Tutor, Preferências): tudo é salvo na hora e vale em todo o app
  - tema (automático, claro ou escuro) e unidade de peso (automática, quilos ou gramas), usados no gráfico, no
    histórico, no Resumo e no cartão de emergência
  - horário padrão e antecedência dos avisos (na hora, 1, 3 ou 7 dias), que passam a valer nas notificações
  - sugestão de nova pesagem (liga e desliga) e meta diária de passeio
  - atalhos do painel: quais aparecem e em que ordem (pelo menos um fica sempre ligado)
  - estado das notificações e uma ajuda curta para quando os lembretes não chegam
- **Memorial** (pets que já partiram), com tema próprio em lilás, no claro e no escuro, e a homenagem em fonte serifada
  - registrar a despedida: só a data é essencial; a mensagem de homenagem é opcional. O pet sai da lista, do painel e da
    agenda e os lembretes dele ficam pausados. **Nada é apagado** e dá para **desfazer** a qualquer momento
  - página do memorial: foto, anos de vida, homenagem, fotos, linha do tempo (com ou sem data) e a ficha de saúde arquivada
  - compartilhar a homenagem (texto), editar a despedida e excluir definitivamente (com confirmação em duas etapas)
  - "Adicionar pet em memorial" (na lista de pets) cadastra um pet que já partiu
  - limite conhecido: a ficha de saúde arquivada abre o perfil normal do pet (ainda não é só de leitura)
- Cadastro de pet: foto (câmera ou galeria, reduzida ao salvar), nome, espécie, raça, sexo e nascimento
  (data exata ou idade aproximada), com "Mais detalhes" recolhido
- Lista de pets com lembretes pendentes, perfil com abas (Resumo, Saúde, Rotina e Fotos), edição e exclusão
- Banco SQLite com migrações versionadas e identidade do aparelho (UUID)
- Tema claro e escuro (segue o sistema), com cores de contraste acessível
- **Backup, ficha do pet e importação** (aba Compartilhar), sem servidor, por um arquivo `.ajudapet` enviado pelo menu de
  compartilhamento do sistema (Bluetooth, Quick Share, WhatsApp, Drive, e-mail...)
  - **Backup completo**: todos os pets, fotos e anexos, valores e anotações privadas, memorial e perfil do tutor.
    Senha opcional (scrypt + XChaCha20-Poly1305): sem a senha o arquivo não mostra nada, e não há como recuperá-lo se ela for esquecida
  - **Ficha do pet** em **PDF** ou em arquivo do Ajuda Pet, com as seções escolhidas (consultas vêm desligadas).
    Valores, anotações pessoais, anexos privados, memorial, galeria e perfil do tutor **nunca** entram
  - **Abrir arquivo** com **prévia**: mostra pets e contadores (novos, atualizados, "seu registro é mais recente", recusados)
    antes de gravar. Faz **cópia de segurança automática** (guarda as 3 últimas), copia as fotos e grava em **uma transação**.
    Importar o mesmo arquivo de novo mostra "Nada de novo". A ficha de outra pessoa entra como cópia à parte ("Ficha recebida")
  - Erros claros: arquivo corrompido, de outro app, de versão mais nova, senha errada, falta de espaço
  - **Lembrete de backup** (nunca, 15, 30 ou 60 dias) nas Preferências: aviso no painel e notificação local
- Barra de abas: Pets, Agenda, Compartilhar e Tutor

## Notificações e o Expo Go

As notificações locais usam `expo-notifications`. Em algumas versões do Expo Go no Android o recurso é limitado.
Se os avisos não chegarem no Expo Go, gere um *development build* (`npx expo run:android` ou EAS Build); o código é o mesmo.

## Estrutura

```
src/
├── app/                 telas (expo-router). Só montam componentes
│   ├── (abas)/          Pets (painel do dia), Agenda, Compartilhar, Tutor
│   ├── pets.js          lista completa de pets
│   ├── escolher-pet.js  "para qual pet?" (atalhos do painel)
│   ├── lembrete.js      novo lembrete avulso ou edição
│   ├── tutor-perfil.js  perfil do tutor e contatos de confiança
│   ├── preferencias.js  preferências do tutor
│   ├── backup.js, ficha.js, importar.js  backup, ficha do pet e abrir arquivo recebido
│   ├── ajuda-lembretes.js  ajuda para quando os lembretes não chegam
│   └── pet/             novo, perfil [id], editar, vacina-nova, dose, peso, consulta, plano, passeio (cronômetro), passeios, passeio-registro, cuidados, cuidado-novo, cuidado-registro, foto, emergencia, despedida, memorial e marco
├── components/
│   ├── ui/              Card, Button, Campo, ChipSelector, Avatar, SituacaoBadge...
│   ├── pet/             PetCard, FormPet, TabsPet, DataNascimentoInput
│   ├── saude/           SecaoVacinas, SecaoPeso, SecaoConsultas, GraficoPeso e os formulários
│   ├── rotina/          CartaoAlimentacao, CartaoPasseios, CartaoCuidados, GraficoSemanal e os formulários
│   ├── agenda/          CalendarioMes, EventoCard, AvisoNotificacoes, FormLembrete
│   ├── fotos/           SecaoFotos (galeria em grade)
│   ├── emergencia/      CartaoEmergencia
│   ├── tutor/           FormTutor
│   └── memorial/        FormDespedida, FormMarco, CartaoMemorial, LinhaDoTempo
│   ├── painel/          LembreteCard, AtalhoTile, PetAvatarRow
│   └── backup/          AvisoBackup
├── hooks/               usePets, usePet, usePainel, useCarteirinha, usePeso, useConsultas, useRotina, useAgenda, useGaleria, useTutor, useEmergencia, usePreferencias, useMemorial, useBackup, useFicha, useImportacao
├── services/            PetService, FotoService, VacinaService, PesoService, ConsultaService, AlimentacaoService, PasseioService, CuidadoService, LembreteAvulsoService, AgendaService, NotificacaoService, GaleriaService, TutorService, EmergenciaService, PreferenciasService, MemorialService, PainelService, BackupService, FichaService, ImportacaoService, EmpacotadorService, Arquivos
├── database/
│   ├── Database.js      conexão e migrações
│   ├── migracoes.js     esquema, em ordem
│   ├── DeviceIdentity.js
│   └── repositories/    BaseRepository e um por modelo (único lugar com SQL)
├── models/              BaseModel, Pet, TipoVacina, DoseVacina, RegistroPeso, Consulta, PlanoAlimentar, Passeio, TipoCuidado, LembreteAvulso, Foto, Tutor, Preferencias, Homenagem, MarcoMemorial, Lembrete e regras (vacina, peso, consulta, rotina, agenda, fotos, tutor, emergência, preferências, memorial)
├── theme/               paletas, fontes, espaçamentos, ThemeProvider
└── utils/               datas, nascimento, id, pacote (formato .ajudapet, criptografia)
```

Caminho de uma ação: **Tela, Hook, Service, Repository, Model, SQLite**. A tela nunca escreve SQL.

## Regras que valem para todo o código

- Todo o código é JavaScript (`.js`). Os imports usam caminhos relativos.
- Os valores aceitos de cada campo (espécie, sexo...) estão descritos em JSDoc no topo de `models/Pet.js`.
- Toda tabela tem `id` (UUID), `criado_em`, `atualizado_em`, `excluido_em` e `autor_dispositivo_id`.
  Isso prepara o backup e a sincronização sem servidor.
- Nunca altere uma migração já publicada: acrescente uma nova no fim de `migracoes.js`.
- Cores vivas (`decor*`) só em ilustração e fundos. Texto e botões usam as cores escuras do tema.
- Alvos de toque de 44 pt ou mais, rótulos visíveis em todo campo e estado escrito (não só cor).

## Contratos

**Lembretes** (painel do dia, `models/Lembrete.js`): todo módulo que gera avisos devolve objetos nesse formato.
Para um módulo novo aparecer no painel, basta um método `lembretes(hoje)` e entrar na lista do `PainelService`.

**Eventos** (agenda e notificações, `models/regrasAgenda.js`): todo módulo com datas devolve eventos de
`eventos(inicioISO, fimISO, hoje)`. Basta entrar na lista do `AgendaService` para aparecer no calendário
e ganhar notificações.

## Contrato de lembretes (detalhe)

Todo módulo que gera avisos devolve objetos no formato de `models/Lembrete.js`. Para um módulo novo
(cuidados, consultas...) aparecer no painel, basta ele ter um método `lembretes(hoje)` e entrar na lista
de provedores do `PainelService`.

## Decisões de escopo

- **Sem PIN nem biometria.** O app abre direto, como a maioria dos apps de pets. Os dados ficam só no celular. Se um dia
  fizer falta, a tela de bloqueio entra como um recurso opcional, sem mudar o resto.

## Formato `.ajudapet`

Arquivo zip com `cabecalho.json` (formato, versão, tipo `backup`/`ficha`, esquema, aparelho de origem, data),
`dados.json` (linhas das tabelas, na ordem de dependência) e `arquivos/` (fotos, nomeadas pelo hash do conteúdo).
Com senha, o zip inteiro é cifrado (`AJPETENC` + parâmetros do scrypt + sal + nonce + texto cifrado).
Regras de segurança da importação: só tabelas e colunas conhecidas, só arquivos de dentro do pacote, limites de tamanho,
registros sem o "pai" ou mal formados são recusados e contados. O mais recente vence; nada é apagado.

## Limites conhecidos do backup

- Não há abertura direta do `.ajudapet` pelo gerenciador de arquivos (falta o filtro de arquivo no `app.json`);
  hoje se abre pelo app: Compartilhar, Abrir um arquivo recebido.
- O app não sabe se o envio foi concluído ou cancelado na janela do sistema; a data do "último backup" é registrada
  quando a janela de compartilhamento é aberta com sucesso.
- As preferências do app (tema, atalhos) não vão no backup.
- Ao restaurar em um celular novo, os registros mantêm o aparelho de origem como autor. A escolha "continuar como este
  aparelho" entra junto com o pareamento.
- Ficha recebida entra como cópia editável, só marcada como "Ficha recebida" (ainda não é somente leitura).
- A senha usa scrypt em JavaScript (N=2^14): leva alguns segundos em celulares mais simples.

#   A j u d a - p e t 
 
 
