import * as Sharing from 'expo-sharing';
import { BackupRepository } from '../database/repositories/BackupRepository';
import {
  NOMES_TABELAS,
  backupsParaApagar,
  dataParaNome,
  nomeDoArquivoDePacote,
  situacaoDoBackup,
} from '../models/regrasBackup';
import { Arquivos } from './Arquivos';
import { EmpacotadorService } from './EmpacotadorService';
import { preferenciasService } from './PreferenciasService';

const PASTA_AUTOMATICOS = 'backups-automaticos';
const MANTER_AUTOMATICOS = 3;

/** Backup completo do tutor: todos os pets, fotos, valores e anotações privadas, memorial, perfil. */
export class BackupService {
  constructor({
    repo = new BackupRepository(),
    arquivos = new Arquivos(),
    empacotador = new EmpacotadorService({ repo, arquivos }),
    preferencias = preferenciasService,
    compartilhador = Sharing,
  } = {}) {
    this.repo = repo;
    this.arquivos = arquivos;
    this.empacotador = empacotador;
    this.preferencias = preferencias;
    this.compartilhador = compartilhador;
  }

  /** Gera o arquivo de backup (opcionalmente com senha) na pasta temporária. */
  async gerar({ senha, agora = new Date() } = {}) {
    const tabelas = this.repo.lerTabelas(NOMES_TABELAS);
    return this.empacotador.empacotar({
      tipo: 'backup',
      tabelas,
      senha: senha || undefined,
      nomeArquivo: nomeDoArquivoDePacote('backup', agora),
      agora,
    });
  }

  /** Abre a janela de compartilhamento do sistema (Bluetooth, Quick Share, WhatsApp, Drive, e-mail...). */
  async compartilhar(arquivo, titulo = 'Salvar ou enviar o backup') {
    if (!(await this.compartilhador.isAvailableAsync())) {
      throw new Error('Este aparelho não tem o compartilhamento de arquivos disponível.');
    }
    await this.compartilhador.shareAsync(arquivo.uri, {
      mimeType: 'application/octet-stream',
      dialogTitle: titulo,
      UTI: 'public.data',
    });
  }

  /** Guarda a data do backup (usada no lembrete). */
  marcarBackupFeito(agora = new Date()) {
    this.preferencias.salvar({ ultimoBackupEm: agora.toISOString() });
  }

  situacao(hoje = new Date()) {
    const p = this.preferencias.obter();
    return situacaoDoBackup(p.ultimoBackupEm, p.lembreteBackupDias, hoje);
  }

  /**
   * Cópia de segurança dentro do app, feita antes de uma importação. Guarda as 3 mais recentes.
   * Devolve null se ainda não há nenhum dado para proteger.
   */
  async copiaAntesDeImportar(agora = new Date()) {
    if (!this.repo.temDados()) return null;
    const carimbo = `${dataParaNome(agora).replaceAll('-', '')}-${agora.toTimeString().slice(0, 8).replaceAll(':', '')}`;
    const nome = `auto-${carimbo}.ajudapet`;
    const resultado = await this.empacotador.empacotar({
      tipo: 'backup',
      tabelas: this.repo.lerTabelas(NOMES_TABELAS),
      nomeArquivo: nome,
      agora,
      destino: { pasta: PASTA_AUTOMATICOS },
    });
    const existentes = this.arquivos.listar(PASTA_AUTOMATICOS);
    for (const antigo of backupsParaApagar(
      existentes.map((e) => e.nome),
      MANTER_AUTOMATICOS,
    )) {
      const item = existentes.find((e) => e.nome === antigo);
      if (item) this.arquivos.apagar(item.uri);
    }
    return resultado;
  }
}

export const backupService = new BackupService();
