import { zipSync, strToU8 } from 'fflate';
import { randomBytes } from 'crypto';
import { cifrar, decifrar, ehCifrado, validarSenha } from './criptografia';
import { ErroPacote } from './ErroPacote';
import { lerPacote, montarPacote, validarCabecalho } from './formatoPacote';

const aleatorio = (n) => new Uint8Array(randomBytes(n));
const cab = {
  tipo: 'backup',
  versaoEsquema: 10,
  geradoEm: '2026-10-20T10:00:00.000Z',
  pacoteId: 'abc-12345678',
  dispositivoOrigemId: 'd1',
};

async function erroDe(fn) {
  try {
    await fn();
  } catch (e) {
    return e;
  }
  return null;
}

describe('pacote .ajudapet (zip)', () => {
  it('guarda e devolve cabeçalho, tabelas e arquivos', () => {
    const foto = new Uint8Array([1, 2, 3, 4]);
    const bytes = montarPacote({
      cabecalho: cab,
      tabelas: { pets: [{ id: 'p1234567', nome: 'Luna' }] },
      arquivos: new Map([['arquivos/aaaa.jpg', foto]]),
    });
    const lido = lerPacote(bytes, { versaoEsquemaApp: 10 });
    expect(lido.cabecalho).toMatchObject({ formato: 'ajudapet', versaoFormato: 1, tipo: 'backup' });
    expect(lido.tabelas.pets[0].nome).toBe('Luna');
    expect([...lido.arquivos.get('arquivos/aaaa.jpg')]).toEqual([1, 2, 3, 4]);
  });

  it('aceita pacote de esquema mais antigo e recusa o de esquema ou formato mais novo', () => {
    const antigo = montarPacote({ cabecalho: { ...cab, versaoEsquema: 3 }, tabelas: {} });
    expect(() => lerPacote(antigo, { versaoEsquemaApp: 10 })).not.toThrow();
    const novo = montarPacote({ cabecalho: { ...cab, versaoEsquema: 11 }, tabelas: {} });
    expect(() => lerPacote(novo, { versaoEsquemaApp: 10 })).toThrow(
      expect.objectContaining({ codigo: 'VERSAO_NOVA' }),
    );
    const formatoNovo = montarPacote({ cabecalho: { ...cab, versaoFormato: 2 }, tabelas: {} });
    expect(() => lerPacote(formatoNovo, { versaoEsquemaApp: 10 })).toThrow(
      expect.objectContaining({ codigo: 'VERSAO_NOVA' }),
    );
  });

  it('recusa arquivos que não são pacotes ou estão corrompidos', () => {
    expect(() => lerPacote(strToU8('isto não é um zip'), { versaoEsquemaApp: 10 })).toThrow(
      expect.objectContaining({ codigo: 'ARQUIVO_INVALIDO' }),
    );
    const semDados = zipSync({ 'cabecalho.json': strToU8('{}') });
    expect(() => lerPacote(semDados, { versaoEsquemaApp: 10 })).toThrow(
      expect.objectContaining({ codigo: 'ARQUIVO_INVALIDO' }),
    );
    const jsonRuim = zipSync({ 'cabecalho.json': strToU8('{oops'), 'dados.json': strToU8('{}') });
    expect(() => lerPacote(jsonRuim, { versaoEsquemaApp: 10 })).toThrow(
      expect.objectContaining({ codigo: 'CORROMPIDO' }),
    );
    const outroApp = zipSync({
      'cabecalho.json': strToU8(JSON.stringify({ formato: 'outro' })),
      'dados.json': strToU8('{"tabelas":{}}'),
    });
    expect(() => lerPacote(outroApp, { versaoEsquemaApp: 10 })).toThrow(
      expect.objectContaining({ codigo: 'ARQUIVO_INVALIDO' }),
    );
    const cortado = montarPacote({ cabecalho: cab, tabelas: { pets: [] } }).slice(0, 40);
    expect(() => lerPacote(cortado, { versaoEsquemaApp: 10 })).toThrow(ErroPacote);
  });

  it('ignora entradas com nomes fora do padrão (como "../")', () => {
    const base = montarPacote({ cabecalho: cab, tabelas: {} });
    const maldoso = zipSync({
      'cabecalho.json': strToU8(JSON.stringify({ formato: 'ajudapet', versaoFormato: 1, ...cab })),
      'dados.json': strToU8('{"tabelas":{}}'),
      '../../fora.txt': strToU8('x'),
      'arquivos/../x.jpg': strToU8('x'),
      'arquivos/ok.jpg': strToU8('x'),
    });
    expect(base.length).toBeGreaterThan(0);
    const lido = lerPacote(maldoso, { versaoEsquemaApp: 10 });
    expect([...lido.arquivos.keys()]).toEqual(['arquivos/ok.jpg']);
  });

  it('não monta pacote com nome de arquivo inválido', () => {
    expect(() =>
      montarPacote({ cabecalho: cab, tabelas: {}, arquivos: new Map([['../x.jpg', new Uint8Array(1)]]) }),
    ).toThrow(ErroPacote);
  });

  it('valida o cabeçalho', () => {
    expect(() =>
      validarCabecalho(
        { ...cab, formato: 'ajudapet', versaoFormato: 1, tipo: 'x' },
        { versaoEsquemaApp: 10 },
      ),
    ).toThrow();
    expect(() => validarCabecalho(null, { versaoEsquemaApp: 10 })).toThrow();
  });
});

describe('senha do backup', () => {
  const conteudo = montarPacote({ cabecalho: cab, tabelas: { pets: [{ id: 'p1234567', nome: 'Luna' }] } });

  it('cifra e decifra com a mesma senha, e o arquivo cifrado não mostra o conteúdo', async () => {
    const cifrado = await cifrar(conteudo, 'minha senha', aleatorio, 10);
    expect(ehCifrado(cifrado)).toBe(true);
    expect(ehCifrado(conteudo)).toBe(false);
    expect(Buffer.from(cifrado).includes(Buffer.from('Luna'))).toBe(false);
    const aberto = await decifrar(cifrado, 'minha senha');
    expect(lerPacote(aberto, { versaoEsquemaApp: 10 }).tabelas.pets[0].nome).toBe('Luna');
  });

  it('usa os parâmetros padrão (mais lentos) sem erro', async () => {
    const cifrado = await cifrar(conteudo, 'abc123', aleatorio);
    expect([...(await decifrar(cifrado, 'abc123'))]).toEqual([...conteudo]);
  });

  it('senha errada e arquivo alterado são detectados', async () => {
    const cifrado = await cifrar(conteudo, 'certa123', aleatorio, 10);
    expect(await erroDe(() => decifrar(cifrado, 'errada1'))).toMatchObject({ codigo: 'SENHA_INCORRETA' });
    const alterado = new Uint8Array(cifrado);
    alterado[alterado.length - 5] ^= 1;
    expect(await erroDe(() => decifrar(alterado, 'certa123'))).toMatchObject({ codigo: 'SENHA_INCORRETA' });
    expect(await erroDe(() => decifrar(cifrado, ''))).toMatchObject({ codigo: 'SENHA_NECESSARIA' });
  });

  it('recusa arquivo cifrado incompleto ou com parâmetros absurdos', async () => {
    const cifrado = await cifrar(conteudo, 'certa123', aleatorio, 10);
    expect(await erroDe(() => decifrar(cifrado.slice(0, 20), 'certa123'))).toMatchObject({
      codigo: 'CORROMPIDO',
    });
    const pesado = new Uint8Array(cifrado);
    pesado[9] = 30; // log2(N) enorme: poderia travar o aparelho
    expect(await erroDe(() => decifrar(pesado, 'certa123'))).toMatchObject({ codigo: 'CORROMPIDO' });
    const futuro = new Uint8Array(cifrado);
    futuro[8] = 9;
    expect(await erroDe(() => decifrar(futuro, 'certa123'))).toMatchObject({ codigo: 'VERSAO_NOVA' });
  });

  it('as mesmas duas cifragens nunca dão o mesmo arquivo (sal e nonce novos)', async () => {
    const a = await cifrar(conteudo, 'certa123', aleatorio, 10);
    const b = await cifrar(conteudo, 'certa123', aleatorio, 10);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it('regras da senha escolhida', () => {
    expect(validarSenha('123', '123')).toMatch(/pelo menos/);
    expect(validarSenha('123456', '654321')).toMatch(/não são iguais/);
    expect(validarSenha('123456', '123456')).toBeNull();
  });
});
