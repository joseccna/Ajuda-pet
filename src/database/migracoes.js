/**
 * Migrações do banco, em ordem. A posição na lista é a versão do esquema
 * (guardada em PRAGMA user_version). Nunca altere uma migração já publicada:
 * acrescente uma nova no fim da lista.
 */
export const MIGRACOES = [
  // 1: aparelho e pets
  `
  CREATE TABLE dispositivos (
    id TEXT PRIMARY KEY NOT NULL,
    apelido TEXT NOT NULL,
    eh_este_aparelho INTEGER NOT NULL DEFAULT 0,
    pareado_em TEXT,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT
  );

  CREATE TABLE pets (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    especie TEXT NOT NULL,
    especie_outra TEXT NOT NULL DEFAULT '',
    raca TEXT NOT NULL DEFAULT '',
    sexo TEXT NOT NULL DEFAULT 'desconhecido',
    nascimento TEXT,
    nascimento_aproximado INTEGER NOT NULL DEFAULT 0,
    foto_uri TEXT,
    cor TEXT NOT NULL DEFAULT '',
    microchip TEXT NOT NULL DEFAULT '',
    castrado TEXT NOT NULL DEFAULT 'desconhecido',
    observacoes TEXT NOT NULL DEFAULT '',
    falecido INTEGER NOT NULL DEFAULT 0,
    data_falecimento TEXT,
    origem TEXT NOT NULL DEFAULT 'proprio',
    dono_dispositivo_id TEXT,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE INDEX idx_pets_lista ON pets (falecido, excluido_em);
  `,

  // 2: carteirinha de vacinas (um cartão por tipo, com as doses dentro)
  `
  CREATE TABLE tipos_vacina (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    nome TEXT NOT NULL,
    intervalo_dias INTEGER,
    observacao TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE doses_vacina (
    id TEXT PRIMARY KEY NOT NULL,
    tipo_id TEXT NOT NULL REFERENCES tipos_vacina(id),
    rotulo TEXT NOT NULL,
    data_aplicacao TEXT NOT NULL,
    proxima_dose_manual TEXT,
    lote TEXT NOT NULL DEFAULT '',
    veterinario TEXT NOT NULL DEFAULT '',
    clinica TEXT NOT NULL DEFAULT '',
    observacao TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE INDEX idx_tipos_vacina_pet ON tipos_vacina (pet_id, excluido_em);
  CREATE INDEX idx_doses_vacina_tipo ON doses_vacina (tipo_id, excluido_em);
  `,

  // 3: peso e consultas (com a parte privada e os anexos em tabelas separadas)
  `
  CREATE TABLE registros_peso (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    peso_g INTEGER NOT NULL,
    data TEXT NOT NULL,
    observacao TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE consultas (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    data TEXT NOT NULL,
    hora TEXT NOT NULL DEFAULT '',
    motivo TEXT NOT NULL,
    veterinario TEXT NOT NULL DEFAULT '',
    clinica TEXT NOT NULL DEFAULT '',
    diagnostico TEXT NOT NULL DEFAULT '',
    prescricao TEXT NOT NULL DEFAULT '',
    retorno_em TEXT,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  -- Valor e anotações pessoais ficam separados: nunca entram em pacotes compartilhados.
  CREATE TABLE consultas_privadas (
    id TEXT PRIMARY KEY NOT NULL,
    consulta_id TEXT NOT NULL UNIQUE REFERENCES consultas(id),
    valor_centavos INTEGER,
    anotacoes TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE anexos_consulta (
    id TEXT PRIMARY KEY NOT NULL,
    consulta_id TEXT NOT NULL REFERENCES consultas(id),
    uri TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'imagem',
    privado INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE INDEX idx_peso_pet_data ON registros_peso (pet_id, data);
  CREATE INDEX idx_consultas_pet_data ON consultas (pet_id, data);
  CREATE INDEX idx_anexos_consulta ON anexos_consulta (consulta_id, excluido_em);
  `,

  // 4: rotina (alimentação, passeios e cuidados)
  `
  CREATE TABLE planos_alimentares (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    tipo_racao TEXT NOT NULL,
    quantidade_g INTEGER NOT NULL,
    horarios TEXT NOT NULL,
    inicio TEXT NOT NULL,
    fim TEXT,
    observacoes TEXT NOT NULL DEFAULT '',
    saco_g INTEGER,
    saco_aberto_em TEXT,
    lembretes INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE refeicoes_registro (
    id TEXT PRIMARY KEY NOT NULL,
    plano_id TEXT NOT NULL REFERENCES planos_alimentares(id),
    pet_id TEXT NOT NULL REFERENCES pets(id),
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE passeios (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    inicio TEXT NOT NULL,
    fim TEXT,
    duracao_min INTEGER,
    distancia_km REAL,
    observacao TEXT NOT NULL DEFAULT '',
    em_andamento INTEGER NOT NULL DEFAULT 0,
    pausa_total_s INTEGER NOT NULL DEFAULT 0,
    pausado_desde TEXT,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE marcacoes_passeio (
    id TEXT PRIMARY KEY NOT NULL,
    passeio_id TEXT NOT NULL REFERENCES passeios(id),
    tipo TEXT NOT NULL,
    horario TEXT NOT NULL,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE tipos_cuidado (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    nome TEXT NOT NULL,
    icone TEXT NOT NULL DEFAULT 'sparkles-outline',
    intervalo_dias INTEGER,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE registros_cuidado (
    id TEXT PRIMARY KEY NOT NULL,
    tipo_id TEXT NOT NULL REFERENCES tipos_cuidado(id),
    data TEXT NOT NULL,
    local TEXT NOT NULL DEFAULT '',
    observacao TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  -- Valor do cuidado: privado, em tabela separada (nunca entra em pacotes compartilhados).
  CREATE TABLE cuidados_privados (
    id TEXT PRIMARY KEY NOT NULL,
    registro_id TEXT NOT NULL REFERENCES registros_cuidado(id),
    valor_centavos INTEGER,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE INDEX idx_planos_pet ON planos_alimentares (pet_id, excluido_em);
  CREATE INDEX idx_refeicoes_dia ON refeicoes_registro (pet_id, data);
  CREATE INDEX idx_passeios_pet ON passeios (pet_id, inicio);
  CREATE INDEX idx_marcacoes_passeio ON marcacoes_passeio (passeio_id, excluido_em);
  CREATE INDEX idx_tipos_cuidado_pet ON tipos_cuidado (pet_id, excluido_em);
  CREATE INDEX idx_registros_cuidado_tipo ON registros_cuidado (tipo_id, data);
  -- Um valor privado ativo por registro. Parcial, para a exclusão lógica não bloquear um novo valor.
  CREATE UNIQUE INDEX idx_cuidados_priv_registro ON cuidados_privados (registro_id) WHERE excluido_em IS NULL;
  `,

  // 5: consultas_privadas sem UNIQUE na coluna (bloqueava informar o valor de novo depois de apagá-lo,
  // porque a exclusão é lógica). A tabela é recriada com os mesmos dados e um índice parcial.
  `
  CREATE TABLE consultas_privadas_nova (
    id TEXT PRIMARY KEY NOT NULL,
    consulta_id TEXT NOT NULL REFERENCES consultas(id),
    valor_centavos INTEGER,
    anotacoes TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  INSERT INTO consultas_privadas_nova
    (id, consulta_id, valor_centavos, anotacoes, criado_em, atualizado_em, excluido_em, autor_dispositivo_id)
  SELECT id, consulta_id, valor_centavos, anotacoes, criado_em, atualizado_em, excluido_em, autor_dispositivo_id
  FROM consultas_privadas;

  DROP TABLE consultas_privadas;
  ALTER TABLE consultas_privadas_nova RENAME TO consultas_privadas;

  CREATE UNIQUE INDEX idx_consultas_priv_consulta ON consultas_privadas (consulta_id) WHERE excluido_em IS NULL;
  `,

  // 6: lembretes avulsos da agenda (vacina, medicação, banho... que o tutor cria à mão)
  `
  CREATE TABLE lembretes_avulsos (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    tipo TEXT NOT NULL DEFAULT 'cuidado',
    titulo TEXT NOT NULL,
    data TEXT NOT NULL,
    hora TEXT NOT NULL DEFAULT '',
    repetir TEXT NOT NULL DEFAULT 'nao',
    antecedencia_dias INTEGER NOT NULL DEFAULT 3,
    observacao TEXT NOT NULL DEFAULT '',
    concluido_em TEXT,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE INDEX idx_lembretes_avulsos ON lembretes_avulsos (pet_id, data, excluido_em);
  `,

  // 7: galeria de fotos do pet e perfil do tutor (com os contatos de confiança)
  `
  CREATE TABLE fotos (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    uri TEXT NOT NULL,
    thumb_uri TEXT,
    legenda TEXT NOT NULL DEFAULT '',
    data TEXT NOT NULL,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE tutores (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL DEFAULT '',
    apelido TEXT NOT NULL DEFAULT '',
    telefone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    vet_nome TEXT NOT NULL DEFAULT '',
    vet_clinica TEXT NOT NULL DEFAULT '',
    vet_telefone TEXT NOT NULL DEFAULT '',
    petshop_nome TEXT NOT NULL DEFAULT '',
    petshop_telefone TEXT NOT NULL DEFAULT '',
    emergencia_nome TEXT NOT NULL DEFAULT '',
    emergencia_relacao TEXT NOT NULL DEFAULT '',
    emergencia_telefone TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE INDEX idx_fotos_pet ON fotos (pet_id, data, excluido_em);
  `,

  // 8: preferências do tutor (uma linha só por aparelho)
  `
  CREATE TABLE configuracao_app (
    id TEXT PRIMARY KEY NOT NULL,
    tema TEXT NOT NULL DEFAULT 'automatico',
    unidade_peso TEXT NOT NULL DEFAULT 'automatica',
    horario_padrao TEXT NOT NULL DEFAULT '09:00',
    antecedencia_dias INTEGER NOT NULL DEFAULT 3,
    meta_passeio_min INTEGER NOT NULL DEFAULT 30,
    sugerir_pesagem INTEGER NOT NULL DEFAULT 1,
    atalhos_painel TEXT NOT NULL DEFAULT 'passeio,peso,dose,cuidado,consulta,novoPet',
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );
  `,

  // 9: memorial (homenagens e linha do tempo)
  `
  CREATE TABLE homenagens (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    texto TEXT NOT NULL,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE TABLE marcos_memorial (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL REFERENCES pets(id),
    titulo TEXT NOT NULL,
    data TEXT,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT,
    autor_dispositivo_id TEXT
  );

  CREATE INDEX idx_homenagens_pet ON homenagens (pet_id, excluido_em);
  CREATE INDEX idx_marcos_memorial_pet ON marcos_memorial (pet_id, excluido_em);
  `,
  // 10: lembrete de backup e data do último backup gerado
  `
  ALTER TABLE configuracao_app ADD COLUMN lembrete_backup_dias INTEGER NOT NULL DEFAULT 30;
  ALTER TABLE configuracao_app ADD COLUMN ultimo_backup_em TEXT;
  `,
];
