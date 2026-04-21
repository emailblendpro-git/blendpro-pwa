import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Chamados() {
  const navigate = useNavigate();
  const [chamados, setChamados] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [form, setForm] = useState({
    titulo: '',
    numero_serie: '',
    prioridade: 'Normal',
    descricao: '',
  });

  const handleSubmit = async () => {
    if (!form.titulo) {
      alert('O Título é obrigatório.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/chamados', form);
      alert('Chamado aberto com sucesso!');
      setMostrarForm(false);
      setForm({ titulo: '', numero_serie: '', prioridade: 'Normal', descricao: '' });
      const res = await api.get('/chamados');
      setChamados(res.data);
    } catch (erro) {
      alert('Erro ao abrir chamado. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizarStatus = async (id, status) => {
    try {
      await api.patch(`/chamados/${id}`, { status });
      const res = await api.get('/chamados');
      setChamados(res.data);
      setChamadoSelecionado(null);
    } catch {
      alert('Erro ao atualizar chamado.');
    }
  };

  useEffect(() => {
    api.get('/chamados')
      .then((res) => setChamados(res.data))
      .catch(() => setChamados([]))
      .finally(() => setCarregando(false));

    api.get('/maquinas')
      .then((res) => setMaquinas(res.data))
      .catch(() => setMaquinas([]));
  }, []);

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleString('pt-BR');
  };

  const corPrioridade = (p) => {
    if (p === 'Alta') return '#ef4444';
    if (p === 'Normal') return '#f59e0b';
    return '#22c55e';
  };

  const corStatus = (s) => {
    if (s === 'Aberto') return '#ef4444';
    if (s === 'Em Andamento') return '#f59e0b';
    if (s === 'Resolvido') return '#22c55e';
    return '#94a3b8';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <button style={styles.botaoVoltar} onClick={() => navigate('/dashboard')}>
          ← Voltar
        </button>
      </div>
      <div style={styles.conteudo}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitulo}>Chamados Técnicos</h2>
          <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? '✕ Fechar' : '+ Novo Chamado'}
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitulo}>Novo Chamado</h3>
            <input style={styles.input} placeholder="Título *" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <select style={styles.input} value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })}>
              <option value="">Máquina (opcional)</option>
              {maquinas.map((m) => (
                <option key={m.id} value={m.numero_serie}>
                  {m.numero_serie} — {m.nome_cliente || 'Sem cliente'}
                </option>
              ))}
            </select>
            <select style={styles.input} value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}>
              <option value="Baixa">Baixa</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
            </select>
            <textarea style={styles.input} placeholder="Descrição do problema" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={4} />
            <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Abrir Chamado'}
            </button>
          </div>
        )}

        {chamadoSelecionado && (
          <div style={styles.painel}>
            <div style={styles.painelHeader}>
              <h3 style={styles.painelTitulo}>{chamadoSelecionado.titulo}</h3>
              <button style={styles.botaoFechar} onClick={() => setChamadoSelecionado(null)}>
                ✕ Fechar
              </button>
            </div>
            <div style={styles.painelGrid}>
              <div style={styles.painelCampo}><span style={styles.painelLabel}>Máquina</span><span>{chamadoSelecionado.numero_serie || '—'}</span></div>
              <div style={styles.painelCampo}><span style={styles.painelLabel}>Cliente</span><span>{chamadoSelecionado.nome_cliente || '—'}</span></div>
              <div style={styles.painelCampo}><span style={styles.painelLabel}>Aberto por</span><span>{chamadoSelecionado.aberto_por_nome || '—'}</span></div>
              <div style={styles.painelCampo}><span style={styles.painelLabel}>Data</span><span>{formatarData(chamadoSelecionado.created_at)}</span></div>
              <div style={styles.painelCampo}><span style={styles.painelLabel}>Prioridade</span><span style={{ color: corPrioridade(chamadoSelecionado.prioridade) }}>{chamadoSelecionado.prioridade}</span></div>
              <div style={styles.painelCampo}><span style={styles.painelLabel}>Status</span><span style={{ color: corStatus(chamadoSelecionado.status) }}>{chamadoSelecionado.status}</span></div>
              <div style={{ ...styles.painelCampo, gridColumn: '1 / -1' }}><span style={styles.painelLabel}>Descrição</span><span>{chamadoSelecionado.descricao || '—'}</span></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button style={{ ...styles.botaoAcao, backgroundColor: '#f59e0b' }} onClick={() => handleAtualizarStatus(chamadoSelecionado.id, 'Em Andamento')}>Em Andamento</button>
              <button style={{ ...styles.botaoAcao, backgroundColor: '#22c55e' }} onClick={() => handleAtualizarStatus(chamadoSelecionado.id, 'Resolvido')}>Resolvido</button>
              <button style={{ ...styles.botaoAcao, backgroundColor: '#94a3b8' }} onClick={() => handleAtualizarStatus(chamadoSelecionado.id, 'Fechado')}>Fechado</button>
            </div>
          </div>
        )}

        {carregando ? (
          <p style={styles.mensagem}>Carregando...</p>
        ) : chamados.length === 0 ? (
          <p style={styles.mensagem}>Nenhum chamado encontrado.</p>
        ) : (
          <table style={styles.tabela}>
            <thead>
              <tr>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Título</th>
                <th style={styles.th}>Máquina</th>
                <th style={styles.th}>Prioridade</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {chamados.map((c) => (
                <tr key={c.id} style={{ ...styles.tr, cursor: 'pointer' }} onClick={() => setChamadoSelecionado(c)}>
                  <td style={styles.td}>{formatarData(c.created_at)}</td>
                  <td style={styles.td}>{c.titulo}</td>
                  <td style={styles.td}>{c.numero_serie || '—'}</td>
                  <td style={styles.td}><span style={{ color: corPrioridade(c.prioridade) }}>{c.prioridade}</span></td>
                  <td style={styles.td}><span style={{ color: corStatus(c.status) }}>{c.status}</span></td>
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
  pageTitulo: { color: '#f1f5f9', marginBottom: 0 },
  mensagem: { color: '#94a3b8' },
  tabela: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #334155' },
  tr: { borderBottom: '1px solid #1e293b' },
  td: { padding: '12px 16px', color: '#f1f5f9', fontSize: '14px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  botaoNovo: { padding: '10px 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  form: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitulo: { color: '#38bdf8', margin: '0 0 8px 0' },
  input: { padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  botaoSalvar: { padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '8px' },
  painel: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '32px' },
  painelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  painelTitulo: { color: '#38bdf8', margin: 0 },
  painelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  painelCampo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  painelLabel: { color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' },
  botaoFechar: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  botaoAcao: { padding: '10px 16px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
};