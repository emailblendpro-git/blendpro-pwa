import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const moeda = (v) => `R$ ${(Math.round(parseFloat(v || 0) * 100) / 100).toFixed(2).replace('.', ',')}`;
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function Prestadores() {
  const navigate = useNavigate();
  const [prestadores, setPrestadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Painel de apuração
  const [prestadorSelecionado, setPrestadorSelecionado] = useState(null);
  const [selectMes, setSelectMes] = useState('');
  const [selectAno, setSelectAno] = useState('');
  const [apuracao, setApuracao] = useState(null);
  const [apurando, setApurando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // Formulário de pagamento
  const [mostrarFormPagamento, setMostrarFormPagamento] = useState(false);
  const [formPagamento, setFormPagamento] = useState({ valor_pago: '', forma_pagamento: 'PIX', data_pagamento: '', observacao: '' });
  const [registrandoPagamento, setRegistrandoPagamento] = useState(false);

  const formVazio = {
    nome: '', tipo: '', documento: '', email: '', telefone: '',
    banco: '', agencia: '', conta: '', tipo_conta: '', chave_pix: '', observacao: ''
  };
  const [form, setForm] = useState(formVazio);

  useEffect(() => {
    carregarPrestadores();
    const agora = new Date();
    setSelectMes(String(agora.getMonth() + 1).padStart(2, '0'));
    setSelectAno(String(agora.getFullYear()));
  }, []);

  const carregarPrestadores = async () => {
    try {
      setCarregando(true);
      const res = await api.get('/prestadores');
      setPrestadores(res.data);
    } catch { setPrestadores([]); }
    finally { setCarregando(false); }
  };

  const carregarHistorico = async (prestador_id) => {
    try {
      setCarregandoHistorico(true);
      const res = await api.get(`/pagamentos?prestador_id=${prestador_id}`);
      setHistorico(res.data);
    } catch { setHistorico([]); }
    finally { setCarregandoHistorico(false); }
  };

  const handleAbrirPrestador = (p) => {
    setPrestadorSelecionado(p);
    setApuracao(null);
    setMostrarFormPagamento(false);
    carregarHistorico(p.id);
  };

  const handleApurar = async () => {
    if (!selectMes || !selectAno) { alert('Selecione o período.'); return; }
    setApurando(true);
    try {
      const res = await api.get(`/pagamentos/apuracao/${prestadorSelecionado.id}?mes=${selectMes}&ano=${selectAno}`);
      setApuracao(res.data);
      setFormPagamento({
        valor_pago: res.data.total_apurado,
        forma_pagamento: 'PIX',
        data_pagamento: new Date().toISOString().split('T')[0],
        observacao: ''
      });
    } catch { alert('Erro ao apurar.'); }
    finally { setApurando(false); }
  };

  const handleRegistrarPagamento = async () => {
    if (!apuracao) { alert('Faça a apuração primeiro.'); return; }
    setRegistrandoPagamento(true);
    try {
      await api.post('/pagamentos', {
        prestador_id: prestadorSelecionado.id,
        periodo_mes: parseInt(selectMes),
        periodo_ano: parseInt(selectAno),
        valor_apurado: apuracao.total_apurado,
        valor_pago: formPagamento.valor_pago,
        data_pagamento: formPagamento.data_pagamento,
        forma_pagamento: formPagamento.forma_pagamento,
        observacao: formPagamento.observacao,
      });
      alert('Pagamento registrado com sucesso!');
      setMostrarFormPagamento(false);
      setApuracao(null);
      await carregarHistorico(prestadorSelecionado.id);
    } catch { alert('Erro ao registrar pagamento.'); }
    finally { setRegistrandoPagamento(false); }
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
    setPrestadorSelecionado(null);
  };

  const tipoColor = (tipo) => {
    const cores = { Operador: '#0ea5e9', Vendedor: '#22c55e', Transportador: '#f59e0b', Fornecedor: '#a855f7', Outro: '#94a3b8' };
    return cores[tipo] || '#94a3b8';
  };

  const formatarData = (data) => { if (!data) return '—'; return new Date(data).toLocaleDateString('pt-BR'); };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <button style={styles.botaoVoltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
      </div>
      <div style={styles.conteudo}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitulo}>Prestadores</h2>
          <button style={styles.botaoNovo} onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); setForm(formVazio); setPrestadorSelecionado(null); }}>
            {mostrarForm ? '✕ Fechar' : '+ Novo Prestador'}
          </button>
        </div>

        {/* FORMULÁRIO DE CADASTRO */}
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

        {/* PAINEL DE APURAÇÃO */}
        {prestadorSelecionado && (
          <div style={styles.painel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ color: '#38bdf8', margin: 0 }}>{prestadorSelecionado.nome}</h3>
                <span style={{ ...styles.badge, backgroundColor: tipoColor(prestadorSelecionado.tipo) }}>{prestadorSelecionado.tipo}</span>
                {prestadorSelecionado.chave_pix && <span style={{ ...styles.info, marginLeft: '8px' }}>PIX: {prestadorSelecionado.chave_pix}</span>}
              </div>
              <button style={styles.botaoFechar} onClick={() => { setPrestadorSelecionado(null); setApuracao(null); }}>✕ Fechar</button>
            </div>

            {/* SELETOR DE PERÍODO */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Período:</span>
              <select style={{ ...styles.input, width: 'auto', flex: 'none' }} value={selectMes} onChange={(e) => setSelectMes(e.target.value)}>
                {meses.map((m, i) => (
                  <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
              <select style={{ ...styles.input, width: 'auto', flex: 'none' }} value={selectAno} onChange={(e) => setSelectAno(e.target.value)}>
                {Array.from({ length: 10 }, (_, i) => 2021 + i).map(ano => (
                  <option key={ano} value={String(ano)}>{ano}</option>
                ))}
              </select>
              <button style={styles.botaoApurar} onClick={handleApurar} disabled={apurando}>
                {apurando ? 'Apurando...' : '🔍 Apurar'}
              </button>
            </div>

            {/* RESULTADO DA APURAÇÃO */}
            {apuracao && (
              <div style={{ marginBottom: '24px' }}>
                <div style={styles.totalApurado}>
                  <div>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Total apurado — {meses[parseInt(selectMes) - 1]}/{selectAno}</p>
                    <p style={{ color: '#22c55e', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{moeda(apuracao.total_apurado)}</p>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '12px' }}>{apuracao.registros.length} registro(s)</p>
                  </div>
                  <button style={styles.botaoPagar} onClick={() => setMostrarFormPagamento(!mostrarFormPagamento)}>
                    {mostrarFormPagamento ? '✕ Cancelar' : '💸 Registrar Pagamento'}
                  </button>
                </div>

                {/* FORMULÁRIO DE PAGAMENTO */}
                {mostrarFormPagamento && (
                  <div style={{ ...styles.form, marginTop: '12px' }}>
                    <h4 style={{ color: '#38bdf8', margin: '0 0 12px 0' }}>💸 Registrar Pagamento</h4>
                    <div style={styles.formGrid}>
                      <div>
                        <label style={styles.painelLabel}>Valor a Pagar (R$)</label>
                        <input style={styles.input} type="number" step="0.01"
                          value={formPagamento.valor_pago}
                          onChange={(e) => setFormPagamento({ ...formPagamento, valor_pago: e.target.value })} />
                      </div>
                      <div>
                        <label style={styles.painelLabel}>Forma de Pagamento</label>
                        <select style={styles.input} value={formPagamento.forma_pagamento} onChange={(e) => setFormPagamento({ ...formPagamento, forma_pagamento: e.target.value })}>
                          <option value="PIX">PIX</option>
                          <option value="Transferência">Transferência</option>
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label style={styles.painelLabel}>Data do Pagamento</label>
                        <input style={styles.input} type="date"
                          value={formPagamento.data_pagamento}
                          onChange={(e) => setFormPagamento({ ...formPagamento, data_pagamento: e.target.value })} />
                      </div>
                    </div>
                    <textarea style={styles.input} placeholder="Observações" rows={2}
                      value={formPagamento.observacao}
                      onChange={(e) => setFormPagamento({ ...formPagamento, observacao: e.target.value })} />
                    <button style={styles.botaoSalvar} onClick={handleRegistrarPagamento} disabled={registrandoPagamento}>
                      {registrandoPagamento ? 'Registrando...' : '✓ Confirmar Pagamento'}
                    </button>
                  </div>
                )}

                {/* BOTÃO EXPORTAR PDF */}
                {apuracao.registros.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                      style={{ ...styles.botaoAcao, backgroundColor: '#7c3aed', padding: '8px 16px' }}
                      onClick={() => {
                        // Detecta quais colunas têm valor para este prestador
                        const temOperacional = apuracao.registros.some(r => parseFloat(r.valor_custo_operacional) > 0);
                        const temLogistico = apuracao.registros.some(r => parseFloat(r.valor_logistico) > 0);
                        const temComissao1 = apuracao.registros.some(r => parseFloat(r.valor_comissionado_1) > 0);
                        const temComissao2 = apuracao.registros.some(r => parseFloat(r.valor_comissionado_2) > 0);
                        const temOutros = apuracao.registros.some(r => parseFloat(r.valor_outros) > 0);

                        const colunas = [
                          { key: 'operacional', label: 'Operacional', ativo: temOperacional },
                          { key: 'logistico', label: 'Logístico', ativo: temLogistico },
                          { key: 'comissao1', label: 'Comissão 1', ativo: temComissao1 },
                          { key: 'comissao2', label: 'Comissão 2', ativo: temComissao2 },
                          { key: 'outros', label: 'Outros', ativo: temOutros },
                        ].filter(c => c.ativo);

                        const win = window.open('', '_blank');
                        win.document.write(`
                          <html>
                          <head>
                            <title>Apuração — ${prestadorSelecionado.nome} — ${meses[parseInt(selectMes)-1]}/${selectAno}</title>
                            <style>
                              @page { size: A4 landscape; margin: 16mm; }
                              body { font-family: Arial, sans-serif; padding: 0; color: #1e293b; font-size: 11px; }
                              h2 { margin: 0 0 2px 0; font-size: 16px; }
                              .sub { color: #64748b; font-size: 11px; margin-bottom: 16px; }
                              table { width: 100%; border-collapse: collapse; font-size: 10px; }
                              th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; white-space: nowrap; }
                              td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
                              tr:nth-child(even) { background: #f8fafc; }
                              .total { font-weight: bold; color: #166534; }
                              .rodape { margin-top: 16px; text-align: right; font-size: 12px; font-weight: bold; color: #166534; }
                              .rodape span { color: #64748b; font-weight: normal; font-size: 11px; }
                            </style>
                          </head>
                          <body>
                            <h2>${prestadorSelecionado.nome}</h2>
                            <div class="sub">
                              Apuração — ${meses[parseInt(selectMes)-1]}/${selectAno}
                              ${prestadorSelecionado.chave_pix ? ' · PIX: ' + prestadorSelecionado.chave_pix : ''}
                            </div>
                            <table>
                              <thead>
                                <tr>
                                  <th>Máquina</th>
                                  <th>Cliente</th>
                                  <th>Faturamento</th>
                                  ${colunas.map(c => `<th>${c.label}</th>`).join('')}
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${apuracao.registros.map(r => `
                                  <tr>
                                    <td>${r.numero_serie}</td>
                                    <td>${r.nome_cliente || '—'}</td>
                                    <td>${moeda(r.total_venda)}</td>
                                    ${temOperacional ? `<td>${parseFloat(r.valor_custo_operacional) > 0 ? moeda(r.valor_custo_operacional) : '—'}</td>` : ''}
                                    ${temLogistico ? `<td>${parseFloat(r.valor_logistico) > 0 ? moeda(r.valor_logistico) : '—'}</td>` : ''}
                                    ${temComissao1 ? `<td>${parseFloat(r.valor_comissionado_1) > 0 ? moeda(r.valor_comissionado_1) : '—'}</td>` : ''}
                                    ${temComissao2 ? `<td>${parseFloat(r.valor_comissionado_2) > 0 ? moeda(r.valor_comissionado_2) : '—'}</td>` : ''}
                                    ${temOutros ? `<td>${parseFloat(r.valor_outros) > 0 ? moeda(r.valor_outros) : '—'}</td>` : ''}
                                    <td class="total">${moeda(r.total_a_receber)}</td>
                                  </tr>
                                `).join('')}
                              </tbody>
                            </table>
                            <div class="rodape">
                              Total a receber: ${moeda(apuracao.total_apurado)}<br>
                              <span>Gerado em ${new Date().toLocaleDateString('pt-BR')} — BlendPro Platform</span>
                            </div>
                          </body>
                          </html>
                        `);
                        win.document.close();
                        win.print();
                      }}>
                      📄 Exportar PDF
                    </button>
                  </div>
                )}

                {/* TABELA DE REGISTROS */}
                {apuracao.registros.length > 0 && (
                  <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                    <table style={styles.tabela}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Máquina</th>
                          <th style={styles.th}>Cliente</th>
                          <th style={styles.th}>Data</th>
                          <th style={styles.th}>Faturamento</th>
                          {apuracao.registros.some(r => parseFloat(r.valor_custo_operacional) > 0) && <th style={styles.th}>Operacional</th>}
                          {apuracao.registros.some(r => parseFloat(r.valor_logistico) > 0) && <th style={styles.th}>Logístico</th>}
                          {apuracao.registros.some(r => parseFloat(r.valor_comissionado_1) > 0) && <th style={styles.th}>Comissão 1</th>}
                          {apuracao.registros.some(r => parseFloat(r.valor_comissionado_2) > 0) && <th style={styles.th}>Comissão 2</th>}
                          {apuracao.registros.some(r => parseFloat(r.valor_outros) > 0) && <th style={styles.th}>Outros</th>}
                          <th style={{ ...styles.th, color: '#22c55e' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apuracao.registros.map((r, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.td}>{r.numero_serie}</td>
                            <td style={styles.td}>{r.nome_cliente || '—'}</td>
                            <td style={styles.td}>{formatarData(r.data_referencia)}</td>
                            <td style={styles.td}>{moeda(r.total_venda)}</td>
                            {apuracao.registros.some(r => parseFloat(r.valor_custo_operacional) > 0) && <td style={styles.td}>{parseFloat(r.valor_custo_operacional) > 0 ? moeda(r.valor_custo_operacional) : '—'}</td>}
                            {apuracao.registros.some(r => parseFloat(r.valor_logistico) > 0) && <td style={styles.td}>{parseFloat(r.valor_logistico) > 0 ? moeda(r.valor_logistico) : '—'}</td>}
                            {apuracao.registros.some(r => parseFloat(r.valor_comissionado_1) > 0) && <td style={styles.td}>{parseFloat(r.valor_comissionado_1) > 0 ? moeda(r.valor_comissionado_1) : '—'}</td>}
                            {apuracao.registros.some(r => parseFloat(r.valor_comissionado_2) > 0) && <td style={styles.td}>{parseFloat(r.valor_comissionado_2) > 0 ? moeda(r.valor_comissionado_2) : '—'}</td>}
                            {apuracao.registros.some(r => parseFloat(r.valor_outros) > 0) && <td style={styles.td}>{parseFloat(r.valor_outros) > 0 ? moeda(r.valor_outros) : '—'}</td>}
                            <td style={{ ...styles.td, color: '#22c55e', fontWeight: 'bold' }}>{moeda(r.total_a_receber)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {apuracao.registros.length === 0 && (
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px' }}>
                    Nenhum registro encontrado para este prestador no período selecionado.
                  </p>
                )}
              </div>
            )}

            {/* HISTÓRICO DE PAGAMENTOS */}
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ color: '#38bdf8', margin: '0 0 12px 0', fontSize: '15px' }}>📋 Histórico de Pagamentos</h4>
              {carregandoHistorico ? <p style={styles.mensagem}>Carregando...</p> :
                historico.length === 0 ? <p style={styles.mensagem}>Nenhum pagamento registrado.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {historico.map((h) => (
                      <div key={h.id} style={{ ...styles.card, borderLeft: `4px solid ${h.status === 'Pago' ? '#22c55e' : '#f59e0b'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                              {meses[h.periodo_mes - 1]}/{h.periodo_ano}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                              {h.forma_pagamento} · {formatarData(h.data_pagamento)}
                              {h.registrado_por_nome ? ` · por ${h.registrado_por_nome}` : ''}
                            </div>
                            {h.observacao && <div style={{ color: '#94a3b8', fontSize: '12px' }}>{h.observacao}</div>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: h.status === 'Pago' ? '#22c55e' : '#f59e0b' }}>
                              {moeda(h.valor_pago || h.valor_apurado)}
                            </div>
                            <div style={{ fontSize: '11px', color: h.status === 'Pago' ? '#22c55e' : '#f59e0b' }}>
                              {h.status === 'Pago' ? '✅ Pago' : '⏳ Pendente'}
                            </div>
                            {h.valor_apurado !== h.valor_pago && (
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Apurado: {moeda(h.valor_apurado)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* LISTA DE PRESTADORES */}
        {carregando ? <p style={styles.mensagem}>Carregando...</p> :
          prestadores.length === 0 ? <p style={styles.mensagem}>Nenhum prestador cadastrado.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prestadores.map((p) => (
                <div key={p.id} style={{ ...styles.card, borderLeft: `4px solid ${tipoColor(p.tipo)}`, cursor: 'pointer' }}
                  onClick={() => handleAbrirPrestador(p)}>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ ...styles.botaoAcao, backgroundColor: '#22c55e' }}
                        onClick={(e) => { e.stopPropagation(); handleAbrirPrestador(p); }}>
                        💰 Apurar
                      </button>
                      <button style={{ ...styles.botaoAcao, backgroundColor: '#0ea5e9' }}
                        onClick={(e) => { e.stopPropagation(); handleEditar(p); }}>
                        ✏️ Editar
                      </button>
                    </div>
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
  form: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitulo: { color: '#38bdf8', margin: '0 0 8px 0' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' },
  secaoLabel: { color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 'bold' },
  input: { padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  botaoSalvar: { padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '8px' },
  card: { backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 16px' },
  badge: { padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', color: '#fff' },
  info: { fontSize: '12px', color: '#94a3b8' },
  botaoAcao: { padding: '6px 14px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  painel: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  botaoFechar: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  botaoApurar: { padding: '10px 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  botaoPagar: { padding: '10px 20px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  totalApurado: { backgroundColor: '#0f172a', borderRadius: '10px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', border: '1px solid #334155' },
  tabela: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '10px 12px', backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '12px', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #1e293b' },
  td: { padding: '10px 12px', color: '#f1f5f9', whiteSpace: 'nowrap' },
  painelLabel: { color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
};
