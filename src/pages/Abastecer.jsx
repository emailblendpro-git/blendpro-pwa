import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Abastecer() {
  const { serial } = useParams();
  const navigate = useNavigate();
  const [maquina, setMaquina] = useState(null);
  const [qtd, setQtd] = useState('');
  const [observacao, setObservacao] = useState('');
  const [nomeAssinante, setNomeAssinante] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get(`/maquinas/${serial}`)
      .then((res) => setMaquina(res.data))
      .catch(() => setErro('Máquina não encontrada.'));
  }, [serial]);

  const handleSubmit = async () => {
    if (!qtd || parseFloat(qtd) <= 0) {
      setErro('Informe a quantidade abastecida.');
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      await api.post('/manutencoes', {
        numero_serie: serial,
        tipo_servico: 'Abastecimento',
        qtd_abastecida: parseFloat(qtd),
        observacao: observacao || null,
        nome_assinante: nomeAssinante || null,
      });
      setSucesso(true);
    } catch {
      setErro('Erro ao registrar abastecimento. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (sucesso) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.icone}>✅</p>
        <h2 style={styles.titulo}>Abastecimento registrado!</h2>
        <p style={styles.sub}>{serial}</p>
        <p style={styles.sub}>{qtd} litros</p>
        <button style={styles.botao} onClick={() => { setQtd(''); setObservacao(''); setNomeAssinante(''); setSucesso(false); }}>
          Novo Abastecimento
        </button>
        <button style={{ ...styles.botao, backgroundColor: '#334155', marginTop: '8px' }} onClick={() => navigate('/dashboard')}>
          Ir para Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <p style={styles.sub}>Abastecimento</p>

        {maquina ? (
          <div style={styles.infos}>
            <p style={styles.serial}>{maquina.numero_serie}</p>
            <p style={styles.cliente}>{maquina.nome_cliente || '—'}</p>
            <p style={styles.detalhe}>{maquina.nome_local || ''}</p>
          </div>
        ) : erro ? (
          <p style={styles.erro}>{erro}</p>
        ) : (
          <p style={styles.sub}>Carregando...</p>
        )}

        {maquina && (
          <>
            <input
              style={styles.input}
              type="number"
              placeholder="Quantidade (litros)"
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
              min="0"
              step="0.5"
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Nome do responsável (opcional)"
              value={nomeAssinante}
              onChange={(e) => setNomeAssinante(e.target.value)}
            />
            <textarea
              style={{ ...styles.input, resize: 'none' }}
              placeholder="Observação (opcional)"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
            {erro && <p style={styles.erro}>{erro}</p>}
            <button style={styles.botao} onClick={handleSubmit} disabled={enviando}>
              {enviando ? 'Registrando...' : '✅ Confirmar Abastecimento'}
            </button>
            <button style={{ ...styles.botao, backgroundColor: '#334155', marginTop: '8px' }} onClick={() => navigate('/dashboard')}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', padding: '20px', boxSizing: 'border-box' },
  card: { backgroundColor: '#1e293b', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' },
  titulo: { color: '#38bdf8', textAlign: 'center', margin: 0 },
  sub: { color: '#94a3b8', textAlign: 'center', margin: 0, fontSize: '14px' },
  icone: { textAlign: 'center', fontSize: '48px', margin: 0 },
  infos: { backgroundColor: '#0f172a', borderRadius: '10px', padding: '16px', textAlign: 'center' },
  serial: { color: '#38bdf8', fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0' },
  cliente: { color: '#f1f5f9', fontSize: '14px', margin: '0 0 2px 0' },
  detalhe: { color: '#94a3b8', fontSize: '12px', margin: 0 },
  input: { padding: '12px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '16px', width: '100%', boxSizing: 'border-box' },
  botao: { padding: '14px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  erro: { color: '#f87171', textAlign:'center', fontSize: '14px', margin: 0 },
};
