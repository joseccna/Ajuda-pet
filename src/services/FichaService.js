import * as Sharing from 'expo-sharing';
import { BackupRepository } from '../database/repositories/BackupRepository';
import { PetRepository } from '../database/repositories/PetRepository';
import { montarFichaHtml } from '../models/fichaHtml';
import { montarTabelasFicha, nomeDoArquivoDePacote, tabelasDoEscopo } from '../models/regrasBackup';
import { ErroPacote } from '../utils/pacote/ErroPacote';
import { Arquivos } from './Arquivos';
import { EmpacotadorService } from './EmpacotadorService';

/**
 * Ficha do pet para outras pessoas (veterinário, hotel, pet sitter, outro tutor).
 * Só sai o que o tutor marcar. Valores, anotações pessoais, memorial, galeria e perfil do tutor
 * nunca entram (ver TABELAS em regrasBackup).
 */
export class FichaService {
  constructor({
    repo = new BackupRepository(),
    pets = new PetRepository(),
    arquivos = new Arquivos(),
    empacotador = new EmpacotadorService({ repo, arquivos }),
    impressao = undefined,
    compartilhador = Sharing,
  } = {}) {
    this.repo = repo;
    this.pets = pets;
    this.arquivos = arquivos;
    this.empacotador = empacotador;
    this._impressao = impressao;
    this.compartilhador = compartilhador;
  }

  /** O módulo de PDF é carregado só quando precisa; se o ambiente não tiver, o app segue funcionando. */
  get impressao() {
    if (this._impressao === undefined) {
      try {
        this._impressao = require('expo-print');
      } catch {
        this._impressao = null;
      }
    }
    return this._impressao;
  }

  petsDisponiveis() {
    return this.pets.listarAtivos();
  }

  tabelas(petIds, secoes) {
    if (petIds.length === 0) throw new ErroPacote('SEM_DADOS');
    const lidas = this.repo.lerTabelas(tabelasDoEscopo('ficha', secoes));
    const filtradas = montarTabelasFicha(lidas, petIds, secoes);
    if ((filtradas.pets ?? []).length === 0) throw new ErroPacote('SEM_DADOS');
    return filtradas;
  }

  /** Ficha como arquivo .ajudapet, para quem também usa o app abrir como cópia somente leitura. */
  async gerarPacote({ petIds, secoes, agora = new Date() }) {
    const tabelas = this.tabelas(petIds, secoes);
    const nomePet = petIds.length === 1 ? tabelas.pets[0].nome : 'pets';
    return this.empacotador.empacotar({
      tipo: 'ficha',
      tabelas,
      nomeArquivo: nomeDoArquivoDePacote('ficha', agora, nomePet),
      agora,
    });
  }

  /** Ficha em PDF, para qualquer pessoa abrir ou imprimir. */
  async gerarPdf({ petIds, secoes, agora = new Date() }) {
    const tabelas = this.tabelas(petIds, secoes);
    const fotos = new Map();
    for (const p of tabelas.pets) {
      if (!p.foto_uri) continue;
      try {
        const b64 = this.arquivos.base64(p.foto_uri);
        if (b64) fotos.set(p.id, `data:image/jpeg;base64,${b64}`);
      } catch {
        // sem foto na ficha
      }
    }
    if (!this.impressao) {
      throw new Error(
        'A geração de PDF não está disponível neste ambiente. Escolha o formato "Arquivo do Ajuda Pet" ou use o app instalado (build).',
      );
    }
    const html = montarFichaHtml(tabelas, { geradoEm: agora, fotos });
    const { uri } = await this.impressao.printToFileAsync({ html });
    const nomePet = petIds.length === 1 ? tabelas.pets[0].nome : 'pets';
    const nome = nomeDoArquivoDePacote('ficha', agora, nomePet).replace('.ajudapet', '.pdf');
    const bytes = this.arquivos.ler(uri);
    const final = bytes ? this.arquivos.gravarTemporario(nome, bytes) : uri;
    return { uri: final, nome, mimeType: 'application/pdf' };
  }

  async compartilhar(arquivo, titulo = 'Enviar a ficha') {
    if (!(await this.compartilhador.isAvailableAsync())) {
      throw new Error('Este aparelho não tem o compartilhamento de arquivos disponível.');
    }
    await this.compartilhador.shareAsync(arquivo.uri, {
      mimeType: arquivo.mimeType ?? 'application/octet-stream',
      dialogTitle: titulo,
      UTI: arquivo.mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.data',
    });
  }
}

export const fichaService = new FichaService();
