import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

export default function Produtos() {
  const navigate = useNavigate();
  const { podeGerenciar } = useUsuario();
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formEdicao, setFormEdicao] = useState({});
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    unidade: 'Litro',
    custo_base: '',
  });

  const handleSubmit = async () => {
    if (!form.nome) {
      alert('O Nome do produto é obrigatório.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/produtos', {
        ...form,
        custo_base: form.custo_base ? parseFloat(form.custo_base.replace(',', '.')) : null,
      });
      alert('Produto cadastrado com sucesso!');
      setMostrarForm(false);
      setForm({ nome: '', descricao: '', unidade: 'Litro', custo_base: '' });
      const res = await api.get('/produtos');
      setProdutos(res.data);
    } catch (erro) {
      alert('Erro ao cadastrar produto. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    api.get('/produtos')
      .then((res) => setProdutos(res.data))
      .catch(() => setProdutos([]))
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
        <div style={styles.topBar}>
          <h2 style={styles.pageTitulo}>Produtos</h2>
          {podeGerenciar && (
            <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? '✕ Fechar' : '+ Novo Produto'}
            </button>
          )}
        </div>

        {mostrarForm && podeGerenciar && (
          <div style={styles.form}>
            <h3 style={styles.formTitulo}>Novo Produto</h3>
            <input style={styles.input} placeholder="Nome do Produto *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <textarea style={styles.input} placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
            <select style={styles.input} value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}>
              <option value="Litro">Litro</option>
              <option value="Cápsula">Cápsula</option>
            </select>
            <input
              style={styles.input}
              placeholder="Custo Base (ex: 12,50)"
              value={form.custo_base}
              onChange={(e) => setForm({ ...form, custo_base: e.target.value })}
              onBlur={(e) => {
                const valor = parseFloat(e.target.value.replace(',', '.'));
                if (!isNaN(valor)) setForm({ ...form, custo_base: valor.toFixed(2).replace('.', ',') });
              }}
            />
            <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        )}

        {produtoSelecionado && (
          <div style={styles.painel}>
            <div style={styles.painelHeader}>
              <h3 style={styles.painelTitulo}>{produtoSelecionado.nome}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {podeGerenciar && (
                  <button style={styles.botaoEditar} onClick={() => setEditando(!editando)}>
                    {editando ? '✕ Cancelar' : '✏️ Editar'}
                  </button>
                )}
                <button style={styles.botaoFechar} onClick={() => setProdutoSelecionado(null)}>
                  ✕ Fechar
                </button>
              </div>
            </div>

            {!editando ? (
              <div style={styles.painelGrid}>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Unidade</span><span>{produtoSelecionado.unidade || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Custo Base</span><span>{produtoSelecionado.custo_base ? `R$ ${parseFloat(produtoSelecionado.custo_base).toFixed(2).replace('.', ',')}` : '—'}</span></div>
                <div style={{ ...styles.painelCampo, gridColumn: '1 / -1' }}><span style={styles.painelLabel}>Descrição</span><span>{produtoSelecionado.descricao || '—'}</span></div>
              </div>
            ) : (
              <div style={styles.form}>
                <input style={styles.input} placeholder="Nome *" value={formEdicao.nome || ''} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} />
                <textarea style={styles.input} placeholder="Descrição" value={formEdicao.descricao || ''} onChange={(e) => setFormEdicao({ ...formEdicao, descricao: e.target.value })} rows={3} />
                <select style={styles.input} value={formEdicao.unidade || 'Litro'} onChange={(e) => setFormEdicao({ ...formEdicao, unidade: e.target.value })}>
                  <option value="Litro">Litro</option>
                  <option value="Cápsula">Cápsula</option>
                </select>
                <input style={styles.input} placeholder="Custo Base" value={formEdicao.custo_base || ''} onChange={(e) => setFormEdicao({ ...formEdicao, custo_base: e.target.value })} />
                <button style={styles.botaoSalvar} onClick={async () => {
                  try {
                    await api.patch(`/produtos/${produtoSelecionado.id}`, {
                      ...formEdicao,
                      custo_base: formEdicao.custo_base ? parseFloat(String(formEdicao.custo_base).replace(',', '.')) : null,
                    });
                    alert('Produto atualizado com sucesso!');
                    setEditando(false);
                    setProdutoSelecionado({ ...produtoSelecionado, ...formEdicao });
                    const res = await api.get('/produtos');
                    setProdutos(res.data);
                  } catch {
                    alert('Erro ao atualizar produto.');
                  }
                }}>
                  Salvar Alterações
                </button>
              </div>
            )}
          </div>
        )}

        {carregando ? (
          <p style={styles.mensagem}>Carregando...</p>
        ) : produtos.length === 0 ? (
          <p style={styles.mensagem}>Nenhum produto cadastrado.</p>
        ) : (
          <table style={styles.tabela}>
            <thead>
              <tr>
                <th style={{ ...styles.th, color: '#f59e0b' }}>Cód.</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Unidade</th>
                <th style={styles.th}>Custo Base</th>
                <th style={styles.th}>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} style={{ ...styles.tr, cursor: 'pointer' }} onClick={() => { setProdutoSelecionado(p); setFormEdicao(p); setEditando(false); }}>
                  <td style={{ ...styles.td, color: '#f59e0b', fontWeight: 'bold' }}>{p.id}</td>
                  <td style={styles.td}>{p.nome}</td>
                  <td style={styles.td}>{p.unidade}</td>
                  <td style={styles.td}>{p.custo_base ? `R$ ${parseFloat(p.custo_base).toFixed(2).replace('.', ',')}` : '—'}</td>
                  <td style={styles.td}>{p.descricao || '—'}</td>
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
  botaoEditar: { padding: '8px 16px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  botaoFechar: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
};