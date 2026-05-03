import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Prestadores() {
  const navigate = useNavigate();
  const [prestadores, setPrestadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const formVazio = {
    nome: '', tipo: '', documento: '', email: '', telefone: '',
    banco: '', agencia: '', conta: '', tipo_conta: '', chave_pix: '', observacao: ''
  };
  const [form, setForm] = useState(formVazio);

  useEffect(() => { carregarPrestadores(); }, []);

  const carregarPrestadores = async () => {
    try {
      setCarregando(true);
      const res = await api.get('/prestadores');
      setPrestadores(res.data);
    } catch { setPrestadores([]); }
    finally { setCarregando(false); }
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.tipo) { alert('Nome e tipo são obrigatórios.'); return; }
    setSalvando(true);
    try {
      if (editando) {
        await api.patch(`/prestadores/${editando}`, form);
        alert('Prestador atualizado!');
      } else {
        await api.post('/prestadores', form);
        alert('Prestador cadastrado!');
      }
      setMostrarForm(false);
      setEditando(null);
      setForm(formVazio);
      await carregarPrestadores();
    } catch { alert('Erro ao salvar prestador.'); }
    finally { setSalvando(false); }
  };

  const handleEditar = (p) => {
    setForm({
      nome: p.nome || '', tipo: p.tipo || '', documento: p.documento || '',
      email: p.email || '', telefone: p.telefone || '', banco: p.banco || '',
      agencia: p.agencia || '', conta: p.conta || '', tipo_conta: p.tipo_conta || '',
      chave_pix: p.chave_pix || '', observacao: p.observacao || ''
    });
    setEditando(p.id);
    setMostrarForm(true);
  };

  const tipoColor = (tipo) => {
    const cores = { Operador: '#0ea5e9', Vendedor: '#22c55e', Transportador: '#f59e0b', Fornecedor: '#a855f7', Outro: '#94a3b8' };
    return cores[tipo] || '#94a3b8';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <button style={styles.botaoVoltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
      </div>
      <div style={styles.conteudo}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitulo}>Prestadores</h2>
          <button style={styles.botaoNovo} onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); setForm(formVazio); }}>
            {mostrarForm ? '✕ Fechar' : '+ Novo Prestador'}
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitulo}>{editando ? '✏️ Editar Prestador' : '+ Novo Prestador'}</h3>

            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Nome completo *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              <select style={styles.input} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="">Tipo *</option>
                <option value="Operador">Operador</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Transportador">Transportador</option>
                <option value="Fornecedor">Fornecedor</option>
                <option value="Outro">Outro</option>
              </select>
              <input style={styles.input} placeholder="CPF / CNPJ" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
              <input style={styles.input} placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input style={styles.input} placeholder="Telefone / WhatsApp" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>

            <p style={styles.secaoLabel}>💳 Dados para Pagamento</p>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Banco" value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} />
              <input style={styles.input} placeholder="Agência" value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} />
              <input style={styles.input} placeholder="Conta" value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} />
              <select style={styles.input} value={form.tipo_conta} onChange={(e) => setForm({ ...form, tipo_conta: e.target.value })}>
                <option value="">Tipo de Conta</option>
                <option value="Corrente">Corrente</option>
                <option value="Poupança">Poupança</option>
                <option value="PIX">PIX</option>
              </select>
              <input style={styles.input} placeholder="Chave PIX" value={form.chave_pix} onChange={(e) => setForm({ ...form, chave_pix: e.target.value })} />
            </div>

            <textarea style={styles.input} placeholder="Observações" rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />

            <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? '✓ Salvar Alterações' : '✓ Cadastrar Prestador'}
            </button>
          </div>
        )}

        {carregando ? <p style={styles.mensagem}>Carregando...</p> :
          prestadores.length === 0 ? <p style={styles.mensagem}>Nenhum prestador cadastrado.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prestadores.map((p) => (
                <div key={p.id} style={{ ...styles.card, borderLeft: `4px solid ${tipoColor(p.tipo)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.nome}</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ ...styles.badge, backgroundColor: tipoColor(p.tipo) }}>{p.tipo}</span>
                        {p.documento && <span style={styles.info}>{p.documento}</span>}
                        {p.telefone && <span style={styles.info}>📱 {p.telefone}</span>}
                        {p.chave_pix && <span style={styles.info}>PIX: {p.chave_pix}</span>}
                      </div>
                    </div>
                    <button style={{ ...styles.botaoAcao, backgroundColor: '#0ea5e9' }} onClick={() => handleEditar(p)}>
                      ✏️ Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  botaoNovo: { padding: '10px 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  form: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitulo: { color: '#38bdf8', margin: '0 0 8px 0' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' },
  secaoLabel: { color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 'bold' },
  input: { padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  botaoSalvar: { padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '8px' },
  card: { backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 16px' },
  badge: { padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', color: '#fff' },
  info: { fontSize: '12px', color: '#94a3b8' },
  botaoAcao: { padding: '6px 14px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
};