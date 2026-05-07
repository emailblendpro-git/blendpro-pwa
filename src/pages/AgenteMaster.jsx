import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

export default function AgenteMaster() {
  const navigate    = useNavigate();
  const { usuario } = useUsuario();
  const [mensagens, setMensagens] = useState([
    {
      role: 'assistant',
      content: `Olá, ${usuario?.nome?.split(' ')[0] || 'usuário'}! Sou o Assistente Financeiro BlendPro. Tenho acesso completo a todos os dados do sistema — faturamento, margens, custos, preços, pagamentos e muito mais. O que deseja analisar?`,
    },
  ]);
  const [input, setInput]           = useState('');
  const [carregando, setCarregando] = useState(false);
  const fimRef = useRef(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, carregando]);

  async function enviar(e) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || carregando) return;

    const novasMensagens = [...mensagens, { role: 'user', content: texto }];
    setMensagens(novasMensagens);
    setInput('');
    setCarregando(true);

    const historico = novasMensagens.slice(1, -1);

    try {
      const res = await api.post('/agente/master', { mensagem: texto, historico });
      setMensagens(prev => [...prev, { role: 'assistant', content: res.data.resposta }]);
    } catch (err) {
      const detalhe = err?.response?.data?.detalhe || err?.response?.data?.erro || err?.message || 'Erro desconhecido';
      setMensagens(prev => [...prev, { role: 'assistant', content: `Erro: ${detalhe}` }]);
    } finally {
      setCarregando(false);
    }
  }

  const sugestoes = [
    'Qual o faturamento e margem do mês atual?',
    'Quais máquinas ainda não tiveram reajuste de preço este ano?',
    'Há custos ou pagamentos pendentes?',
    'Compare o faturamento deste mês com o anterior.',
    'Quais máquinas estão com preço abaixo de R$ 40/L?',
  ];

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.btnVoltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={s.iconeHeader}>💼</span>
          <div>
            <div style={s.headerTitulo}>Assistente Financeiro</div>
            <div style={s.headerSub}>Acesso total — exclusivo Master</div>
          </div>
        </div>
        <span style={s.badgeMaster}>MASTER</span>
      </div>

      {/* Chat */}
      <div style={s.chat}>
        {mensagens.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
            {m.role === 'assistant' && <span style={s.avatarIA}>💼</span>}
            <div style={m.role === 'user' ? s.balaoUser : s.balaoIA}>
              {m.content.split('\n').map((linha, j) => (
                <span key={j}>{linha}<br /></span>
              ))}
            </div>
            {m.role === 'user' && <span style={s.avatarUser}>👤</span>}
          </div>
        ))}

        {carregando && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <span style={s.avatarIA}>💼</span>
            <div style={s.balaoIA}>
              <span style={s.digitando}>● ● ●</span>
            </div>
          </div>
        )}

        <div ref={fimRef} />
      </div>

      {/* Sugestões */}
      {mensagens.length === 1 && (
        <div style={s.sugestoes}>
          {sugestoes.map((sug, i) => (
            <button key={i} style={s.btnSugestao} onClick={() => setInput(sug)}>
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form style={s.formInput} onSubmit={enviar}>
        <input
          style={s.input}
          type="text"
          placeholder="Pergunte sobre faturamento, margens, custos, preços..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={carregando}
          autoFocus
        />
        <button
          type="submit"
          style={{ ...s.btnEnviar, opacity: carregando || !input.trim() ? 0.5 : 1 }}
          disabled={carregando || !input.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

const s = {
  container: {
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: '#f1f5f9',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 24px',
    backgroundColor: '#1e293b',
    borderBottom: '2px solid #f59e0b',
    flexShrink: 0,
  },
  btnVoltar: {
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '6px 10px',
  },
  iconeHeader: { fontSize: '28px' },
  headerTitulo: { color: '#f1f5f9', fontWeight: 'bold', fontSize: '15px' },
  headerSub:    { color: '#f59e0b', fontSize: '12px' },
  badgeMaster: {
    backgroundColor: '#f59e0b',
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '999px',
  },
  chat: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
  },
  avatarIA: {
    fontSize: '22px',
    marginRight: '8px',
    alignSelf: 'flex-end',
    flexShrink: 0,
  },
  avatarUser: {
    fontSize: '22px',
    marginLeft: '8px',
    alignSelf: 'flex-end',
    flexShrink: 0,
  },
  balaoIA: {
    backgroundColor: '#1e293b',
    border: '1px solid #f59e0b33',
    borderRadius: '16px 16px 16px 4px',
    padding: '12px 16px',
    maxWidth: '75%',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#e2e8f0',
  },
  balaoUser: {
    backgroundColor: '#92400e',
    borderRadius: '16px 16px 4px 16px',
    padding: '12px 16px',
    maxWidth: '75%',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#fff',
  },
  digitando: {
    color: '#f59e0b',
    letterSpacing: '4px',
  },
  sugestoes: {
    display: 'flex',
    gap: '8px',
    padding: '0 16px 12px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  btnSugestao: {
    background: 'none',
    border: '1px solid #f59e0b55',
    color: '#f59e0b',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  formInput: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
  },
  btnEnviar: {
    backgroundColor: '#b45309',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
