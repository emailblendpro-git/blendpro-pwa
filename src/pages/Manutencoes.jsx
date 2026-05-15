import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

const moeda = (v) => `R$ ${(Math.round(parseFloat(v || 0) * 100) / 100).toFixed(2).replace('.', ',')}`;

export default function Manutencoes() {
  const navigate = useNavigate();
  const { usuario, podeManutencao, podeGerenciar } = useUsuario();
  const [aba, setAba] = useState('registros');
  const [subAbaAbast, setSubAbaAbast] = useState('abastecidas');

  // Estados — Registros
  const [registros, setRegistros] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [listaVisivel, setListaVisivel] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [abastecidosHoje, setAbastecidosHoje] = useState(new Set());
  const [salvando, setSalvando] = useState(false);
  const [filtroSerial, setFiltroSerial] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [temCusto, setTemCusto] = useState(false);

  // Estados — Abastecimentos
  const [pendentes, setPendentes] = useState([]);
  const [maquinasSemAbast, setMaquinasSemAbast] = useState([]);
  const [carregandoAbast, setCarregandoAbast] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [qtdEditada, setQtdEditada] = useState({});
  const [selectMes, setSelectMes] = useState('');
  const [selectAno, setSelectAno] = useState('');

  // Estados — Novo abastecimento emergencial
  const [mostrarFormEmerg, setMostrarFormEmerg] = useState(null);
  const [formEmerg, setFormEmerg] = useState({ qtd_abastecida: '', observacao: '', nome_assinante: '' });
  const [salvandoEmerg, setSalvandoEmerg] = useState(false);

  // Estados — Cancelamento
  const [cancelandoId, setCancelandoId] = useState(null);
  const [senhaCancelamento, setSenhaCancelamento] = useState('');
  const [cancelando, setCancelando] = useState(false);

  // Estados — Edição
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [form, setForm] = useState({
    numero_serie: '', tipo_servico: '', qtd_abastecida: '',
    observacao: '', nome_assinante: '',
    tecnico_responsavel: usuario?.nome || '',
    custo_tipo: '', custo_descricao: '', custo_valor: '', custo_observacoes: '',
  });

  useEffect(() => {
    api.get('/maquinas').then((res) => setMaquinas(res.data)).catch(() => setMaquinas([]));
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = String(agora.getFullYear());
    setSelectMes(mes);
    setSelectAno(ano);
  }, []);

  const handleVerRegistros = () => {
    setListaVisivel(true);
    carregarRegistros(filtroDataInicio);
  };

  const carregarAbastecidosHoje = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const res = await api.get(`/manutencoes?data_inicio=${hoje}`);
      const seriais = new Set(
        (res.data || [])
          .filter(r => r.tipo_servico === 'Abastecimento' && r.status_lancamento !== 'Cancelado')
          .map(r => r.numero_serie)
      );
      setAbastecidosHoje(seriais);
    } catch { setAbastecidosHoje(new Set()); }
  };

  const carregarRegistros = async (dataInicio = '') => {
    try {
      setCarregando(true);
      const params = dataInicio ? `?data_inicio=${dataInicio}` : '';
      const [resMan, resCustos] = await Promise.all([
        api.get(`/manutencoes${params}`),
        api.get('/custos'),
      ]);
      const manutencoes = resMan.data.map(m => ({ ...m, _tipo: 'manutencao' }));
      const custos = resCustos.data.map(c => ({ ...c, _tipo: 'custo' }));
      const agora = new Date();
      const todos = [...manutencoes, ...custos].sort((a, b) => {
        const dataA = new Date(a.created_at);
        const dataB = new Date(b.created_at);
        if (dataA > agora && !(dataB > agora)) return 1;
        if (!(dataA > agora) && dataB > agora) return -1;
        return dataB - dataA;
      });
      setRegistros(todos);
    } catch { setRegistros([]); }
    finally { setCarregando(false); }
  };

  const carregarAbastecimentos = async (mes, ano) => {
    try {
      setCarregandoAbast(true);
      const resPend = await api.get(`/manutencoes/pendentes?mes=${mes}&ano=${ano}`);
      setPendentes(resPend.data.registros || []);
      const qtds = {};
      (resPend.data.registros || []).forEach(r => { qtds[r.id] = r.qtd_abastecida; });
      setQtdEditada(qtds);
      setSelecionados((resPend.data.registros || []).map(r => r.id));
      const resSem = await api.get(`/manutencoes/sem-abastecimento?mes=${mes}&ano=${ano}`);
      setMaquinasSemAbast(resSem.data.maquinas || []);
    } catch { setPendentes([]); setMaquinasSemAbast([]); }
    finally { setCarregandoAbast(false); }
  };

  const handleFechar = async () => {
    if (selecionados.length === 0) { alert('Selecione ao menos um registro.'); return; }
    if (!window.confirm(`Fechar ${selecionados.length} abastecimento(s)?`)) return;
    setFechando(true);
    try {
      const registrosParaFechar = selecionados.map(id => ({
        id, qtd_abastecida: parseFloat(qtdEditada[id] || 0),
      }));
      await api.post('/manutencoes/fechar', { registros: registrosParaFechar });
      alert(`${selecionados.length} abastecimento(s) fechado(s) com sucesso!`);
      await carregarAbastecimentos(selectMes, selectAno);
    } catch { alert('Erro ao fechar abastecimentos.'); }
    finally { setFechando(false); }
  };

  const handleRegistrarEmergencial = async (numero_serie) => {
    if (!formEmerg.qtd_abastecida) { alert('Informe a quantidade.'); return; }
    setSalvandoEmerg(true);
    try {
      await api.post('/manutencoes', {
        numero_serie,
        tipo_servico: 'Abastecimento',
        qtd_abastecida: parseFloat(formEmerg.qtd_abastecida),
        observacao: formEmerg.observacao,
        nome_assinante: formEmerg.nome_assinante,
        tecnico_responsavel: usuario?.nome || '',
      });
      alert('Abastecimento registrado!');
      setMostrarFormEmerg(null);
      setFormEmerg({ qtd_abastecida: '', observacao: '', nome_assinante: '' });
      await carregarAbastecimentos(selectMes, selectAno);
    } catch { alert('Erro ao registrar abastecimento.'); }
    finally { setSalvandoEmerg(false); }
  };

  const toggleSelecionado = (id) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };
  const toggleTodos = () => {
    setSelecionados(selecionados.length === pendentes.length ? [] : pendentes.map(r => r.id));
  };

  const resetForm = () => {
    setForm({
      numero_serie: '', tipo_servico: '', qtd_abastecida: '',
      observacao: '', nome_assinante: '',
      tecnico_responsavel: usuario?.nome || '',
      custo_tipo: '', custo_descricao: '', custo_valor: '', custo_observacoes: '',
    });
    setTemCusto(false);
  };

  const handleSubmit = async () => {
    if (!form.numero_serie || !form.tipo_servico) { alert('Máquina e Tipo de Serviço são obrigatórios.'); return; }
    if (temCusto && (!form.custo_tipo || !form.custo_valor)) { alert('Tipo e valor do custo são obrigatórios.'); return; }
    setSalvando(true);
    try {
      await api.post('/manutencoes', {
        numero_serie: form.numero_serie, tipo_servico: form.tipo_servico,
        qtd_abastecida: form.qtd_abastecida ? parseFloat(form.qtd_abastecida) : null,
        observacao: form.observacao, nome_assinante: form.nome_assinante,
        tecnico_responsavel: form.tecnico_responsavel,
      });
      if (temCusto) {
        await api.post('/custos', {
          numero_serie: form.numero_serie, data: new Date().toISOString().split('T')[0],
          tipo: form.custo_tipo, descricao: form.custo_descricao,
          valor: parseFloat(form.custo_valor), tecnico_responsavel: form.tecnico_responsavel,
          observacoes: form.custo_observacoes,
        });
      }
      alert('Registro salvo!');
      setMostrarForm(false);
      resetForm();
      await carregarRegistros();
    } catch { alert('Erro ao salvar registro.'); }
    finally { setSalvando(false); }
  };

  const handleConfirmarCusto = async (id) => {
    if (!window.confirm('Confirmar este custo?')) return;
    try { await api.patch(`/custos/${id}/confirmar`); await carregarRegistros(); }
    catch { alert('Erro ao confirmar custo.'); }
  };

  const handleDeletarCusto = async (id) => {
    if (!window.confirm('Remover este custo?')) return;
    try { await api.delete(`/custos/${id}`); await carregarRegistros(); }
    catch { alert('Erro ao remover custo.'); }
  };

  const handleCancelar = async (id) => {
    if (senhaCancelamento.length !== 4) { alert('Digite os 4 dígitos da senha.'); return; }
    setCancelando(true);
    try {
      await api.patch(`/manutencoes/${id}/cancelar`, { senha_admin: senhaCancelamento });
      alert('Registro cancelado com sucesso.');
      setCancelandoId(null);
      setSenhaCancelamento('');
      await carregarRegistros();
    } catch (e) {
      alert(e?.response?.data?.erro || 'Erro ao cancelar registro.');
    } finally { setCancelando(false); }
  };

  const handleAbrirEdicao = (r) => {
    setEditandoId(r.id);
    setCancelandoId(null);
    setFormEdicao({
      tipo_servico: r.tipo_servico || '',
      qtd_abastecida: r.qtd_abastecida || '',
      observacao: r.observacao || '',
      nome_assinante: r.nome_assinante || '',
      valor_unitario: r.valor_unitario || '',
      custo_unitario: r.custo_unitario || '',
      data_registro: r.created_at ? r.created_at.substring(0, 10) : '',
    });
  };

  const handleSalvarEdicao = async (id) => {
    setSalvandoEdicao(true);
    try {
      await api.patch(`/manutencoes/${id}`, {
        tipo_servico: formEdicao.tipo_servico,
        qtd_abastecida: formEdicao.qtd_abastecida ? parseFloat(formEdicao.qtd_abastecida) : null,
        observacao: formEdicao.observacao,
        nome_assinante: formEdicao.nome_assinante,
        valor_unitario: formEdicao.valor_unitario ? parseFloat(formEdicao.valor_unitario) : null,
        custo_unitario: formEdicao.custo_unitario ? parseFloat(formEdicao.custo_unitario) : null,
        data_registro: formEdicao.data_registro,
      });
      alert('Registro atualizado com sucesso!');
      setEditandoId(null);
      await carregarRegistros();
    } catch (e) {
      alert(e?.response?.data?.erro || 'Erro ao salvar edição.');
    } finally { setSalvandoEdicao(false); }
  };

  const formatarData = (data) => { if (!data) return '—'; return new Date(data).toLocaleDateString('pt-BR'); };
  const icone = (item) => {
    if (item._tipo === 'custo') return '💰';
    if (item.tipo_servico === 'Abastecimento') return '💧';
    if (item.tipo_servico === 'Instalação') return '🏗️';
    if (item.tipo_servico === 'Retirada') return '📦';
    return '🔧';
  };

  const registrosFiltrados = registros.filter(r => {
    const serialOk = filtroSerial === '' || r.numero_serie === filtroSerial;
    const tipoOk = filtroTipo === '' ||
      (filtroTipo === 'custo' && r._tipo === 'custo') ||
      (filtroTipo !== 'custo' && r.tipo_servico === filtroTipo);
    return serialOk && tipoOk;
  });

  const totalSelecionado = selecionados.reduce((acc, id) => {
    const reg = pendentes.find(r => r.id === id);
    if (!reg) return acc;
    return acc + (parseFloat(qtdEditada[id] || 0) * parseFloat(reg.valor_unitario || 0));
  }, 0);

  const SeletorMesAno = () => (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ color: '#94a3b8', fontSize: '14px' }}>Período:</span>
      <select style={{ ...styles.inputFiltro, flex: 'none', width: 'auto' }}
        value={selectMes}
        onChange={(e) => { setSelectMes(e.target.value); carregarAbastecimentos(e.target.value, selectAno); }}>
        <option value="01">Janeiro</option><option value="02">Fevereiro</option>
        <option value="03">Março</option><option value="04">Abril</option>
        <option value="05">Maio</option><option value="06">Junho</option>
        <option value="07">Julho</option><option value="08">Agosto</option>
        <option value="09">Setembro</option><option value="10">Outubro</option>
        <option value="11">Novembro</option><option value="12">Dezembro</option>
      </select>
      <select style={{ ...styles.inputFiltro, flex: 'none', width: 'auto' }}
        value={selectAno}
        onChange={(e) => { setSelectAno(e.target.value); carregarAbastecimentos(selectMes, e.target.value); }}>
        {Array.from({ length: 10 }, (_, i) => 2021 + i).map(ano => (
          <option key={ano} value={String(ano)}>{ano}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <button style={styles.botaoVoltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
      </div>
      <div style={styles.conteudo}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitulo}>Registros</h2>
          {aba === 'registros' && podeManutencao && (
            <button style={styles.botaoNovo} onClick={() => {
              if (!mostrarForm) carregarAbastecidosHoje();
              setMostrarForm(!mostrarForm);
              resetForm();
            }}>
              {mostrarForm ? '✕ Fechar' : '+ Novo Registro'}
            </button>
          )}
        </div>

        {/* ABAS PRINCIPAIS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button style={{ ...styles.aba, ...(aba === 'registros' ? styles.abaAtiva : {}) }}
            onClick={() => setAba('registros')}>📋 Todos os Registros</button>
          {podeGerenciar && (
            <button style={{ ...styles.aba, ...(aba === 'abastecimentos' ? styles.abaAtiva : {}) }}
              onClick={() => { setAba('abastecimentos'); carregarAbastecimentos(selectMes, selectAno); }}>
              💧 Abastecimentos
            </button>
          )}
          {podeGerenciar && (
            <button style={{ ...styles.aba, ...(aba === 'custos' ? styles.abaAtiva : {}) }}
              onClick={() => setAba('custos')}>💰 Custos</button>
          )}
        </div>

        {/* ABA TODOS OS REGISTROS */}
        {aba === 'registros' && (
          <>
            {mostrarForm && podeManutencao && (
              <div style={styles.form}>
                <h3 style={styles.formTitulo}>Novo Registro</h3>
                <select style={styles.input} value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })}>
                  <option value="">Selecionar Máquina *</option>
                  {[...maquinas].sort((a, b) => {
                    const aOk = abastecidosHoje.has(a.numero_serie);
                    const bOk = abastecidosHoje.has(b.numero_serie);
                    if (aOk && !bOk) return 1;
                    if (!aOk && bOk) return -1;
                    return 0;
                  }).map((m) => {
                    const feita = abastecidosHoje.has(m.numero_serie);
                    return (
                      <option key={m.id} value={m.numero_serie}>
                        {feita ? '✅' : '🔵'} {m.numero_serie} — {m.nome_cliente || 'Sem cliente'}{feita ? ' (abastecida hoje)' : ''}
                      </option>
                    );
                  })}
                </select>
                <select style={styles.input} value={form.tipo_servico} onChange={(e) => { setForm({ ...form, tipo_servico: e.target.value }); setTemCusto(false); }}>
                  <option value="">Tipo de Serviço *</option>
                  <option value="Instalação">🏗️ Instalação</option>
                  <option value="Abastecimento">💧 Abastecimento</option>
                  <option value="Manutenção">🔧 Manutenção</option>
                  <option value="Retirada">📦 Retirada</option>
                </select>
                {form.tipo_servico === 'Abastecimento' && (
                  <input style={styles.input} placeholder="Quantidade Abastecida (litros)" type="number" value={form.qtd_abastecida} onChange={(e) => setForm({ ...form, qtd_abastecida: e.target.value })} />
                )}
                <input style={styles.input} placeholder="Nome do Assinante" value={form.nome_assinante} onChange={(e) => setForm({ ...form, nome_assinante: e.target.value })} />
                <input style={styles.input} placeholder="Técnico Responsável" value={form.tecnico_responsavel} onChange={(e) => setForm({ ...form, tecnico_responsavel: e.target.value })} />
                <textarea style={styles.input} placeholder="Observações" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={2} />
                {(form.tipo_servico === 'Manutenção' || form.tipo_servico === 'Instalação') && (
                  <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', border: '1px solid #334155' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f1f5f9' }}>
                      <input type="checkbox" checked={temCusto} onChange={(e) => setTemCusto(e.target.checked)} />
                      <span>💰 Houve troca de peça ou custo adicional?</span>
                    </label>
                    {temCusto && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <select style={styles.input} value={form.custo_tipo} onChange={(e) => setForm({ ...form, custo_tipo: e.target.value })}>
                          <option value="">Tipo de Custo *</option>
                          <option value="Peça">Peça</option><option value="Mão de Obra">Mão de Obra</option>
                          <option value="Deslocamento">Deslocamento</option><option value="Gabinete">Gabinete</option>
                          <option value="Bomba">Bomba</option><option value="Válvula">Válvula</option>
                          <option value="Outro">Outro</option>
                        </select>
                        <input style={styles.input} placeholder="Descrição" value={form.custo_descricao} onChange={(e) => setForm({ ...form, custo_descricao: e.target.value })} />
                        <input style={styles.input} placeholder="Valor (R$) *" type="number" step="0.01" value={form.custo_valor} onChange={(e) => setForm({ ...form, custo_valor: e.target.value })} />
                        <textarea style={styles.input} placeholder="Observações do custo" value={form.custo_observacoes} onChange={(e) => setForm({ ...form, custo_observacoes: e.target.value })} rows={2} />
                        <p style={{ color: '#f59e0b', fontSize: '12px', margin: 0 }}>⚠️ Custo pendente de confirmação pelo operador interno.</p>
                      </div>
                    )}
                  </div>
                )}
                <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            )}

            {!listaVisivel ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <button style={styles.botaoVerLista} onClick={handleVerRegistros}>
                  📋 Ver Registros
                </button>
              </div>
            ) : (
            <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <select style={styles.inputFiltro} value={filtroSerial} onChange={(e) => setFiltroSerial(e.target.value)}>
                <option value="">Todas as Máquinas</option>
                {maquinas.map((m) => (<option key={m.id} value={m.numero_serie}>{m.numero_serie}</option>))}
              </select>
              <select style={styles.inputFiltro} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Todos os Tipos</option>
                <option value="Instalação">🏗️ Instalação</option>
                <option value="Abastecimento">💧 Abastecimento</option>
                <option value="Manutenção">🔧 Manutenção</option>
                <option value="Retirada">📦 Retirada</option>
                <option value="custo">💰 Custo</option>
              </select>
              <input
                type="date"
                style={styles.inputFiltro}
                value={filtroDataInicio}
                onChange={(e) => { setFiltroDataInicio(e.target.value); carregarRegistros(e.target.value); }}
              />
            </div>

            {carregando ? <p style={styles.mensagem}>Carregando...</p> :
              registrosFiltrados.length === 0 ? <p style={styles.mensagem}>Nenhum registro encontrado.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {registrosFiltrados.map((r) => (
                    <div key={r.id} style={{
                      backgroundColor: '#1e293b', borderRadius: '8px', padding: '8px 14px',
                      borderLeft: `4px solid ${r._tipo === 'custo' ? (r.status === 'Confirmado' ? '#22c55e' : '#f59e0b') : r.status_lancamento === 'Cancelado' ? '#6b7280' : '#38bdf8'}`,
                    }}>
                      {/* LINHA PRINCIPAL */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>

                        {/* ESQUERDA — identificação */}
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: r.status_lancamento === 'Cancelado' ? '#6b7280' : '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: 0 }}>
                          {icone(r)} {r.numero_serie}{r.nome_local || r.nome_cliente ? ` — ${r.nome_local || r.nome_cliente}` : ''} · {r._tipo === 'custo' ? `${r.tipo} (Custo)` : r.tipo_servico}
                          {r.status_lancamento === 'Cancelado' && <span style={{ marginLeft: '6px', fontSize: '11px', color: '#6b7280', fontWeight: 'normal' }}>● Cancelado</span>}
                        </span>

                        {/* DIREITA — data, qtd, botões */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {formatarData(r.created_at || r.data)}
                            {(r.tecnico_nome || r.tecnico_responsavel) ? ` · ${r.tecnico_nome || r.tecnico_responsavel}` : ''}
                          </span>
                          {r._tipo === 'manutencao' && r.qtd_abastecida && (
                            <span style={{ fontSize: '12px', color: '#38bdf8', whiteSpace: 'nowrap' }}>💧 {r.qtd_abastecida}L</span>
                          )}
                          {r._tipo === 'custo' && (
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: r.status === 'Confirmado' ? '#22c55e' : '#f59e0b', whiteSpace: 'nowrap' }}>
                              {moeda(r.valor)} · {r.status === 'Confirmado' ? '✅' : '⏳'}
                            </span>
                          )}
                          {usuario?.perfil === 'master' && r._tipo === 'manutencao' && r.status_lancamento !== 'Cancelado' && editandoId !== r.id && cancelandoId !== r.id && (
                            <button style={{ ...styles.botaoAcao, backgroundColor: '#f59e0b' }}
                              onClick={() => handleAbrirEdicao(r)}>
                              ✏️ Editar
                            </button>
                          )}
                          {usuario?.perfil === 'master' && r._tipo === 'manutencao' && r.status_lancamento !== 'Cancelado' && cancelandoId !== r.id && editandoId !== r.id && (
                            <button style={{ ...styles.botaoAcao, backgroundColor: '#dc2626' }}
                              onClick={() => { setCancelandoId(r.id); setSenhaCancelamento(''); }}>
                              🚫 Cancelar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* FORMULÁRIO DE EDIÇÃO */}
                      {usuario?.perfil === 'master' && r._tipo === 'manutencao' && editandoId === r.id && (
                        <div style={{ marginTop: '10px', backgroundColor: '#0f172a', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <p style={{ color: '#f59e0b', fontSize: '12px', margin: 0 }}>✏️ Editando registro</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                            <div>
                              <label style={styles.label}>Tipo de Serviço</label>
                              <select style={styles.input} value={formEdicao.tipo_servico} onChange={(e) => setFormEdicao({ ...formEdicao, tipo_servico: e.target.value })}>
                                <option value="Abastecimento">💧 Abastecimento</option>
                                <option value="Instalação">🏗️ Instalação</option>
                                <option value="Manutenção">🔧 Manutenção</option>
                                <option value="Retirada">📦 Retirada</option>
                              </select>
                            </div>
                            <div>
                              <label style={styles.label}>Quantidade (L)</label>
                              <input style={styles.input} type="number" step="0.1"
                                value={formEdicao.qtd_abastecida}
                                onChange={(e) => setFormEdicao({ ...formEdicao, qtd_abastecida: e.target.value })} />
                            </div>
                            <div>
                              <label style={styles.label}>Data do Registro</label>
                              <input style={styles.input} type="date"
                                value={formEdicao.data_registro}
                                onChange={(e) => setFormEdicao({ ...formEdicao, data_registro: e.target.value })} />
                            </div>
                            <div>
                              <label style={styles.label}>Valor Unitário (R$)</label>
                              <input style={styles.input} type="number" step="0.01"
                                value={formEdicao.valor_unitario}
                                onChange={(e) => setFormEdicao({ ...formEdicao, valor_unitario: e.target.value })} />
                            </div>
                            <div>
                              <label style={styles.label}>Custo Unitário (R$)</label>
                              <input style={styles.input} type="number" step="0.01"
                                value={formEdicao.custo_unitario}
                                onChange={(e) => setFormEdicao({ ...formEdicao, custo_unitario: e.target.value })} />
                            </div>
                            <div>
                              <label style={styles.label}>Nome do Assinante</label>
                              <input style={styles.input}
                                value={formEdicao.nome_assinante}
                                onChange={(e) => setFormEdicao({ ...formEdicao, nome_assinante: e.target.value })} />
                            </div>
                          </div>
                          <div>
                            <label style={styles.label}>Observação</label>
                            <textarea style={styles.input} rows={2}
                              value={formEdicao.observacao}
                              onChange={(e) => setFormEdicao({ ...formEdicao, observacao: e.target.value })} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{ ...styles.botaoAcao, backgroundColor: '#22c55e' }}
                              onClick={() => handleSalvarEdicao(r.id)} disabled={salvandoEdicao}>
                              {salvandoEdicao ? 'Salvando...' : '✓ Salvar'}
                            </button>
                            <button style={{ ...styles.botaoAcao, backgroundColor: '#475569' }}
                              onClick={() => setEditandoId(null)}>
                              ✕ Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* FORMULÁRIO DE CANCELAMENTO */}
                      {usuario?.perfil === 'master' && r._tipo === 'manutencao' && cancelandoId === r.id && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', backgroundColor: '#0f172a', borderRadius: '6px', padding: '8px 12px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#f59e0b', fontSize: '12px' }}>⚠️ Senha admin:</span>
                          <input
                            style={{ ...styles.input, width: '80px', letterSpacing: '6px', textAlign: 'center', fontSize: '16px', padding: '6px 8px' }}
                            type="password" maxLength={4} placeholder="••••"
                            value={senhaCancelamento}
                            onChange={(e) => setSenhaCancelamento(e.target.value)} />
                          <button style={{ ...styles.botaoAcao, backgroundColor: '#dc2626' }}
                            onClick={() => handleCancelar(r.id)} disabled={cancelando}>
                            {cancelando ? 'Cancelando...' : '✓ Confirmar'}
                          </button>
                          <button style={{ ...styles.botaoAcao, backgroundColor: '#475569' }}
                            onClick={() => { setCancelandoId(null); setSenhaCancelamento(''); }}>
                            ✕ Voltar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
            )}
          </>
        )}

        {/* ABA ABASTECIMENTOS */}
        {aba === 'abastecimentos' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button style={{ ...styles.aba, ...(subAbaAbast === 'abastecidas' ? styles.abaAtiva : {}) }}
                onClick={() => setSubAbaAbast('abastecidas')}>✅ Máquinas Abastecidas</button>
              <button style={{ ...styles.aba, ...(subAbaAbast === 'sem' ? styles.abaAtiva : {}) }}
                onClick={() => setSubAbaAbast('sem')}>⚠️ Sem Abastecimento</button>
            </div>

            <SeletorMesAno />

            {carregandoAbast ? <p style={styles.mensagem}>Carregando...</p> : (
              <>
                {subAbaAbast === 'abastecidas' && (
                  <>
                    {pendentes.length === 0 ? (
                      <p style={styles.mensagem}>Nenhum abastecimento pendente neste período.</p>
                    ) : (
                      <>
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f1f5f9', fontWeight: 'bold' }}>
                            <input type="checkbox"
                              checked={selecionados.length === pendentes.length && pendentes.length > 0}
                              onChange={toggleTodos} />
                            Selecionar todas ({pendentes.length})
                          </label>
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{selecionados.length} selecionada(s)</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                          {pendentes.map((r) => (
                            <label key={r.id} style={{
                              backgroundColor: selecionados.includes(r.id) ? '#0c4a6e' : '#1e293b',
                              border: selecionados.includes(r.id) ? '1px solid #0ea5e9' : '1px solid #334155',
                              borderRadius: '10px', padding: '14px 16px',
                              display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                            }}>
                              <input type="checkbox" checked={selecionados.includes(r.id)} onChange={() => toggleSelecionado(r.id)} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>💧 {r.numero_serie} — {r.nome_cliente || '—'}</div>
                                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{formatarData(r.created_at)} · {r.tecnico_nome || '—'}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="number" step="0.1"
                                  value={qtdEditada[r.id] || ''}
                                  onChange={(e) => setQtdEditada({ ...qtdEditada, [r.id]: e.target.value })}
                                  onClick={(e) => e.preventDefault()}
                                  style={{ ...styles.input, width: '80px', textAlign: 'center', padding: '6px 8px' }} />
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>L</span>
                                <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: 'bold', minWidth: '90px', textAlign: 'right' }}>
                                  {moeda(parseFloat(qtdEditada[r.id] || 0) * parseFloat(r.valor_unitario || 0))}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Total selecionado</p>
                            <p style={{ color: '#22c55e', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>{moeda(totalSelecionado)}</p>
                          </div>
                          <button style={{ ...styles.botaoSalvar, marginTop: 0, padding: '12px 24px' }}
                            onClick={handleFechar} disabled={fechando || selecionados.length === 0}>
                            {fechando ? 'Fechando...' : `✅ Fechar ${selecionados.length} registro(s)`}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {subAbaAbast === 'sem' && (
                  <>
                    {maquinasSemAbast.length === 0 ? (
                      <p style={styles.mensagem}>✅ Todas as máquinas foram abastecidas neste período!</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {maquinasSemAbast.map((m, i) => (
                          <div key={i} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 16px', borderLeft: '4px solid #f59e0b' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>⚠️ {m.numero_serie}</div>
                                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{m.nome_cliente || '—'} · {m.status}</div>
                              </div>
                              <button style={{ ...styles.botaoAcao, backgroundColor: '#0ea5e9' }}
                                onClick={() => setMostrarFormEmerg(mostrarFormEmerg === m.numero_serie ? null : m.numero_serie)}>
                                + Registrar Abastecimento
                              </button>
                            </div>
                            {mostrarFormEmerg === m.numero_serie && (
                              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#0f172a', borderRadius: '8px', padding: '12px' }}>
                                <input style={styles.input} placeholder="Quantidade (litros) *" type="number"
                                  value={formEmerg.qtd_abastecida}
                                  onChange={(e) => setFormEmerg({ ...formEmerg, qtd_abastecida: e.target.value })} />
                                <input style={styles.input} placeholder="Nome do Assinante"
                                  value={formEmerg.nome_assinante}
                                  onChange={(e) => setFormEmerg({ ...formEmerg, nome_assinante: e.target.value })} />
                                <textarea style={styles.input} placeholder="Observações" rows={2}
                                  value={formEmerg.observacao}
                                  onChange={(e) => setFormEmerg({ ...formEmerg, observacao: e.target.value })} />
                                <button style={{ ...styles.botaoSalvar, marginTop: 0 }}
                                  onClick={() => handleRegistrarEmergencial(m.numero_serie)}
                                  disabled={salvandoEmerg}>
                                  {salvandoEmerg ? 'Salvando...' : 'Salvar Abastecimento'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ABA CUSTOS */}
        {aba === 'custos' && podeGerenciar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {registros.filter(r => r._tipo === 'custo').length === 0 ? (
              <p style={styles.mensagem}>Nenhum custo registrado.</p>
            ) : (
              registros.filter(r => r._tipo === 'custo').map((r) => (
                <div key={r.id} style={{
                  backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 16px',
                  borderLeft: `4px solid ${r.status === 'Confirmado' ? '#22c55e' : '#f59e0b'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>💰 {r.numero_serie} — {r.tipo}</div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                        {formatarData(r.data)} · {r.tecnico_responsavel || '—'}
                      </div>
                      {r.descricao && <div style={{ fontSize: '13px', marginTop: '4px' }}>{r.descricao}</div>}
                      {r.observacoes && <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{r.observacoes}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: r.status === 'Confirmado' ? '#22c55e' : '#f59e0b' }}>{moeda(r.valor)}</div>
                      <div style={{ fontSize: '11px', color: r.status === 'Confirmado' ? '#22c55e' : '#f59e0b' }}>
                        {r.status === 'Confirmado' ? '✅ Confirmado' : '⏳ Pendente'}
                      </div>
                    </div>
                  </div>
                  {r.status === 'Pendente' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button style={{ ...styles.botaoAcao, backgroundColor: '#22c55e' }} onClick={() => handleConfirmarCusto(r.id)}>✅ Confirmar</button>
                      <button style={{ ...styles.botaoAcao, backgroundColor: '#ef4444' }} onClick={() => handleDeletarCusto(r.id)}>🗑️ Remover</button>
                    </div>
                  )}
                </div>
              ))
            )}
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
  input: { padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  botaoSalvar: { padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '8px' },
  inputFiltro: { padding: '10px 14px', backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', flex: 1, minWidth: '200px' },
  botaoAcao: { padding: '6px 14px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  aba: { padding: '10px 20px', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  abaAtiva: { backgroundColor: '#0ea5e9', color: '#fff', border: '1px solid #0ea5e9' },
  label: { color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
  botaoVerLista: { padding: '14px 32px', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
};
