import { formatarDataBR } from '../utils/datas';
import { formatarPeso } from './regrasPeso';

/**
 * Monta o HTML da ficha do pet (para virar PDF). Recebe as tabelas já filtradas pela ficha
 * (montarTabelasFicha), então nada privado chega aqui. Todo texto digitado passa por escapar().
 */
export function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SEXOS = { macho: 'Macho', femea: 'Fêmea', desconhecido: 'Não informado' };
const CASTRADO = { sim: 'Sim', nao: 'Não', desconhecido: 'Não informado' };

function especie(p) {
  if (p.especie === 'cachorro') return 'Cachorro';
  if (p.especie === 'gato') return 'Gato';
  return p.especie_outra || 'Outro';
}

function linhaDado(rotulo, valor) {
  if (valor === undefined || valor === null || String(valor).trim() === '') return '';
  return `<tr><th scope="row">${escapar(rotulo)}</th><td>${escapar(valor)}</td></tr>`;
}

function tabela(cabecalhos, linhas) {
  if (linhas.length === 0) return '<p class="vazio">Nenhum registro.</p>';
  const cab = cabecalhos.map((c) => `<th scope="col">${escapar(c)}</th>`).join('');
  const corpo = linhas.map((l) => `<tr>${l.map((c) => `<td>${escapar(c)}</td>`).join('')}</tr>`).join('');
  return `<table class="lista"><thead><tr>${cab}</tr></thead><tbody>${corpo}</tbody></table>`;
}

const porData = (campo) => (a, b) => String(a[campo]).localeCompare(String(b[campo]));

function secaoVacinas(t, petId) {
  const tipos = (t.tipos_vacina ?? []).filter((v) => v.pet_id === petId);
  if (!t.tipos_vacina) return '';
  const blocos = tipos
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((tipo) => {
      const doses = (t.doses_vacina ?? [])
        .filter((d) => d.tipo_id === tipo.id)
        .sort(porData('data_aplicacao'));
      return `<h4>${escapar(tipo.nome)}</h4>${tabela(
        ['Dose', 'Data', 'Próxima', 'Lote', 'Veterinário'],
        doses.map((d) => [
          d.rotulo,
          formatarDataBR(d.data_aplicacao),
          formatarDataBR(d.proxima_dose_manual),
          d.lote,
          d.veterinario,
        ]),
      )}`;
    })
    .join('');
  return `<section><h3>Vacinas</h3>${blocos || '<p class="vazio">Nenhuma vacina registrada.</p>'}</section>`;
}

function secaoPeso(t, petId) {
  if (!t.registros_peso) return '';
  const lista = t.registros_peso.filter((r) => r.pet_id === petId).sort(porData('data'));
  return `<section><h3>Peso</h3>${tabela(
    ['Data', 'Peso', 'Observação'],
    lista.map((r) => [formatarDataBR(r.data), formatarPeso(r.peso_g), r.observacao]),
  )}</section>`;
}

function secaoAlimentacao(t, petId) {
  if (!t.planos_alimentares) return '';
  const lista = t.planos_alimentares.filter((p) => p.pet_id === petId).sort(porData('inicio'));
  return `<section><h3>Alimentação</h3>${tabela(
    ['Ração', 'Quantidade por refeição', 'Horários', 'Desde'],
    lista.map((p) => [
      p.tipo_racao,
      `${p.quantidade_g} g`,
      String(p.horarios ?? '')
        .split(',')
        .filter(Boolean)
        .join(', '),
      formatarDataBR(p.inicio),
    ]),
  )}</section>`;
}

function secaoCuidados(t, petId) {
  if (!t.tipos_cuidado) return '';
  const tipos = t.tipos_cuidado.filter((c) => c.pet_id === petId);
  const linhas = [];
  for (const tipo of tipos) {
    for (const r of (t.registros_cuidado ?? []).filter((x) => x.tipo_id === tipo.id)) {
      linhas.push([formatarDataBR(r.data), tipo.nome, r.local, r.observacao]);
    }
  }
  linhas.sort((a, b) => b[0].split('/').reverse().join('').localeCompare(a[0].split('/').reverse().join('')));
  return `<section><h3>Cuidados</h3>${tabela(['Data', 'Cuidado', 'Local', 'Observação'], linhas)}</section>`;
}

function secaoConsultas(t, petId) {
  if (!t.consultas) return '';
  const lista = t.consultas.filter((c) => c.pet_id === petId).sort(porData('data'));
  return `<section><h3>Consultas</h3>${tabela(
    ['Data', 'Motivo', 'Veterinário', 'Diagnóstico', 'Prescrição'],
    lista.map((c) => [formatarDataBR(c.data), c.motivo, c.veterinario, c.diagnostico, c.prescricao]),
  )}</section>`;
}

const ESTILO = `
  @page { size: A4; margin: 16mm; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1f2937; font-size: 11pt; line-height: 1.4; }
  h1 { font-size: 20pt; margin: 0 0 2px; }
  h2 { font-size: 16pt; margin: 0; }
  h3 { font-size: 13pt; margin: 18px 0 6px; border-bottom: 2px solid #0f766e; padding-bottom: 3px; }
  h4 { font-size: 11pt; margin: 10px 0 4px; }
  .pet { page-break-after: always; }
  .pet:last-of-type { page-break-after: auto; }
  .topo { display: flex; gap: 14px; align-items: center; margin-bottom: 10px; }
  .topo img { width: 96px; height: 96px; object-fit: cover; border-radius: 12px; }
  table { border-collapse: collapse; width: 100%; }
  table.dados th { text-align: left; width: 34%; font-weight: 600; padding: 3px 6px 3px 0; vertical-align: top; }
  table.dados td { padding: 3px 0; }
  table.lista th, table.lista td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: top; font-size: 10pt; }
  table.lista th { background: #f1f5f9; }
  .vazio { color: #64748b; margin: 4px 0; }
  .rodape { margin-top: 20px; font-size: 9pt; color: #64748b; }
`;

export function montarFichaHtml(tabelas, { geradoEm = new Date(), fotos = new Map() } = {}) {
  const pets = [...(tabelas.pets ?? [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const data = `${String(geradoEm.getDate()).padStart(2, '0')}/${String(geradoEm.getMonth() + 1).padStart(2, '0')}/${geradoEm.getFullYear()}`;
  const blocos = pets
    .map((p) => {
      const foto = fotos.get(p.id);
      return `<div class="pet">
  <div class="topo">
    ${foto ? `<img src="${escapar(foto)}" alt="Foto de ${escapar(p.nome)}">` : ''}
    <div><h1>Ficha do pet</h1><h2>${escapar(p.nome)}</h2></div>
  </div>
  <section><h3>Dados básicos</h3><table class="dados"><tbody>
    ${linhaDado('Espécie', especie(p))}
    ${linhaDado('Raça', p.raca)}
    ${linhaDado('Sexo', SEXOS[p.sexo])}
    ${linhaDado('Nascimento', p.nascimento ? `${formatarDataBR(p.nascimento)}${p.nascimento_aproximado ? ' (aproximado)' : ''}` : '')}
    ${linhaDado('Cor', p.cor)}
    ${linhaDado('Castrado', CASTRADO[p.castrado])}
    ${linhaDado('Microchip', p.microchip)}
    ${linhaDado('Observações', p.observacoes)}
  </tbody></table></section>
  ${secaoVacinas(tabelas, p.id)}${secaoPeso(tabelas, p.id)}${secaoAlimentacao(tabelas, p.id)}${secaoCuidados(tabelas, p.id)}${secaoConsultas(tabelas, p.id)}
  <p class="rodape">Gerada em ${data} pelo Ajuda Pet. Informações fornecidas pelo tutor; não substituem a carteirinha oficial nem a avaliação de um veterinário.</p>
</div>`;
    })
    .join('\n');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ficha do pet</title><style>${ESTILO}</style></head><body>${blocos}</body></html>`;
}
