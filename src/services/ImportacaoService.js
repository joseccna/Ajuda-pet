import { DeviceIdentity } from '../database/DeviceIdentity';
import { BackupRepository } from '../database/repositories/BackupRepository';
import {
  compararComLocal,
  espacoNecessario,
  itensVisiveis,
  linhasParaAplicar,
  petsDaPrevia,
  prepararFichaRecebida,
  resolverArquivos,
  resumirPrevia,
} from '../models/regrasBackup';
import { decifrar, ehCifrado } from '../utils/pacote/criptografia';
import { ErroPacote } from '../utils/pacote/ErroPacote';
import { LIMITE_TOTAL_BYTES, lerPacote } from '../utils/pacote/formatoPacote';
import { Arquivos } from './Arquivos';
import { backupService } from './BackupService';

/**
 * Importação de um .ajudapet em duas etapas:
 *  1. abrir(): lê o arquivo (pedindo a senha, se houver) e devolve uma PRÉVIA sem gravar nada;
 *  2. aplicar(): faz uma cópia de segurança, copia as fotos e grava tudo em uma transação só.
 *
 * Regras: registros novos entram; registros que já existem são atualizados só se o do arquivo for
 * mais recente (o mais novo ganha, nunca se apaga nada); registros recusados são contados e mostrados.
 * Ficha de outra pessoa entra como cópia à parte (marcada "ficha"), sem misturar com os seus pets.
 */
export class ImportacaoService {
  constructor({
    repo = new BackupRepository(),
    arquivos = new Arquivos(),
    backup = backupService,
    idDoAparelho = () => DeviceIdentity.id,
  } = {}) {
    this.repo = repo;
    this.arquivos = arquivos;
    this.backup = backup;
    this.idDoAparelho = idDoAparelho;
  }

  /** @returns {Promise<{sessao: object, previa: object}>} lança ErroPacote (SENHA_NECESSARIA, SENHA_INCORRETA...) */
  async abrir(uri, senha) {
    let bytes = this.arquivos.ler(uri);
    if (!bytes || bytes.length === 0) throw new ErroPacote('ARQUIVO_INVALIDO');
    if (bytes.length > LIMITE_TOTAL_BYTES) throw new ErroPacote('MUITO_GRANDE');
    if (ehCifrado(bytes)) bytes = await decifrar(bytes, senha);

    const {
      cabecalho,
      tabelas: recebidas,
      arquivos,
    } = lerPacote(bytes, {
      versaoEsquemaApp: this.repo.versaoDoEsquema(),
    });
    const tabelas = cabecalho.tipo === 'ficha' ? prepararFichaRecebida(recebidas) : recebidas;
    const { decisoes, ignoradas } = compararComLocal(tabelas, this.repo.idsLocais(), cabecalho.tipo);
    const resumo = resumirPrevia(decisoes);

    const previa = {
      tipo: cabecalho.tipo,
      geradoEm: cabecalho.geradoEm,
      mesmoAparelho: cabecalho.dispositivoOrigemId === this.idDoAparelho(),
      nadaDeNovo: resumo.nadaDeNovo,
      total: resumo.total,
      itens: itensVisiveis(resumo),
      pets: petsDaPrevia(decisoes),
      ignoradas,
      arquivos: arquivos.size,
    };
    return { sessao: { cabecalho, decisoes, arquivos }, previa };
  }

  /** Grava o que a prévia mostrou. Se qualquer etapa falhar, nada fica pela metade. */
  async aplicar(sessao, agora = new Date()) {
    const linhas = linhasParaAplicar(sessao.decisoes);
    if (linhas.length === 0) return { aplicadas: 0, falhas: [], copiaDeSeguranca: null };

    let bytesDeArquivos = 0;
    sessao.arquivos.forEach((b) => (bytesDeArquivos += b.length));
    if (this.arquivos.espacoLivre() < espacoNecessario(bytesDeArquivos)) throw new ErroPacote('SEM_ESPACO');

    const copia = await this.backup.copiaAntesDeImportar(agora);

    const criados = [];
    try {
      const locais = new Map();
      const localDoArquivo = (ref) => {
        if (locais.has(ref)) return locais.get(ref);
        const bytes = sessao.arquivos.get(ref);
        let uri = null;
        if (bytes) {
          const nome = ref.slice('arquivos/'.length);
          const gravado = this.arquivos.gravar(this.arquivos.pastaImportados, nome, bytes);
          uri = gravado.uri;
          if (gravado.criado) criados.push(uri);
        }
        locais.set(ref, uri);
        return uri;
      };

      // Só as linhas aceitas precisam de seus arquivos.
      const porTabela = {};
      linhas.forEach((l) => (porTabela[l.tabela] ??= []).push(l.linha));
      const resolvidas = resolverArquivos(porTabela, localDoArquivo);
      const mapa = new Map();
      for (const [tabela, lista] of Object.entries(resolvidas))
        lista.forEach((l) => mapa.set(`${tabela}:${l.id}`, l));
      const emOrdem = linhas
        .filter((l) => mapa.has(`${l.tabela}:${l.linha.id}`))
        .map((l) => ({ ...l, linha: mapa.get(`${l.tabela}:${l.linha.id}`) }));
      const semArquivo = linhas.length - emOrdem.length;

      const resultado = this.repo.aplicar(emOrdem);
      const falhas = [...resultado.falhas];
      if (semArquivo > 0)
        falhas.push({ tabela: '*', id: '', erro: `${semArquivo} registros sem o arquivo de foto` });
      return { aplicadas: resultado.aplicadas, falhas, copiaDeSeguranca: copia?.nome ?? null };
    } catch (e) {
      criados.forEach((uri) => this.arquivos.apagar(uri));
      throw e;
    }
  }
}

export const importacaoService = new ImportacaoService();
