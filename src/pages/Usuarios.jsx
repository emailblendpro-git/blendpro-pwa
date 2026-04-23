import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

export default function Usuarios() {
  const navigate = useNavigate();
  const { isMaster } = useUsuario();
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formEdicao, setFormEdicao] = useState({});
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'operador_interno',
    telefone: '',
    id_cliente: '',
  });

  const handleSubmit = async () => {
    if (!form.nome || !form.email || !form.senha || !form.perfil) {
      alert('Nome, e-mail, senha e perfil são obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/usuarios', form);
      alert('Usuário cadastrado com sucesso!');
      setMostrarForm(false);
      setForm({ nome: '', email: '', senha: '', perfil: 'operador_interno', telefone: '', id_cliente: '' });
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (erro) {
      alert(erro.response?.data?.erro || 'Erro ao cadastrar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    api.get('/usuarios')
      .then((res) => setUsuarios(res.data))
      .catch(() => setUsuarios([]))
      .finally(() => setCarregando(false));

    api.get('/clientes')
      .then((res) => setClientes(res.data))
      .catch(() => setClientes([]));
  }, []);

  const corPerfil = (perfil) => {
    if (perfil === 'master') return '#7c3aed';
    if (perfil === 'operador_interno') return '#0e7490';
    if (perfil === 'operador_externo') return '#0369a1';
    if (perfil === 'cliente') return '#15803d';
    return '#334155';
  };

  const labelPerfil = (perfil) => {
    if (perfil === 'master') return 'Master';
    if (perfil === 'operador_interno') return 'Op. Interno';
    if (perfil === 'operador_externo') return 'Op. Externo';
    if (perfil === 'cliente') return 'Cliente';
    return perfil;
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
          <h2 style={styles.pageTitulo}>Usuários</h2>
          {isMaster && (
            <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? '✕ Fechar' : '+ Novo Usuário'}
            </button>
          )}
        </div>

        {mostrarForm && isMaster && (
          <div style={styles.form}>
            <h3 style={styles.formTitulo}>Novo Usuário</h3>
            <input style={styles.input} placeholder="Nome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <input style={styles.input} placeholder="E-mail *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input style={styles.input} placeholder="Senha *" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
            <select style={styles.input} value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
              <option value="operador_interno">Operador Interno</option>
              <option value="operador_externo">Operador Externo</option>
              <option value="cliente">Cliente</option>
              <option value="master">Master</option>
            </select>
            {form.perfil === 'cliente' && (
              <select style={styles.input} value={form.id_cliente} onChange={(e) => setForm({ ...form, id_cliente: e.target.value })}>
                <option value="">Vincular a um Cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome_cliente}</option>
                ))}
              </select>
            )}
            <input style={styles.input} placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        )}

        {usuarioSelecionado && (
          <div style={styles.painel}>
            <div style={styles.painelHeader}>
              <h3 style={styles.painelTitulo}>{usuarioSelecionado.nome}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isMaster && (
                  <button style={styles.botaoEditar} onClick={() => setEditando(!editando)}>
                    {editando ? '✕ Cancelar' : '✏️ Editar'}
                  </button>
                )}
                <button style={styles.botaoFechar} onClick={() => { setUsuarioSelecionado(null); setEditando(false); }}>
                  ✕ Fechar
                </button>
              </div>
            </div>

            {!editando ? (
              <div style={styles.painelGrid}>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>E-mail</span><span>{usuarioSelecionado.email}</span></div>
                <div style={styles.painelCampo}>
                  <span style={styles.painelLabel}>Perfil</span>
                  <span><span style={{ ...styles.badge, backgroundColor: corPerfil(usuarioSelecionado.perfil) }}>{labelPerfil(usuarioSelecionado.perfil)}</span></span>
                </div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Telefone</span><span>{usuarioSelecionado.telefone || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Cliente</span><span>{usuarioSelecionado.nome_cliente || '—'}</span></div>
                <div style={styles.painelCampo}>
                  <span style={styles.painelLabel}>Status</span>
                  <span style={{ color: usuarioSelecionado.ativo ? '#22c55e' : '#ef4444' }}>
                    {usuarioSelecionado.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            ) : (
              <div style={styles.form}>
                <input style={styles.input} placeholder="Nome" value={formEdicao.nome || ''} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} />
                <input style={styles.input} placeholder="E-mail" type="email" value={formEdicao.email || ''} onChange={(e) => setFormEdicao({ ...formEdicao, email: e.target.value })} />
                <input style={styles.input} placeholder="Nova Senha (deixe em branco para manter)" type="password" value={formEdicao.senha || ''} onChange={(e) => setFormEdicao({ ...formEdicao, senha: e.target.value })} />
                <select style={styles.input} value={formEdicao.perfil || ''} onChange={(e) => setFormEdicao({ ...formEdicao, perfil: e.target.value })}>
                  <option value="operador_interno">Operador Interno</option>
                  <option value="operador_externo">Operador Externo</option>
                  <option value="cliente">Cliente</option>
                  <option value="master">Master</option>
                </select>
                {formEdicao.perfil === 'cliente' && (
                  <select style={styles.input} value={formEdicao.id_cliente || ''} onChange={(e) => setFormEdicao({ ...formEdicao, id_cliente: e.target.value })}>
                    <option value="">Vincular a um Cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome_cliente}</option>
                    ))}
                  </select>
                )}
                <input style={styles.input} placeholder="Telefone" value={formEdicao.telefone || ''} onChange={(e) => setFormEdicao({ ...formEdicao, telefone: e.target.value })} />
                <select style={styles.input} value={formEdicao.ativo !== undefined ? String(formEdicao.ativo) : 'true'} onChange={(e) => setFormEdicao({ ...formEdicao, ativo: e.target.value === 'true' })}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
                <button style={styles.botaoSalvar} onClick={async () => {
                  try {
                    const payload = { ...formEdicao };
                    if (!payload.senha) delete payload.senha;
                    await api.patch(`/usuarios/${usuarioSelecionado.id}`, payload);
                    alert('Usuário atualizado com sucesso!');
                    setEditando(false);
                    const res = await api.get('/usuarios');
                    setUsuarios(res.data);
                    setUsuarioSelecionado(null);
                  } catch (erro) {
                    alert(erro.response?.data?.erro || 'Erro ao atualizar usuário.');
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
        ) : usuarios.length === 0 ? (
          <p style={styles.mensagem}>Nenhum usuário cadastrado.</p>
        ) : (
          <table style={styles.tabela}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>E-mail</th>
                <th style={styles.th}>Perfil</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ ...styles.tr, cursor: 'pointer' }} onClick={() => { setUsuarioSelecionado(u); setFormEdicao(u); setEditando(false); }}>
                  <td style={styles.td}>{u.nome}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: corPerfil(u.perfil) }}>
                      {labelPerfil(u.perfil)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: u.ativo ? '#22c55e' : '#ef4444' }}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
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
  badge: { padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold', color: '#fff' },
};