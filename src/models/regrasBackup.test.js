import { escapar, montarFichaHtml } from './fichaHtml';
import {
  backupsParaApagar,
  compararComLocal,
  idDeFicha,
  linhasParaAplicar,
  montarTabelasFicha,
  motivoDeRejeicao,
  nomeDoArquivoDePacote,
  nomeNoPacote,
  petsDaPrevia,
  planejarLembreteBackup,
  prepararFichaRecebida,
  referenciarArquivos,
  resolverArquivos,
  resumirPrevia,
  situacaoDoBackup,
  tabelasDoEscopo,
  textoDaSituacao,
  textoDoItem,
} from './regrasBackup';

const T0 = '2026-10-01T10:00:00.000Z';
const T1 = '2026-10-02T10:00:00.000Z';
const T2 = '2026-10-03T10:00:00.000Z';
const base = (id, extra = {}) => ({
  id,
  criado_em: T0,
  atualizado_em: T0,
  excluido_em: null,
  autor_dispositivo_id: 'dev-origem',
  ...extra,
});

function dadosCompletos() {
  return {
    tutores: [base('tutor-0001', { nome: 'Ana' })],
    pets: [
      base('pet-luna-1', {
        nome: 'Luna',
        foto_uri: 'file:///doc/fotos/luna.jpg',
        dono_dispositivo_id: 'dev-origem',
        origem: 'proprio',
      }),
      base('pet-thor-1', { nome: 'Thor' }),
    ],
    tipos_vacina: [
      base('vac-v8-001', { pet_id: 'pet-luna-1', nome: 'V8' }),
      base('vac-x-0001', { pet_id: 'pet-thor-1', nome: 'Raiva' }),
    ],
    doses_vacina: [
      base('dose-0001', { tipo_id: 'vac-v8-001', rotulo: '1ª dose', data_aplicacao: '2026-01-10' }),
    ],
    registros_peso: [base('peso-0001', { pet_id: 'pet-luna-1', peso_g: 28000, data: '2026-09-01' })],
    consultas: [base('cons-0001', { pet_id: 'pet-luna-1', data: '2026-09-03', motivo: 'Pele' })],
    consultas_privadas: [
      base('cpriv-001', { consulta_id: 'cons-0001', valor_centavos: 28000, anotacoes: 'segredo' }),
    ],
    anexos_consulta: [
      base('anx-pub-01', { consulta_id: 'cons-0001', uri: 'file:///doc/anexos/a.jpg', privado: 0 }),
      base('anx-priv-1', { consulta_id: 'cons-0001', uri: 'file:///doc/anexos/b.jpg', privado: 1 }),
    ],
    planos_alimentares: [
      base('plano-001', {
        pet_id: 'pet-luna-1',
        tipo_racao: 'Premium',
        quantidade_g: 200,
        horarios: '08:00,18:00',
        inicio: '2026-01-01',
      }),
    ],
    refeicoes_registro: [
      base('ref-00001', {
        plano_id: 'plano-001',
        pet_id: 'pet-luna-1',
        data: '2026-09-01',
        horario: '08:00',
      }),
    ],
    passeios: [base('passeio-1', { pet_id: 'pet-luna-1', inicio: '2026-09-01T08:00:00' })],
    marcacoes_passeio: [],
    tipos_cuidado: [base('cuid-0001', { pet_id: 'pet-luna-1', nome: 'Banho' })],
    registros_cuidado: [base('rcuid-001', { tipo_id: 'cuid-0001', data: '2026-09-05' })],
    cuidados_privados: [base('cpv-00001', { registro_id: 'rcuid-001', valor_centavos: 8000 })],
    lembretes_avulsos: [base('lemb-0001', { pet_id: 'pet-luna-1' })],
    fotos: [
      base('foto-0001', {
        pet_id: 'pet-luna-1',
        uri: 'file:///doc/galeria/1.jpg',
        thumb_uri: 'file:///doc/miniaturas/1.jpg',
      }),
    ],
    homenagens: [base('hom-00001', { pet_id: 'pet-luna-1', texto: 'saudade' })],
    marcos_memorial: [base('marco-001', { pet_id: 'pet-luna-1', titulo: 'Primeiro dia' })],
  };
}

describe('escopo da ficha', () => {
  it('nunca inclui tabelas privadas, memorial, galeria, passeios nem perfil do tutor', () => {
    const todas = tabelasDoEscopo('ficha', ['vacinas', 'peso', 'alimentacao', 'cuidados', 'consultas']);
    for (const proibida of [
      'consultas_privadas',
      'cuidados_privados',
      'homenagens',
      'marcos_memorial',
      'fotos',
      'passeios',
      'tutores',
      'lembretes_avulsos',
      'refeicoes_registro',
    ]) {
      expect(todas).not.toContain(proibida);
    }
    expect(todas).toContain('pets');
  });

  it('só inclui as seções marcadas; dados básicos sempre', () => {
    expect(tabelasDoEscopo('ficha', [])).toEqual(['pets']);
    expect(tabelasDoEscopo('ficha', ['peso'])).toEqual(['pets', 'registros_peso']);
  });

  it('o backup completo leva tudo, privado incluído', () => {
    const t = tabelasDoEscopo('backup');
    expect(t).toEqual(
      expect.arrayContaining(['consultas_privadas', 'cuidados_privados', 'homenagens', 'tutores']),
    );
  });
});

describe('montarTabelasFicha', () => {
  const secoes = ['vacinas', 'peso', 'alimentacao', 'cuidados'];

  it('leva só o pet escolhido, sem valores, anotações, anexos privados nem consultas (desligadas)', () => {
    const f = montarTabelasFicha(dadosCompletos(), ['pet-luna-1'], secoes);
    expect(f.pets.map((p) => p.nome)).toEqual(['Luna']);
    expect(f.tipos_vacina.map((v) => v.nome)).toEqual(['V8']);
    expect(f.consultas).toBeUndefined();
    expect(f.consultas_privadas).toBeUndefined();
    expect(f.cuidados_privados).toBeUndefined();
    expect(JSON.stringify(f)).not.toMatch(/segredo|valor_centavos/);
  });

  it('com consultas ligadas, o anexo privado e o valor continuam de fora', () => {
    const f = montarTabelasFicha(dadosCompletos(), ['pet-luna-1'], [...secoes, 'consultas']);
    expect(f.consultas).toHaveLength(1);
    expect(f.anexos_consulta.map((a) => a.id)).toEqual(['anx-pub-01']);
    expect(JSON.stringify(f)).not.toContain('segredo');
    expect(f.consultas_privadas).toBeUndefined();
  });

  it('tira a identificação dos aparelhos e ignora registros apagados', () => {
    const dados = dadosCompletos();
    dados.registros_peso.push(
      base('peso-0002', { pet_id: 'pet-luna-1', peso_g: 1, data: '2026-09-02', excluido_em: T1 }),
    );
    const f = montarTabelasFicha(dados, ['pet-luna-1'], secoes);
    expect(f.pets[0].dono_dispositivo_id).toBeNull();
    expect(f.pets[0].autor_dispositivo_id).toBeNull();
    expect(f.registros_peso.map((p) => p.id)).toEqual(['peso-0001']);
  });
});

describe('arquivos no pacote', () => {
  it('troca caminhos por referências e descarta linhas cujo arquivo obrigatório sumiu', () => {
    const dados = dadosCompletos();
    const existentes = {
      'file:///doc/fotos/luna.jpg': 'arquivos/aa.jpg',
      'file:///doc/anexos/a.jpg': 'arquivos/bb.jpg',
    };
    const { tabelas, semArquivo } = referenciarArquivos(
      { pets: dados.pets, anexos_consulta: dados.anexos_consulta, fotos: dados.fotos },
      (uri) => existentes[uri] ?? null,
    );
    expect(tabelas.pets[0].foto_uri).toBe('arquivos/aa.jpg');
    expect(tabelas.anexos_consulta.map((a) => a.id)).toEqual(['anx-pub-01']);
    expect(tabelas.fotos).toEqual([]);
    expect(semArquivo).toBe(3);
  });

  it('na importação, só vale referência de dentro do pacote; caminhos de fora são descartados', () => {
    const tabelas = {
      pets: [
        { id: 'a', foto_uri: 'arquivos/ok.jpg' },
        { id: 'b', foto_uri: 'file:///data/user/0/outro-app/segredo.db' },
        { id: 'c', foto_uri: 'arquivos/ausente.jpg' },
      ],
      anexos_consulta: [{ id: 'd', uri: '/etc/passwd' }],
    };
    const r = resolverArquivos(tabelas, (ref) =>
      ref === 'arquivos/ok.jpg' ? 'file:///doc/importados/ok.jpg' : null,
    );
    expect(r.pets.map((p) => p.foto_uri)).toEqual(['file:///doc/importados/ok.jpg', null, null]);
    expect(r.anexos_consulta).toEqual([]);
  });

  it('o nome vem do conteúdo: fotos iguais viram um arquivo só', () => {
    const a = nomeNoPacote(new Uint8Array([1, 2, 3]), 'file:///x/foto.JPG');
    const b = nomeNoPacote(new Uint8Array([1, 2, 3]), 'file:///y/outra.jpg');
    const c = nomeNoPacote(new Uint8Array([9]), 'file:///y/outra.jpg');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^arquivos\/[0-9a-f]{24}\.jpg$/);
    expect(nomeNoPacote(new Uint8Array([1]), 'file:///x/sem-extensao')).toMatch(/\.bin$/);
    expect(nomeNoPacote(new Uint8Array([1]), 'file:///x/a.exe')).toMatch(/\.bin$/);
  });
});

describe('ficha recebida', () => {
  it('vira cópia à parte: ids determinísticos, vínculos refeitos, pet marcado como ficha', () => {
    const f = montarTabelasFicha(dadosCompletos(), ['pet-luna-1'], ['vacinas']);
    const a = prepararFichaRecebida(f);
    const b = prepararFichaRecebida(f);
    expect(a).toEqual(b);
    expect(a.pets[0].id).toBe(idDeFicha('pet-luna-1'));
    expect(a.pets[0].id).not.toBe('pet-luna-1');
    expect(a.pets[0].origem).toBe('ficha');
    expect(a.pets[0].dono_dispositivo_id).toBeNull();
    expect(a.tipos_vacina[0].pet_id).toBe(a.pets[0].id);
    expect(a.doses_vacina[0].tipo_id).toBe(a.tipos_vacina[0].id);
    expect(a.pets[0].autor_dispositivo_id).toBeNull();
  });
});

describe('comparar com o que já existe', () => {
  const locais = (obj) =>
    Object.fromEntries(Object.entries(obj).map(([t, m]) => [t, new Map(Object.entries(m))]));

  it('classifica novo, atualizado, igual e "mais novo aqui"', () => {
    const tabelas = {
      pets: [
        base('pet-novo-01', { nome: 'Novo' }),
        base('pet-atual-1', { nome: 'Mudou', atualizado_em: T2 }),
        base('pet-igual-1', { nome: 'Igual', atualizado_em: T1 }),
        base('pet-velho-1', { nome: 'Velho', atualizado_em: T0 }),
      ],
    };
    const { decisoes } = compararComLocal(
      tabelas,
      locais({
        pets: {
          'pet-atual-1': { atualizado_em: T1 },
          'pet-igual-1': { atualizado_em: T1 },
          'pet-velho-1': { atualizado_em: T2 },
        },
      }),
    );
    expect(decisoes.pets.map((d) => d.acao)).toEqual(['inserir', 'atualizar', 'igual', 'manter']);
    const r = resumirPrevia(decisoes);
    expect(r.total).toMatchObject({ novos: 1, alterados: 1, iguais: 1, mantidos: 1, rejeitados: 0 });
    expect(r.nadaDeNovo).toBe(false);
    expect(petsDaPrevia(decisoes).map((p) => [p.nome, p.acao])).toEqual([
      ['Novo', 'inserir'],
      ['Mudou', 'atualizar'],
      ['Igual', 'igual'],
      ['Velho', 'manter'],
    ]);
  });

  it('"nada de novo" quando tudo já está aqui', () => {
    const d = dadosCompletos();
    const loc = {};
    for (const [t, linhas] of Object.entries(d))
      loc[t] = new Map(linhas.map((l) => [l.id, { atualizado_em: l.atualizado_em }]));
    const { decisoes } = compararComLocal(d, loc);
    expect(resumirPrevia(decisoes).nadaDeNovo).toBe(true);
    expect(linhasParaAplicar(decisoes)).toEqual([]);
  });

  it('recusa registro sem o principal, repetido ou mal formado, e os filhos dele', () => {
    const tabelas = {
      pets: [base('pet-ok-001'), base('pet-ok-001'), { id: 'x', nome: 'sem datas' }, null],
      tipos_vacina: [
        base('vac-orfa-1', { pet_id: 'pet-inexistente', nome: 'Órfã' }),
        base('vac-boa-01', { pet_id: 'pet-ok-001', nome: 'Boa' }),
      ],
      doses_vacina: [
        base('dose-orfa1', { tipo_id: 'vac-orfa-1' }),
        base('dose-boa-1', { tipo_id: 'vac-boa-01' }),
      ],
    };
    const { decisoes } = compararComLocal(tabelas, {});
    expect(decisoes.pets.map((d) => d.acao)).toEqual(['inserir', 'rejeitar', 'rejeitar', 'rejeitar']);
    expect(decisoes.tipos_vacina.map((d) => d.acao)).toEqual(['rejeitar', 'inserir']);
    expect(decisoes.doses_vacina.map((d) => d.acao)).toEqual(['rejeitar', 'inserir']);
    expect(resumirPrevia(decisoes).total.rejeitados).toBe(5);
  });

  it('aceita filho cujo principal já existe só neste aparelho', () => {
    const { decisoes } = compararComLocal(
      { tipos_vacina: [base('vac-nova-01', { pet_id: 'pet-aqui-01' })] },
      locais({ pets: { 'pet-aqui-01': { atualizado_em: T0 } } }),
    );
    expect(decisoes.tipos_vacina[0].acao).toBe('inserir');
  });

  it('ignora tabelas desconhecidas e, em ficha, também as privadas', () => {
    const { decisoes, ignoradas } = compararComLocal(
      {
        sqlite_master: [base('xxxxxxxx')],
        pets: [base('pet-ok-001')],
        consultas_privadas: [base('cpriv-001', { consulta_id: 'c' })],
        tutores: [base('tutor-001')],
      },
      {},
      'ficha',
    );
    expect(ignoradas.sort()).toEqual(['consultas_privadas', 'sqlite_master', 'tutores']);
    expect(decisoes.consultas_privadas).toBeUndefined();
    expect(decisoes.tutores).toBeUndefined();
  });

  it('apagado mais recente vira "removido"; apagado desconhecido entra em silêncio', () => {
    const tabelas = {
      pets: [
        base('pet-del-001', { excluido_em: T2, atualizado_em: T2 }),
        base('pet-del-002', { excluido_em: T2, atualizado_em: T2 }),
      ],
    };
    const { decisoes } = compararComLocal(
      tabelas,
      locais({ pets: { 'pet-del-001': { atualizado_em: T0 } } }),
    );
    const r = resumirPrevia(decisoes);
    expect(r.total).toMatchObject({ removidos: 1, novos: 0 });
    expect(petsDaPrevia(decisoes)).toEqual([]);
  });

  it('textos curtos da prévia', () => {
    expect(textoDoItem({ novos: 2, alterados: 1, removidos: 0, mantidos: 3, rejeitados: 1 })).toBe(
      '2 novos, 1 atualizado, 3 já estão mais recentes aqui, 1 recusado',
    );
  });

  it('valida tipos de valor das linhas', () => {
    expect(motivoDeRejeicao(base('abcdefgh', { x: { a: 1 } }))).toBe('valor não aceito');
    expect(motivoDeRejeicao(base('abcdefgh', { x: true }))).toBe('valor não aceito');
    expect(motivoDeRejeicao(base('abc'))).toBe('identificador inválido');
    expect(motivoDeRejeicao(base('abc; DROP TABLE pets'))).toBe('identificador inválido');
    expect(motivoDeRejeicao(base('abcdefgh', { x: 'a'.repeat(100001) }))).toBe('valor não aceito');
    expect(motivoDeRejeicao(base('abcdefgh', { x: 'ok', y: 3, z: null }))).toBeNull();
  });
});

describe('lembrete, nomes e cópias automáticas', () => {
  const hoje = new Date(2026, 9, 20, 12, 0);

  it('situação do backup', () => {
    expect(situacaoDoBackup(null, 30, hoje)).toEqual({ nunca: true, dias: null, devido: true });
    expect(situacaoDoBackup(null, 0, hoje).devido).toBe(false);
    expect(situacaoDoBackup(new Date(2026, 9, 1).toISOString(), 30, hoje)).toMatchObject({
      dias: 19,
      devido: false,
    });
    expect(situacaoDoBackup(new Date(2026, 8, 1).toISOString(), 30, hoje)).toMatchObject({
      dias: 49,
      devido: true,
    });
    expect(situacaoDoBackup(new Date(2026, 8, 1).toISOString(), 0, hoje).devido).toBe(false);
    expect(textoDaSituacao({ nunca: true })).toBe('Você ainda não fez backup');
    expect(textoDaSituacao({ nunca: false, dias: 0 })).toBe('Último backup: hoje');
    expect(textoDaSituacao({ nunca: false, dias: 1 })).toBe('Último backup: ontem');
    expect(textoDaSituacao({ nunca: false, dias: 12 })).toBe('Último backup: há 12 dias');
  });

  it('planeja o aviso para o dia em que completa o intervalo, ou amanhã se já passou', () => {
    const ultimo = new Date(2026, 9, 10, 15, 0).toISOString();
    const p = planejarLembreteBackup(ultimo, 30, hoje, '09:00');
    expect(p.quando).toEqual(new Date(2026, 10, 9, 9, 0));
    expect(p.rota.pathname).toBe('/backup');
    const atrasado = planejarLembreteBackup(new Date(2026, 7, 1).toISOString(), 30, hoje, '09:00');
    expect(atrasado.quando).toEqual(new Date(2026, 9, 21, 9, 0));
    const nunca = planejarLembreteBackup(null, 30, hoje, '09:00');
    expect(nunca.quando).toEqual(new Date(2026, 10, 19, 9, 0));
    expect(planejarLembreteBackup(null, 0, hoje)).toBeNull();
  });

  it('nome dos arquivos', () => {
    expect(nomeDoArquivoDePacote('backup', hoje)).toBe('AjudaPet-backup-2026-10-20.ajudapet');
    expect(nomeDoArquivoDePacote('ficha', hoje, 'Mel Ção/../x')).toBe('Ficha-Mel-Cao-x-2026-10-20.ajudapet');
    expect(nomeDoArquivoDePacote('ficha', hoje, '')).toBe('Ficha-pet-2026-10-20.ajudapet');
  });

  it('mantém só as 3 cópias automáticas mais recentes', () => {
    const nomes = [
      'auto-20260101-100000.ajudapet',
      'auto-20260301-100000.ajudapet',
      'auto-20260201-100000.ajudapet',
      'auto-20260401-100000.ajudapet',
      'auto-20251201-100000.ajudapet',
    ];
    expect(backupsParaApagar(nomes, 3).sort()).toEqual([
      'auto-20251201-100000.ajudapet',
      'auto-20260101-100000.ajudapet',
    ]);
    expect(backupsParaApagar(nomes.slice(0, 2), 3)).toEqual([]);
  });
});

describe('ficha em PDF (HTML)', () => {
  it('escapa texto digitado e mostra só o que veio na ficha', () => {
    expect(escapar('<b>"a" & \'b\'</b>')).toBe('&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
    const f = montarTabelasFicha(dadosCompletos(), ['pet-luna-1'], ['vacinas', 'peso']);
    f.pets[0].nome = 'Luna <script>alert(1)</script>';
    f.pets[0].observacoes = 'Alérgica a frango';
    const html = montarFichaHtml(f, {
      geradoEm: new Date(2026, 9, 20),
      fotos: new Map([['pet-luna-1', 'data:image/jpeg;base64,AAAA']]),
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('Luna &lt;script&gt;');
    expect(html).toContain('Alérgica a frango');
    expect(html).toContain('V8');
    expect(html).toContain('1ª dose');
    expect(html).toContain('28 kg');
    expect(html).toContain('20/10/2026');
    expect(html).toContain('data:image/jpeg;base64,AAAA');
    expect(html).not.toContain('Consultas');
    expect(html).not.toContain('segredo');
  });
});
