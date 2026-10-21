import { useCallback, useState } from 'react';
import { backupService } from '../services/BackupService';
import { situacaoDoBackup } from '../models/regrasBackup';
import { usePreferencias } from './usePreferencias';

/** Situação do backup (nunca feito, em dia ou atrasado). Atualiza sozinha quando a preferência ou a data mudam. */
export function useSituacaoBackup() {
  const prefs = usePreferencias();
  return situacaoDoBackup(prefs.ultimoBackupEm, prefs.lembreteBackupDias, new Date());
}

/**
 * Gerar e compartilhar o backup. fase: ocioso | gerando | pronto | erro.
 * Depois de compartilhar, a data do backup é registrada (o lembrete recomeça a contar).
 */
export function useBackup() {
  const [fase, setFase] = useState('ocioso');
  const [arquivo, setArquivo] = useState(null);
  const [erro, setErro] = useState(null);
  const [compartilhado, setCompartilhado] = useState(false);

  const gerar = useCallback(async (senha) => {
    setFase('gerando');
    setErro(null);
    setCompartilhado(false);
    try {
      const gerado = await backupService.gerar({ senha: senha || undefined });
      setArquivo(gerado);
      setFase('pronto');
      return gerado;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar o backup.');
      setFase('erro');
      return null;
    }
  }, []);

  const compartilhar = useCallback(
    async (alvo = arquivo) => {
      if (!alvo) return false;
      setErro(null);
      try {
        await backupService.compartilhar(alvo);
        backupService.marcarBackupFeito();
        setCompartilhado(true);
        return true;
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Não foi possível compartilhar.');
        return false;
      }
    },
    [arquivo],
  );

  const reiniciar = useCallback(() => {
    setFase('ocioso');
    setArquivo(null);
    setErro(null);
    setCompartilhado(false);
  }, []);

  return { fase, arquivo, erro, compartilhado, gerar, compartilhar, reiniciar };
}
