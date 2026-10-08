// Datas no fuso do navegador (toISOString() devolve UTC e vira "amanhã" à noite no Brasil)
const pad = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' de hoje, no fuso local
export const hojeLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// 'YYYY-MM-DDTHH:mm' de agora, no fuso local (para <input type="datetime-local">)
export const agoraLocalInput = () => {
  const d = new Date();
  return `${hojeLocal()}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
