import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

export default function Clientes() {
  const navigate = useNavigate();
  const { podeGerenciar } = useUsuario();
  const [clientes, setClientes] = useState([]);
  const [redes, setRedes] = useState([]);
  const [segmentos, setSegmentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formEdicao, setFormEdicao] = useState({});
  const [filtroRede, setFiltroRede] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [form, setForm] = useState({
    nome_cliente: '', cnpj: '', codigo_erp: '', endereco: '',
    bairro: '', cidade: '', uf: '', cep: '', telefone: '',
    contato: '', email_cliente: '', observacoes: '',
    id_rede: '', id_segmento: '',
  });

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resClientes, resRedes, resSegmentos] = await Promise.all([
          api.get('/clientes'),
          api.get('/clientes/redes'),
          api.get('/clientes/segmentos'),
        ]);
        setClientes(resClientes.data);
        setRedes(resRedes.data);
        setSegmentos(resSegmentos.data);
      } catch {
        setClientes([]);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const recarregarClientes = async () => {
    const res = await api.get('/clientes');
    setClientes(res.data);
  };

  const handleSubmit = async () => {
    if (!form.nome_cliente) {
      alert('O Nome do Cliente é obrigatório.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/clientes', {
        ...form,
        id_rede: form.id_rede || null,
        id_segmento: form.id_segmento || null,
      });
      alert('Cliente cadastrado com sucesso!');
      setMostrarForm(false);
      setForm({ nome_cliente: '', cnpj: '', codigo_erp: '', endereco: '', bairro: '', cidade: '', uf: '', cep: '', telefone: '', contato: '', email_cliente: '', observacoes: '', id_rede: '', id_segmento: '' });
      await recarregarClientes();
    } catch {
      alert('Erro ao cadastrar cliente. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarEdicao = async () => {
    try {
      await api.patch(`/clientes/${clienteSelecionado.id}`, {
        ...formEdicao,
        id_rede: formEdicao.id_rede || null,
        id_segmento: formEdicao.id_segmento || null,
      });
      alert('Cliente atualizado com sucesso!');
      setEditando(false);
      await recarregarClientes();
      const res = await api.get(`/clientes/${clienteSelecionado.id}`);
      setClienteSelecionado(res.data);
    } catch {
      alert('Erro ao atualizar cliente.');
    }
  };

  const clientesFiltrados = clientes.filter((c) => {
    const buscaOk = filtroBusca === '' || c.nome_cliente.toLowerCase().includes(filtroBusca.toLowerCase()) || (c.cidade || '').toLowerCase().includes(filtroBusca.toLowerCase());
    const redeOk = filtroRede === '' || String(c.id_rede) === filtroRede;
    const segmentoOk = filtroSegmento === '' || String(c.id_segmento) === filtroSegmento;
    return buscaOk && redeOk && segmentoOk;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <button style={styles.botaoVoltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
      </div>
      <div style={styles.conteudo}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitulo}>Clientes</h2>
          {podeGerenciar && (
            <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? '✕ Fechar' : '+ Novo Cliente'}
            </button>
          )}
        </div>

        {/* FILTROS */}
        <div style={styles.filtros}>
          <input style={styles.inputFiltro} placeholder="🔍 Buscar por nome ou cidade..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} />
          <select style={styles.inputFiltro} value={filtroRede} onChange={(e) => setFiltroRede(e.target.value)}>
            <option value="">Todas as Redes</option>
            {redes.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
          <select style={styles.inputFiltro} value={filtroSegmento} onChange={(e) => setFiltroSegmento(e.target.value)}>
            <option value="">Todos os Segmentos</option>
            {segmentos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>

        {/* FORMULÁRIO NOVO CLIENTE */}
        {mostrarForm && podeGerenciar && (
          <div style={styles.form}>
            <h3 style={styles.formTitulo}>Novo Cliente</h3>
            <input style={styles.input} placeholder="Nome do Cliente *" value={form.nome_cliente} onChange={(e) => setForm({ ...form, nome_cliente: e.target.value })} />
            <input style={styles.input} placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            <input style={styles.input} placeholder="Código ERP" value={form.codigo_erp} onChange={(e) => setForm({ ...form, codigo_erp: e.target.value })} />
            <input style={styles.input} placeholder="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            <input style={styles.input} placeholder="Bairro" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
            <input style={styles.input} placeholder="Cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            <input style={styles.input} placeholder="UF (ex: SP)" maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} />
            <input style={styles.input} placeholder="CEP" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
            <input style={styles.input} placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            <input style={styles.input} placeholder="Nome do Contato" value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
            <input style={styles.input} placeholder="E-mail" value={form.email_cliente} onChange={(e) => setForm({ ...form, email_cliente: e.target.value })} />
            <textarea style={styles.input} placeholder="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
            <select style={styles.input} value={form.id_rede} onChange={(e) => setForm({ ...form, id_rede: e.target.value })}>
              <option value="">Selecionar Rede/Grupo</option>
              {redes.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
            <select style={styles.input} value={form.id_segmento} onChange={(e) => setForm({ ...form, id_segmento: e.target.value })}>
              <option value="">Selecionar Segmento</option>
              {segmentos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        )}

        {/* PAINEL DETALHES */}
        {clienteSelecionado && (
          <div style={styles.painel}>
            <div style={styles.painelHeader}>
              <h3 style={styles.painelTitulo}>{clienteSelecionado.nome_cliente}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {podeGerenciar && (
                  <button style={styles.botaoEditar} onClick={() => setEditando(!editando)}>
                    {editando ? '✕ Cancelar' : '✏️ Editar'}
                  </button>
                )}
                <button style={styles.botaoFechar} onClick={() => { setClienteSelecionado(null); setEditando(false); }}>
                  ✕ Fechar
                </button>
              </div>
            </div>

            {!editando ? (
              <div style={styles.painelGrid}>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>CNPJ</span><span>{clienteSelecionado.cnpj || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Código ERP</span><span>{clienteSelecionado.codigo_erp || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Rede / Grupo</span><span>{clienteSelecionado.rede_nome || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Segmento</span><span>{clienteSelecionado.segmento_nome || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Endereço</span><span>{clienteSelecionado.endereco || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Bairro</span><span>{clienteSelecionado.bairro || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Cidade</span><span>{clienteSelecionado.cidade || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>UF</span><span>{clienteSelecionado.uf || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>CEP</span><span>{clienteSelecionado.cep || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Telefone</span><span>{clienteSelecionado.telefone || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Contato</span><span>{clienteSelecionado.contato || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>E-mail</span><span>{clienteSelecionado.email_cliente || '—'}</span></div>
                <div style={{ ...styles.painelCampo, gridColumn: '1 / -1' }}><span style={styles.painelLabel}>Observações</span><span>{clienteSelecionado.observacoes || '—'}</span></div>
              </div>
            ) : (
              <div style={styles.form}>
                <input style={styles.input} placeholder="Nome do Cliente *" value={formEdicao.nome_cliente || ''} onChange={(e) => setFormEdicao({ ...formEdicao, nome_cliente: e.target.value })} />
                <input style={styles.input} placeholder="CNPJ" value={formEdicao.cnpj || ''} onChange={(e) => setFormEdicao({ ...formEdicao, cnpj: e.target.value })} />
                <input style={styles.input} placeholder="Código ERP" value={formEdicao.codigo_erp || ''} onChange={(e) => setFormEdicao({ ...formEdicao, codigo_erp: e.target.value })} />
                <input style={styles.input} placeholder="Endereço" value={formEdicao.endereco || ''} onChange={(e) => setFormEdicao({ ...formEdicao, endereco: e.target.value })} />
                <input style={styles.input} placeholder="Bairro" value={formEdicao.bairro || ''} onChange={(e) => setFormEdicao({ ...formEdicao, bairro: e.target.value })} />
                <input style={styles.input} placeholder="Cidade" value={formEdicao.cidade || ''} onChange={(e) => setFormEdicao({ ...formEdicao, cidade: e.target.value })} />
                <input style={styles.input} placeholder="UF" maxLength={2} value={formEdicao.uf || ''} onChange={(e) => setFormEdicao({ ...formEdicao, uf: e.target.value.toUpperCase() })} />
                <input style={styles.input} placeholder="CEP" value={formEdicao.cep || ''} onChange={(e) => setFormEdicao({ ...formEdicao, cep: e.target.value })} />
                <input style={styles.input} placeholder="Telefone" value={formEdicao.telefone || ''} onChange={(e) => setFormEdicao({ ...formEdicao, telefone: e.target.value })} />
                <input style={styles.input} placeholder="Contato" value={formEdicao.contato || ''} onChange={(e) => setFormEdicao({ ...formEdicao, contato: e.target.value })} />
                <input style={styles.input} placeholder="E-mail" value={formEdicao.email_cliente || ''} onChange={(e) => setFormEdicao({ ...formEdicao, email_cliente: e.target.value })} />
                <textarea style={styles.input} placeholder="Observações" value={formEdicao.observacoes || ''} onChange={(e) => setFormEdicao({ ...formEdicao, observacoes: e.target.value })} rows={3} />
                <select style={styles.input} value={formEdicao.id_rede || ''} onChange={(e) => setFormEdicao({ ...formEdicao, id_rede: e.target.value })}>
                  <option value="">Selecionar Rede/Grupo</option>
                  {redes.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
                <select style={styles.input} value={formEdicao.id_segmento || ''} onChange={(e) => setFormEdicao({ ...formEdicao, id_segmento: e.target.value })}>
                  <option value="">Selecionar Segmento</option>
                  {segmentos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
                <button style={styles.botaoSalvar} onClick={handleSalvarEdicao}>Salvar Alterações</button>
              </div>
            )}
          </div>
        )}

        {/* TABELA */}
        {carregando ? (
          <p style={styles.mensagem}>Carregando...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p style={styles.mensagem}>Nenhum cliente encontrado.</p>
        ) : (
          <table style={styles.tabela}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Rede / Grupo</th>
                <th style={styles.th}>Segmento</th>
                <th style={styles.th}>Cidade</th>
                <th style={styles.th}>Máquinas</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c) => (
                <tr key={c.id} style={{ ...styles.tr, cursor: 'pointer' }} onClick={() => { setClienteSelecionado(c); setFormEdicao(c); setEditando(false); }}>
                  <td style={styles.td}>{c.nome_cliente}</td>
                  <td style={styles.td}>{c.rede_nome || '—'}</td>
                  <td style={styles.td}>{c.segmento_nome || '—'}</td>
                  <td style={styles.td}>{c.cidade || '—'}</td>
                  <td style={styles.td}>
                    {c.maquinas && c.maquinas.length > 0
                      ? c.maquinas.map((serial) => (
                        <div key={serial}>{serial}</div>
                      ))
                      : '—'}
                  </td>
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
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  botaoNovo: { padding: '10px 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  filtros: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  inputFiltro: { padding: '10px 14px', backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', flex: 1, minWidth: '200px' },
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
