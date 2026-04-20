import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Maquinas() {
  const navigate = useNavigate();
  const [maquinas, setMaquinas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get('/maquinas')
      .then((res) => setMaquinas(res.data))
      .catch(() => setMaquinas([]))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <button style={styles.botaoVoltar} onClick={() => navigate('/dashboard')}>
          ← Voltar
        </button>
      </div>
      <div style={styles.conteudo}>
        <h2 style={styles.pageTitulo}>Máquinas</h2>
        {carregando ? (
          <p style={styles.mensagem}>Carregando...</p>
        ) : maquinas.length === 0 ? (
          <p style={styles.mensagem}>Nenhuma máquina cadastrada.</p>
        ) : (
          <table style={styles.tabela}>
            <thead>
              <tr>
                <th style={styles.th}>Serial</th>
                <th style={styles.th}>Modelo</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Cliente</th>
              </tr>
            </thead>
            <tbody>
              {maquinas.map((m) => (
                <tr key={m.id} style={styles.tr}>
                  <td style={styles.td}>{m.serial}</td>
                  <td style={styles.td}>{m.modelo}</td>
                  <td style={styles.td}>{m.status}</td>
                  <td style={styles.td}>{m.cliente_id || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0f172a', minHeight: '100vh', color: '#f1f5f9' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  titulo: { color: '#38bdf8', margin: 0 },
  botaoVoltar: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  conteudo: { padding: '40px 32px' },
  pageTitulo: { color: '#f1f5f9', marginBottom: '24px' },
  mensagem: { color: '#94a3b8' },
  tabela: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #334155' },
  tr: { borderBottom: '1px solid #1e293b' },
  td: { padding: '12px 16px', color: '#f1f5f9', fontSize: '14px' },
};