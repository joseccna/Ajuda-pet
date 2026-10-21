import { getRandomBytes } from 'expo-crypto';
import { DeviceIdentity } from '../database/DeviceIdentity';
import { BackupRepository } from '../database/repositories/BackupRepository';
import { TABELAS, espacoNecessario, nomeNoPacote, referenciarArquivos } from '../models/regrasBackup';
import { novoId } from '../utils/id';
import { cifrar } from '../utils/pacote/criptografia';
import { ErroPacote } from '../utils/pacote/ErroPacote';
import { montarPacote } from '../utils/pacote/formatoPacote';
import { Arquivos } from './Arquivos';

/** Transforma tabelas + fotos em um arquivo .ajudapet (com senha, se pedida). Usado por backup e ficha. */
export class EmpacotadorService {
  constructor({
    repo = new BackupRepository(),
    arquivos = new Arquivos(),
    aleatorio = getRandomBytes,
    idDoAparelho = () => DeviceIdentity.id,
    gerarId = novoId,
  } = {}) {
    this.repo = repo;
    this.arquivos = arquivos;
    this.aleatorio = aleatorio;
    this.idDoAparelho = idDoAparelho;
    this.gerarId = gerarId;
  }

  /** Caminhos de arquivo citados pelas tabelas. */
  urisDasTabelas(tabelas) {
    const uris = new Set();
    for (const spec of TABELAS) {
      for (const linha of tabelas[spec.nome] ?? []) {
        for (const coluna of spec.arquivos ?? []) if (linha[coluna]) uris.add(linha[coluna]);
      }
    }
    return uris;
  }

  /**
   * @param {{tipo: 'backup'|'ficha', tabelas: object, senha?: string, nomeArquivo: string,
   *          agora?: Date, destino?: {pasta: string}}} p
   * Sem destino, o arquivo vai para a pasta temporária (para compartilhar).
   */
  async empacotar({ tipo, tabelas, senha, nomeArquivo, agora = new Date(), destino }) {
    const uris = this.urisDasTabelas(tabelas);
    let bytesDeFotos = 0;
    uris.forEach((u) => (bytesDeFotos += this.arquivos.tamanho(u)));
    if (this.arquivos.espacoLivre() < espacoNecessario(bytesDeFotos, JSON.stringify(tabelas).length)) {
      throw new ErroPacote('SEM_ESPACO');
    }

    const conteudo = new Map();
    const referencias = new Map();
    const nomeador = (uri) => {
      if (referencias.has(uri)) return referencias.get(uri);
      const bytes = this.arquivos.ler(uri);
      let ref = null;
      if (bytes) {
        ref = nomeNoPacote(bytes, uri);
        conteudo.set(ref, bytes);
      }
      referencias.set(uri, ref);
      return ref;
    };
    const { tabelas: comReferencias, semArquivo } = referenciarArquivos(tabelas, nomeador);

    const contagens = {};
    for (const [nome, linhas] of Object.entries(comReferencias)) {
      contagens[nome] = linhas.filter((l) => !l.excluido_em).length;
    }
    const cabecalho = {
      tipo,
      versaoEsquema: this.repo.versaoDoEsquema(),
      geradoEm: agora.toISOString(),
      dispositivoOrigemId: this.idDoAparelho(),
      pacoteId: this.gerarId(),
      resumo: {
        pets: contagens.pets ?? 0,
        registros: Object.values(contagens).reduce((a, b) => a + b, 0),
        arquivos: conteudo.size,
      },
    };
    let bytes = montarPacote({ cabecalho, tabelas: comReferencias, arquivos: conteudo });
    if (senha) bytes = await cifrar(bytes, senha, this.aleatorio);

    const uri = destino
      ? this.arquivos.gravar(destino.pasta, nomeArquivo, bytes).uri
      : this.arquivos.gravarTemporario(nomeArquivo, bytes);
    return {
      uri,
      nome: nomeArquivo,
      tamanho: bytes.length,
      criptografado: Boolean(senha),
      resumo: cabecalho.resumo,
      semArquivo,
    };
  }
}
