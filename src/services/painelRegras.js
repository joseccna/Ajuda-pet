import { DIAS_PROXIMOS } from '../models/Lembrete';

/**
 * Organiza os lembretes de todos os módulos para o painel do dia:
 * - hoje: atrasados (primeiro, os mais antigos) e os de hoje
 * - proximos: dos próximos dias
 * - porPet: quantos pendentes e quantos atrasados cada pet tem
 */
export function organizarPainel(lembretes) {
  const porDias = (a, b) => a.dias - b.dias || a.titulo.localeCompare(b.titulo, 'pt-BR');

  const hoje = lembretes.filter((l) => l.dias <= 0).sort(porDias);
  const proximos = lembretes.filter((l) => l.dias > 0 && l.dias <= DIAS_PROXIMOS).sort(porDias);

  const porPet = {};
  for (const l of [...hoje, ...proximos]) {
    const atual = porPet[l.petId] ?? { pendentes: 0, atrasados: 0 };
    atual.pendentes += 1;
    if (l.dias < 0) atual.atrasados += 1;
    porPet[l.petId] = atual;
  }
  return { hoje, proximos, porPet };
}

/** "2 lembretes pendentes", "1 lembrete pendente" ou "3 lembretes, 1 atrasado". */
export function descreverPendencias(pendencias) {
  if (!pendencias || pendencias.pendentes === 0) return '';
  const { pendentes, atrasados } = pendencias;
  const plural = pendentes === 1 ? 'lembrete' : 'lembretes';
  if (atrasados > 0) {
    return `${pendentes} ${plural}, ${atrasados} ${atrasados === 1 ? 'atrasado' : 'atrasados'}`;
  }
  return `${pendentes} ${plural} ${pendentes === 1 ? 'pendente' : 'pendentes'}`;
}
