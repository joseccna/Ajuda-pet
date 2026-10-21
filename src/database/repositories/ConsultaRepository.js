import { Consulta } from '../../models/Consulta';
import { DeviceIdentity } from '../DeviceIdentity';
import { BaseRepository } from './BaseRepository';

export class ConsultaRepository extends BaseRepository {
  tabela = 'consultas';

  deLinha(linha) {
    return Consulta.fromRow(linha);
  }

  listarPorPet(petId) {
    return this.db
      .getAllSync(
        'SELECT * FROM consultas WHERE pet_id = ? AND excluido_em IS NULL ORDER BY data DESC, hora DESC',
        [petId],
      )
      .map((l) => Consulta.fromRow(l));
  }

  /** Consultas de todos os pets ativos, para os lembretes. */
  listarDePetsAtivos() {
    return this.db
      .getAllSync(
        `SELECT c.* FROM consultas c JOIN pets p ON p.id = c.pet_id
         WHERE c.excluido_em IS NULL AND p.excluido_em IS NULL AND p.falecido = 0`,
      )
      .map((l) => Consulta.fromRow(l));
  }

  /** Veterinário e clínica da consulta mais recente do pet, para sugerir no próximo cadastro. */
  ultimoProfissional(petId) {
    const linha = this.db.getFirstSync(
      `SELECT veterinario, clinica FROM consultas
       WHERE pet_id = ? AND excluido_em IS NULL AND (veterinario != '' OR clinica != '')
       ORDER BY data DESC LIMIT 1`,
      [petId],
    );
    return linha ? { veterinario: linha.veterinario, clinica: linha.clinica } : null;
  }

  /** Exclusão lógica da consulta e de tudo que depende dela (parte privada e anexos). */
  excluirComDependencias(id) {
    const agora = new Date().toISOString();
    const quem = DeviceIdentity.id;
    for (const tabela of ['consultas_privadas', 'anexos_consulta']) {
      this.db.runSync(
        `UPDATE ${tabela} SET excluido_em = ?, atualizado_em = ?, autor_dispositivo_id = ?
         WHERE consulta_id = ? AND excluido_em IS NULL`,
        [agora, agora, quem, id],
      );
    }
    this.excluir(id);
  }
}
