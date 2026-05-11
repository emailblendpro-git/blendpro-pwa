import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

// ── Seletor de múltiplas máquinas com checkbox ───
function SeletorMaquinas({ maquinas, selecionados, onChange }) {
  const [aberto, setAberto] = useState(false);

  function toggle(m) {
    const jaSel = selecionados.find((s) => s.numero_serie === m.numero_serie);
    if (jaSel) {
      onChange(selecionados.filter((s) => s.numero_serie !== m.numero_serie));
    } else {
      onChange([...selecionados, { numero_serie: m.numero_serie, nome_local: m.nome_local || m.numero_serie }]);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Chips das selecionadas */}
      <div style={st.chipsBox}>
        {selecionados.length === 0 && (
          <span style={{ color: '#475569', fontSize: '13px' }}>Nenhuma máquina vinculada</span>
        )}
        {selecionados.map((s) => (
          <span key={s.numero_serie} style={st.chip}>
            {s.nome_local || s.numero_serie}
            <button style={st.chipX} onClick={() => toggle({ numero_serie: s.numero_serie })}>×</button>
          </span>
        ))}
        <button style={st.btnAdicionar} onClick={() => setAberto(!aberto)}>
          {aberto ? '✕ Fechar' : '+ Vincular'}
        </button>
      </div>

      {/* Dropdown com checkboxes */}
      {aberto && (
        <div style={st.dropdown}>
          {maquinas.length === 0 && (
            <div style={{ padding: '12px 14px', color: '#475569', fontSize: '13px' }}>
              Nenhuma máquina cadastrada.
            </div>
          )}
          {maquinas.map((m) => {
            const sel = !!selecionados.find((s) => s.numero_serie === m.numero_serie);
            return (
              <div key={m.numero_serie} style={{ ...st.dropdownItem, backgroundColor: sel ? '#0ea5e911' : 'transparent' }}
                onClick={() => toggle(m)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${sel ? '#38bdf8' : '#475569'}`,
                    backgroundColor: sel ? '#38bdf8' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {sel && <span style={{ color: '#0f172a', fontSize: '11px', fontWeight: 'bold', lineHeight: 1 }}>✓</span>}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '13px' }}>
                      {m.nome_local || m.numero_serie}
                    </span>
                    {m.nome_local && (
                      <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '6px' }}>{m.numero_serie}</span>
                    )}
                    {m.nome_cliente && (
                      <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '6px' }}>· {m.nome_cliente}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────
export default function Usuarios() {
  const navigate = useNavigate();
  const { isMaster } = useUsuario();
  const [usuarios, setUsuarios]             = useState([]);
  const [maquinas, setMaquinas]             = useState([]);
  const [carregando, setCarregando]         = useState(true);
  const [mostrarForm, setMostrarForm]       = useState(false);
  const [salvando, setSalvando]             = useState(false);
  const [usuarioSel, setUsuarioSel]         = useState(null);
  const [editando, setEditando]             = useState(false);
  const [formEdicao, setFormEdicao]         = useState({});
  const [maquinasEdicao, setMaquinasEdicao] = useState([]);

  const [form, setForm] = useState({
    nome: '', email: '', senha: '',
    perfil: 'operador_interno', telefone: '',
  });
  const [maquinasForm, setMaquinasForm] = useState([]); // [{numero_serie, nome_local}]

  // ── Carga inicial ───────────────────────────────
  useEffect(() => {
    api.get('/usuarios')
      .then((r) => setUsuarios(r.data))
      .catch(() => setUsuarios([]))
      .finally(() => setCarregando(false));
    api.get('/maquinas')
      .then((r) => setMaquinas(r.data))
      .catch(() => setMaquinas([]));
  }, []);

  // ── Submit novo usuário ─────────────────────────
  const handleSubmit = async () => {
    if (!form.nome || !form.email || !form.senha || !form.perfil) {
      alert('Nome, e-mail, senha e perfil são obrigatórios.');
      return;
    }
    if (form.perfil === 'cliente' && maquinasForm.length === 0) {
      alert('Vincule ao menos uma máquina para o perfil Cliente.');
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        ...form,
        maquinas_seriais: form.perfil === 'cliente' ? maquinasForm.map((m) => m.numero_serie) : [],
      };
      await api.post('/usuarios', payload);
      alert('Usuário cadastrado com sucesso!');
      setMostrarForm(false);
      setForm({ nome: '', email: '', senha: '', perfil: 'operador_interno', telefone: '' });
      setMaquinasForm([]);
      const r = await api.get('/usuarios');
      setUsuarios(r.data);
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao cadastrar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  // ── Salvar edição ───────────────────────────────
  const handleSalvarEdicao = async () => {
    try {
      const payload = { ...formEdicao };
      if (!payload.senha) delete payload.senha;
      if (payload.perfil === 'cliente') {
        payload.maquinas_seriais = maquinasEdicao.map((m) => m.numero_serie);
      }
      await api.patch(`/usuarios/${usuarioSel.id}`, payload);
      alert('Usuário atualizado com sucesso!');
      setEditando(false);
      const r = await api.get('/usuarios');
      setUsuarios(r.data);
      setUsuarioSel(null);
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao atualizar usuário.');
    }
  };

  // ── Abrir detalhes ──────────────────────────────
  function abrirUsuario(u) {
    setUsuarioSel(u);
    setFormEdicao({ ...u, senha: '' });
    setMaquinasEdicao(u.maquinas_vinculadas || []);
    setEditando(false);
  }

  const corPerfil = (p) => {
    const m = { master: '#7c3aed', operador_interno: '#0e7490', operador_externo: '#0369a1', cliente: '#15803d' };
    return m[p] || '#334155';
  };
  const labelPerfil = (p) => {
    const m = { master: 'Master', operador_interno: 'Op. Interno', operador_externo: 'Op. Externo', cliente: 'Cliente' };
    return m[p] || p;
  };

  // ── Render ──────────────────────────────────────
  return (
    <div style={st.container}>
      <div style={st.header}>
        <h1 style={st.titulo}>BlendPro</h1>
        <button style={st.botaoVoltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
      </div>
      <div style={st.conteudo}>
        <div style={st.topBar}>
          <h2 style={st.pageTitulo}>Usuários</h2>
          {isMaster && (
            <button style={st.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? '✕ Fechar' : '+ Novo Usuário'}
            </button>
          )}
        </div>

        {/* ── Formulário novo usuário ── */}
        {mostrarForm && isMaster && (
          <div style={st.form}>
            <h3 style={st.formTitulo}>Novo Usuário</h3>
            <input style={st.input} placeholder="Nome *"
              value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <input style={st.input} placeholder="E-mail *" type="email"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input style={st.input} placeholder="Senha *" type="password"
              value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
            <select style={st.input} value={form.perfil}
              onChange={(e) => { setForm({ ...form, perfil: e.target.value }); setClientesForm([]); }}>
              <option value="operador_interno">Operador Interno</option>
              <option value="operador_externo">Operador Externo</option>
              <option value="cliente">Cliente</option>
              <option value="master">Master</option>
            </select>
            {form.perfil === 'cliente' && (
              <div style={st.secaoClientes}>
                <p style={st.secaoLabel}>🏭 Máquinas vinculadas <span style={{ color: '#ef4444' }}>*</span></p>
                <p style={st.secaoHint}>Vincule as máquinas que este usuário poderá acompanhar no portal.</p>
                <SeletorMaquinas
                  maquinas={maquinas}
                  selecionados={maquinasForm}
                  onChange={setMaquinasForm}
                />
              </div>
            )}
            <input style={st.input} placeholder="Telefone"
              value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            <button style={st.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        )}

        {/* ── Painel de detalhes / edição ── */}
        {usuarioSel && (
          <div style={st.painel}>
            <div style={st.painelHeader}>
              <h3 style={st.painelTitulo}>{usuarioSel.nome}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isMaster && (
                  <button style={st.botaoEditar} onClick={() => setEditando(!editando)}>
                    {editando ? '✕ Cancelar' : '✏️ Editar'}
                  </button>
                )}
                <button style={st.botaoFechar}
                  onClick={() => { setUsuarioSel(null); setEditando(false); }}>
                  ✕ Fechar
                </button>
              </div>
            </div>

            {!editando ? (
              <div>
                <div style={st.painelGrid}>
                  <Campo label="E-mail"    valor={usuarioSel.email} />
                  <Campo label="Perfil"    valor={
                    <span style={{ ...st.badge, backgroundColor: corPerfil(usuarioSel.perfil) }}>
                      {labelPerfil(usuarioSel.perfil)}
                    </span>
                  } />
                  <Campo label="Telefone"  valor={usuarioSel.telefone} />
                  <Campo label="Status"    valor={
                    <span style={{ color: usuarioSel.ativo ? '#22c55e' : '#ef4444' }}>
                      {usuarioSel.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  } />
                </div>
                {usuarioSel.perfil === 'cliente' && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={st.secaoLabel}>🏭 Máquinas vinculadas</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {(usuarioSel.maquinas_vinculadas || []).length === 0
                        ? <span style={{ color: '#94a3b8', fontSize: '13px' }}>Nenhuma máquina vinculada</span>
                        : (usuarioSel.maquinas_vinculadas || []).map((m) => (
                          <span key={m.numero_serie} style={{ ...st.chip, cursor: 'default' }}>
                            {m.nome_local || m.numero_serie}
                          </span>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input style={st.input} placeholder="Nome"
                  value={formEdicao.nome || ''} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} />
                <input style={st.input} placeholder="E-mail" type="email"
                  value={formEdicao.email || ''} onChange={(e) => setFormEdicao({ ...formEdicao, email: e.target.value })} />
                <input style={st.input} placeholder="Nova Senha (deixe em branco para manter)" type="password"
                  value={formEdicao.senha || ''} onChange={(e) => setFormEdicao({ ...formEdicao, senha: e.target.value })} />
                <select style={st.input} value={formEdicao.perfil || ''}
                  onChange={(e) => setFormEdicao({ ...formEdicao, perfil: e.target.value })}>
                  <option value="operador_interno">Operador Interno</option>
                  <option value="operador_externo">Operador Externo</option>
                  <option value="cliente">Cliente</option>
                  <option value="master">Master</option>
                </select>
                {formEdicao.perfil === 'cliente' && (
                  <div style={st.secaoClientes}>
                    <p style={st.secaoLabel}>🏭 Máquinas vinculadas</p>
                    <SeletorMaquinas
                      maquinas={maquinas}
                      selecionados={maquinasEdicao}
                      onChange={setMaquinasEdicao}
                    />
                  </div>
                )}
                <input style={st.input} placeholder="Telefone"
                  value={formEdicao.telefone || ''} onChange={(e) => setFormEdicao({ ...formEdicao, telefone: e.target.value })} />
                <select style={st.input}
                  value={formEdicao.ativo !== undefined ? String(formEdicao.ativo) : 'true'}
                  onChange={(e) => setFormEdicao({ ...formEdicao, ativo: e.target.value === 'true' })}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
                <button style={st.botaoSalvar} onClick={handleSalvarEdicao}>
                  Salvar Alterações
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tabela de usuários ── */}
        {carregando ? (
          <p style={st.mensagem}>Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p style={st.mensagem}>Nenhum usuário cadastrado.</p>
        ) : (
          <table style={st.tabela}>
            <thead>
              <tr>
                <th style={st.th}>Nome</th>
                <th style={st.th}>E-mail</th>
                <th style={st.th}>Perfil</th>
                <th style={st.th}>Máquinas</th>
                <th style={st.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ ...st.tr, cursor: 'pointer' }}
                  onClick={() => abrirUsuario(u)}>
                  <td style={st.td}>{u.nome}</td>
                  <td style={st.td}>{u.email}</td>
                  <td style={st.td}>
                    <span style={{ ...st.badge, backgroundColor: corPerfil(u.perfil) }}>
                      {labelPerfil(u.perfil)}
                    </span>
                  </td>
                  <td style={st.td}>
                    {u.perfil === 'cliente' && u.maquinas_vinculadas?.length > 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {u.maquinas_vinculadas.length} máquina{u.maquinas_vinculadas.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ color: '#475569', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td style={st.td}>
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

function Campo({ label, valor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>{label}</span>
      <span>{valor || '—'}</span>
    </div>
  );
}

const st = {
  container:   { backgroundColor: '#0f172a', minHeight: '100vh', color: '#f1f5f9' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  titulo:      { color: '#38bdf8', margin: 0 },
  botaoVoltar: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  conteudo:    { padding: '40px 32px' },
  pageTitulo:  { color: '#f1f5f9', marginBottom: 0 },
  mensagem:    { color: '#94a3b8' },
  tabela:      { width: '100%', borderCollapse: 'collapse' },
  th:          { textAlign: 'left', padding: '12px 16px', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #334155' },
  tr:          { borderBottom: '1px solid #1e293b' },
  td:          { padding: '12px 16px', color: '#f1f5f9', fontSize: '14px' },
  topBar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  botaoNovo:   { padding: '10px 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  form:        { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitulo:  { color: '#38bdf8', margin: '0 0 8px 0' },
  input:       { padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  botaoSalvar: { padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '8px' },
  painel:      { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '32px' },
  painelHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  painelTitulo:{ color: '#38bdf8', margin: 0 },
  painelGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  botaoEditar: { padding: '8px 16px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  botaoFechar: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  badge:       { padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold', color: '#fff' },

  secaoClientes:{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', border: '1px solid #334155' },
  secaoLabel:   { color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' },
  secaoHint:    { color: '#475569', fontSize: '12px', margin: '0 0 12px 0' },

  chipsBox:    { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', minHeight: '36px' },
  chip:        { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#15803d33', border: '1px solid #15803d66', borderRadius: '999px', color: '#4ade80', fontSize: '13px', fontWeight: '500' },
  chipX:       { background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '16px', lineHeight: '1', padding: '0', display: 'flex', alignItems: 'center' },
  btnAdicionar:{ padding: '4px 12px', backgroundColor: '#0ea5e922', border: '1px solid #0ea5e966', borderRadius: '999px', color: '#38bdf8', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  dropdown:    { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', zIndex: 50, maxHeight: '220px', overflowY: 'auto' },
  dropdownItem:{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: '#f1f5f9', borderBottom: '1px solid #0f172a' },
};
