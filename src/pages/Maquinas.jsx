import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Maquinas() {
  const navigate = useNavigate();
  const [maquinas, setMaquinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [maquinaSelecionada, setMaquinaSelecionada] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [editando, setEditando] = useState(false);
  const [formEdicao, setFormEdicao] = useState({});
  const [form, setForm] = useState({
    numero_serie: '',
    modelo: '',
    status: '',
    data_aquisicao: '',
    custo_aquisicao: '',
    fornecedor: '',
    versao_firmware: '',
    notas_internas: '',
  });

  const handleSubmit = async () => {
    if (!form.numero_serie || !form.modelo || !form.status) {
      alert('Preencha os campos obrigatórios: Número de Série, Modelo e Status.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/maquinas', {
        ...form,
        custo_aquisicao: form.custo_aquisicao
          ? parseFloat(form.custo_aquisicao.replace(',', '.'))
          : null,
      });
      alert('Máquina cadastrada com sucesso!');
      setMostrarForm(false);
      setForm({ numero_serie: '', modelo: '', status: '', data_aquisicao: '', custo_aquisicao: '', fornecedor: '', versao_firmware: '', notas_internas: '' });
      const res = await api.get('/maquinas');
      setMaquinas(res.data);
    } catch (erro) {
      alert('Erro ao cadastrar máquina. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    api.get('/maquinas')
      .then((res) => setMaquinas(res.data))
      .catch(() => setMaquinas([]))
      .finally(() => setCarregando(false));

    api.get('/clientes')
      .then((res) => setClientes(res.data))
      .catch(() => setClientes([]));
  }, []);

  const formatarData = (data) => {
  if (!data) return '—';
  const apenas_data = data.substring(0, 10);
  return new Date(apenas_data + 'T12:00:00').toLocaleDateString('pt-BR');
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
          <h2 style={styles.pageTitulo}>Máquinas</h2>
          <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? '✕ Fechar' : '+ Nova Máquina'}
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitulo}>Nova Máquina</h3>
            <input style={styles.input} placeholder="Número de Série *" value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} />
            <select style={styles.input} value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })}>
              <option value="">Modelo *</option>
              <option value="BP-ONE">BlendPro ONE</option>
              <option value="BP-CAPS">BlendPro Caps</option>
            </select>
            <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="">Status *</option>
              <option value="Ativa">Ativa</option>
              <option value="Em Estoque">Em Estoque</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Bloqueada">Bloqueada</option>
            </select>
            <input style={styles.input} type="date" value={form.data_aquisicao} onChange={(e) => setForm({ ...form, data_aquisicao: e.target.value })} />
            <input
              style={styles.input}
              placeholder="Custo de Aquisição (ex: 1.500,00)"
              value={form.custo_aquisicao}
              onChange={(e) => setForm({ ...form, custo_aquisicao: e.target.value })}
              onBlur={(e) => {
                const valor = parseFloat(e.target.value.replace(',', '.'));
                if (!isNaN(valor)) setForm({ ...form, custo_aquisicao: valor.toFixed(2).replace('.', ',') });
              }}
            />
            <input style={styles.input} placeholder="Fornecedor" value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
            <input style={styles.input} placeholder="Versão do Firmware" value={form.versao_firmware} onChange={(e) => setForm({ ...form, versao_firmware: e.target.value })} />
            <textarea style={styles.input} placeholder="Notas Internas" value={form.notas_internas} onChange={(e) => setForm({ ...form, notas_internas: e.target.value })} rows={3} />
            <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Máquina'}
            </button>
          </div>
        )}

        {maquinaSelecionada && (
          <div style={styles.painel}>
            <div style={styles.painelHeader}>
              <h3 style={styles.painelTitulo}>{maquinaSelecionada.numero_serie}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={styles.botaoEditar} onClick={() => setEditando(!editando)}>
                  {editando ? '✕ Cancelar' : '✏️ Editar'}
                </button>
                <button style={styles.botaoFechar} onClick={() => setMaquinaSelecionada(null)}>
                  ✕ Fechar
                </button>
              </div>
            </div>

            {!editando ? (
              <div style={styles.painelGrid}>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Modelo</span><span>{maquinaSelecionada.modelo || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Status</span><span>{maquinaSelecionada.status || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Cliente</span><span>{maquinaSelecionada.nome_cliente || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Data de Aquisição</span><span>{formatarData(maquinaSelecionada.data_aquisicao)}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Custo de Aquisição</span><span>{maquinaSelecionada.custo_aquisicao || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Fornecedor</span><span>{maquinaSelecionada.fornecedor || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Versão Firmware</span><span>{maquinaSelecionada.versao_firmware || '—'}</span></div>
                <div style={styles.painelCampo}><span style={styles.painelLabel}>Notas Internas</span><span>{maquinaSelecionada.notas_internas || '—'}</span></div>
              </div>
            ) : (
              <div style={styles.form}>
                <select style={styles.input} value={formEdicao.modelo || ''} onChange={(e) => setFormEdicao({ ...formEdicao, modelo: e.target.value })}>
                  <option value="">Modelo *</option>
                  <option value="BP-ONE">BlendPro ONE</option>
                  <option value="BP-CAPS">BlendPro Caps</option>
                </select>
                <select style={styles.input} value={formEdicao.status || ''} onChange={(e) => setFormEdicao({ ...formEdicao, status: e.target.value })}>
                  <option value="">Status *</option>
                  <option value="Ativa">Ativa</option>
                  <option value="Em Estoque">Em Estoque</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Bloqueada">Bloqueada</option>
                </select>
                <input style={styles.input} type="date" value={formEdicao.data_aquisicao ? formEdicao.data_aquisicao.substring(0, 10) : ''} onChange={(e) => setFormEdicao({ ...formEdicao, data_aquisicao: e.target.value })} />
                <input style={styles.input} placeholder="Custo de Aquisição" value={formEdicao.custo_aquisicao || ''} onChange={(e) => setFormEdicao({ ...formEdicao, custo_aquisicao: e.target.value })} />
                <select style={styles.input} value={formEdicao.id_cliente || ''} onChange={(e) => setFormEdicao({ ...formEdicao, id_cliente: e.target.value })}>
                  <option value="">Vincular a um Cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome_cliente}</option>
                  ))}
                </select>
                <input style={styles.input} placeholder="Fornecedor" value={formEdicao.fornecedor || ''} onChange={(e) => setFormEdicao({ ...formEdicao, fornecedor: e.target.value })} />
                <input style={styles.input} placeholder="Versão do Firmware" value={formEdicao.versao_firmware || ''} onChange={(e) => setFormEdicao({ ...formEdicao, versao_firmware: e.target.value })} />
                <textarea style={styles.input} placeholder="Notas Internas" value={formEdicao.notas_internas || ''} onChange={(e) => setFormEdicao({ ...formEdicao, notas_internas: e.target.value })} rows={3} />
                <button style={styles.botaoSalvar} onClick={async () => {
                  try {
                    await api.patch(`/maquinas/${maquinaSelecionada.numero_serie}`, {
                      ...formEdicao,
                      custo_aquisicao: formEdicao.custo_aquisicao
                        ? parseFloat(String(formEdicao.custo_aquisicao).replace(',', '.'))
                        : null,
                    });
                    alert('Máquina atualizada com sucesso!');
                    setEditando(false);
                    setMaquinaSelecionada({ ...maquinaSelecionada, ...formEdicao });
                    const res = await api.get('/maquinas');
                    setMaquinas(res.data);
                  } catch {
                    alert('Erro ao atualizar máquina.');
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
                <tr key={m.id} style={{ ...styles.tr, cursor: 'pointer' }} onClick={() => { setMaquinaSelecionada(m); setFormEdicao(m); setEditando(false); }}>
                  <td style={styles.td}>{m.numero_serie}</td>
                  <td style={styles.td}>{m.modelo}</td>
                  <td style={styles.td}>{m.status}</td>
                  <td style={styles.td}>{m.nome_cliente || '—'}</td>
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