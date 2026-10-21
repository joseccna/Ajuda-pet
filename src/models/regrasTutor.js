/** Perfil do tutor e contatos. Funções puras. */

/** Só os números do telefone. */
export function soDigitos(texto) {
  return texto.replace(/\D/g, '');
}

/** "11912345678" vira "(11) 91234-5678" enquanto digita. Aceita fixo (10 dígitos) e celular (11). */
export function mascararTelefone(texto) {
  const d = soDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Vazio é válido. Com valor, precisa ter DDD e 8 ou 9 dígitos. */
export function lerTelefone(texto) {
  const d = soDigitos(texto);
  if (d === '') return { telefone: '' };
  if (d.length !== 10 && d.length !== 11)
    return { erro: 'Use o DDD e o número, por exemplo (11) 91234-5678.' };
  return { telefone: mascararTelefone(d) };
}

/** Endereço para o discador do celular: "tel:11912345678". */
export function linkDeTelefone(telefone) {
  const d = soDigitos(telefone);
  return d ? `tel:${d}` : '';
}

/** E-mail simples: vazio é válido; com valor, precisa ter @ e um ponto depois dele. */
export function lerEmail(texto) {
  const t = texto.trim();
  if (t === '') return { email: '' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))
    return { erro: 'Confira o e-mail, por exemplo maria@email.com.' };
  return { email: t };
}

/** Como o app chama o tutor: o apelido ou o primeiro nome. Vazio se nada foi informado. */
export function nomeParaSaudacao(tutor) {
  if (!tutor) return '';
  const apelido = (tutor.apelido ?? '').trim();
  if (apelido) return apelido;
  return (tutor.nome ?? '').trim().split(/\s+/)[0] ?? '';
}

/** "Bom dia, Ana" ou só "Bom dia". */
export function saudacaoComNome(saudacao, tutor) {
  const nome = nomeParaSaudacao(tutor);
  return nome ? `${saudacao}, ${nome}` : saudacao;
}

/** "MA" a partir de "Maria Alves"; "?" se vazio. */
export function iniciais(nome) {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
  return `${primeira}${ultima}`.toUpperCase();
}
