// ================================================================
// BLENDPRO PWA — Página: Registros Operacionais
// ================================================================
// Tela oficial de registro de visitas técnicas (abastecimento,
// limpeza, manutenção, inspeção, instalação, retirada) + custos.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';
import './RegistrosOperacionais.css';

const moeda = (v) => `R$ ${(Math.round(parseFloat(v || 0) * 100) / 100).toFixed(2).replace('.', ',')}`;

const tiposAcao = ['Abastecimento', 'Limpeza', 'Manutenção', 'Inspeção', 'Instalação', 'Retirada'];

const tiposCusto = ['Peça', 'Mão de Obra', 'Deslocamento', 'Gabinete', 'Bomba', 'Válvula', 'Outro'];

const iconeTipo = (item) => {
  if (item._tipo === 'custo') return '💰';
  if (item.tipo_acao === 'Abastecimento') return '💧';
  if (item.tipo_acao === 'Instalação') return '🏗️';
  if (item.tipo_acao === 'Retirada') return '📦';
  if (item.tipo_acao === 'Inspeção') return '👁️';
  if (item.tipo_acao === 'Limpeza') return '🧽';
  return '🔧';
};

const formatarData = (data) => {
  if (!data) return '—';
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const RegistrosOperacionais = () => {
  const navigate = useNavigate();
  const { isMaster } = useUsuario();

  // Estado do formulário
  const formInicial = {
    numero_serie: '',
    tipo_acao: 'Abastecimento',
    quantidade_litros: '',
    nome_conferente: '',
    observacao: '',
    data_visita: new Date().toISOString().slice(0, 16),
    custo_tipo: '',
    custo_descricao: '',
    custo_valor: '',
    custo_observacoes: '',
  };
  const [form, setForm] = useState(formInicial);
  const [temCusto, setTemCusto] = useState(false);

  // Estado de máquinas
  const [maquinas, setMaquinas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  // Estado de histórico
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [filtroMaquina, setFiltroMaquina] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroData, setFiltroData] = useState('');

  // Estado de edição (master)
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  useEffect(() => {
    carregarMaquinas();
    carregarHistorico();
  }, []);

  useEffect(() => {
    carregarHistorico();
  }, [filtroMaquina, filtroData]);

  const carregarMaquinas = async () => {
    try {
      const response = await api.get('/maquinas');
      setMaquinas(Array.isArray(response.data) ? response.data : response.data.dados || []);
    } catch (err) {
      console.error('Erro ao carregar máquinas:', err);
      setErro('Erro ao carregar máquinas');
    }
  };

  const carregarHistorico = async () => {
    try {
      setCarregandoHistorico(true);
      const paramsReg = new URLSearchParams({ limite: '100' });
      if (filtroMaquina) paramsReg.append('numero_serie', filtroMaquina);
      if (filtroData) {
        const d = new Date(filtroData);
        paramsReg.append('mes', String(d.getMonth() + 1));
        paramsReg.append('ano', String(d.getFullYear()));
      }
      const paramsCustos = filtroMaquina ? `?serial=${filtroMaquina}` : '';

      const [resReg, resCustos] = await Promise.all([
        api.get(`/registros-operacionais?${paramsReg.toString()}`),
        api.get(`/custos${paramsCustos}`),
      ]);

      const registros = (resReg.data.dados || []).map(r => ({ ...r, _tipo: 'registro' }));
      let custos = (resCustos.data || []).map(c => ({ ...c, _tipo: 'custo' }));

      if (filtroData) {
        const d = new Date(filtroData);
        custos = custos.filter(c => {
          const cd = new Date(c.data);
          return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
        });
      }

      const todos = [...registros, ...custos].sort(
        (a, b) => new Date(b.data_visita || b.data) - new Date(a.data_visita || a.data)
      );
      setHistorico(todos);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setHistorico([]);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const historicoFiltrado = historico.filter(item => {
    if (!filtroTipo) return true;
    if (filtroTipo === 'custo') return item._tipo === 'custo';
    return item._tipo === 'registro' && item.tipo_acao === filtroTipo;
  });

  const resetForm = () => {
    setForm(formInicial);
    setTemCusto(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!form.numero_serie) { setErro('Selecione uma máquina'); return; }
    if (!form.tipo_acao) { setErro('Selecione um tipo de ação'); return; }
    if (form.tipo_acao === 'Abastecimento' && !form.quantidade_litros) {
      setErro('Digite a quantidade de litros');
      return;
    }
    if (form.tipo_acao === 'Abastecimento' && parseFloat(form.quantidade_litros) <= 0) {
      setErro('Quantidade deve ser maior que 0');
      return;
    }
    if (temCusto && (!form.custo_tipo || !form.custo_valor)) {
      setErro('Tipo e valor do custo são obrigatórios');
      return;
    }

    setCarregando(true);

    try {
      const payload = {
        numero_serie: form.numero_serie,
        tipo_acao: form.tipo_acao,
        data_visita: form.data_visita,
        observacao: form.observacao || null,
        nome_conferente: form.nome_conferente || null,
        ...(form.tipo_acao === 'Abastecimento' && {
          quantidade_litros: parseFloat(form.quantidade_litros)
        })
      };

      await api.post('/registros-operacionais', payload);

      if (temCusto) {
        await api.post('/custos', {
          numero_serie: form.numero_serie,
          data: form.data_visita.slice(0, 10),
          tipo: form.custo_tipo,
          descricao: form.custo_descricao,
          valor: parseFloat(form.custo_valor),
          tecnico_responsavel: form.nome_conferente || null,
          observacoes: form.custo_observacoes,
        });
      }

      setSucesso(`✅ ${form.tipo_acao} registrado com sucesso!`);
      resetForm();
      carregarHistorico();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar registro');
      console.error('Erro:', err);
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'tipo_acao' && value !== 'Abastecimento' && { quantidade_litros: '' }),
    }));
    if (name === 'tipo_acao' && value !== 'Manutenção' && value !== 'Instalação') {
      setTemCusto(false);
    }
  };

  const handleAbrirEdicao = (r) => {
    setEditandoId(r.id);
    setFormEdicao({
      quantidade_litros: r.quantidade_litros || '',
      observacao: r.observacao || '',
      nome_conferente: r.nome_conferente || '',
    });
  };

  const handleSalvarEdicao = async (id) => {
    setSalvandoEdicao(true);
    try {
      await api.patch(`/registros-operacionais/${id}`, {
        quantidade_litros: formEdicao.quantidade_litros ? parseFloat(formEdicao.quantidade_litros) : null,
        observacao: formEdicao.observacao,
        nome_conferente: formEdicao.nome_conferente,
      });
      setEditandoId(null);
      await carregarHistorico();
    } catch (e) {
      alert(e?.response?.data?.erro || 'Erro ao salvar edição.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleDeletarRegistro = async (id) => {
    if (!window.confirm('Remover este registro? Essa ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/registros-operacionais/${id}`);
      await carregarHistorico();
    } catch (e) {
      alert(e?.response?.data?.erro || 'Erro ao remover registro.');
    }
  };

  const handleConfirmarCusto = async (id) => {
    if (!window.confirm('Confirmar este custo?')) return;
    try { await api.patch(`/custos/${id}/confirmar`); await carregarHistorico(); }
    catch { alert('Erro ao confirmar custo.'); }
  };

  const handleDeletarCusto = async (id) => {
    if (!window.confirm('Remover este custo?')) return;
    try { await api.delete(`/custos/${id}`); await carregarHistorico(); }
    catch { alert('Erro ao remover custo.'); }
  };

  const maquinaAtual = maquinas.find(m => m.numero_serie === form.numero_serie);

  return (
    <div className="registros-page">
      <div className="topo-barra">
        <h1 className="topo-titulo">BlendPro</h1>
        <button className="botao-voltar" onClick={() => navigate('/dashboard')}>← Voltar</button>
      </div>
      <div className="registros-container">
        {/* Header */}
        <div className="registros-header">
          <h1>📋 Registrar Operação</h1>
          <p>Abastecimento, limpeza, manutenção e mais</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="registros-form">
          {/* Máquina */}
          <div className="form-grupo">
            <label htmlFor="numero_serie">Máquina *</label>
            <select
              id="numero_serie"
              name="numero_serie"
              value={form.numero_serie}
              onChange={handleChange}
              required
            >
              <option value="">Selecione uma máquina...</option>
              {maquinas.map(m => (
                <option key={m.numero_serie} value={m.numero_serie}>
                  {m.numero_serie} - {m.modelo} ({m.nome_cliente})
                </option>
              ))}
            </select>
            {maquinaAtual && (
              <small className="form-info">
                📍 {maquinaAtual.nome_cliente}
              </small>
            )}
          </div>

          {/* Tipo de Ação */}
          <div className="form-grupo">
            <label htmlFor="tipo_acao">Tipo de Ação *</label>
            <div className="radio-group">
              {tiposAcao.map(tipo => (
                <label key={tipo} className="radio-option">
                  <input
                    type="radio"
                    name="tipo_acao"
                    value={tipo}
                    checked={form.tipo_acao === tipo}
                    onChange={handleChange}
                  />
                  <span>{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quantidade (só se Abastecimento) */}
          {form.tipo_acao === 'Abastecimento' && (
            <div className="form-grupo">
              <label htmlFor="quantidade_litros">
                Quantidade de Litros *
                <small>(ex: 50.5)</small>
              </label>
              <input
                type="number"
                id="quantidade_litros"
                name="quantidade_litros"
                value={form.quantidade_litros}
                onChange={handleChange}
                step="0.5"
                min="0"
                placeholder="Ex: 50.5"
                required={form.tipo_acao === 'Abastecimento'}
              />
            </div>
          )}

          {/* Data e Hora */}
          <div className="form-grupo">
            <label htmlFor="data_visita">Data e Hora *</label>
            <input
              type="datetime-local"
              id="data_visita"
              name="data_visita"
              value={form.data_visita}
              onChange={handleChange}
              required
            />
          </div>

          {/* Nome do Conferente */}
          <div className="form-grupo">
            <label htmlFor="nome_conferente">Nome do Conferente</label>
            <input
              type="text"
              id="nome_conferente"
              name="nome_conferente"
              value={form.nome_conferente}
              onChange={handleChange}
              placeholder="Quem acompanhou a visita (opcional)"
            />
          </div>

          {/* Observação */}
          <div className="form-grupo">
            <label htmlFor="observacao">Observações</label>
            <textarea
              id="observacao"
              name="observacao"
              value={form.observacao}
              onChange={handleChange}
              placeholder="Ex: Cliente em pé, estoque baixo, etc..."
              rows="3"
            />
          </div>

          {/* Bloco de Custo (só Manutenção/Instalação) */}
          {(form.tipo_acao === 'Manutenção' || form.tipo_acao === 'Instalação') && (
            <div className="bloco-custo">
              <label className="checkbox-custo">
                <input type="checkbox" checked={temCusto} onChange={(e) => setTemCusto(e.target.checked)} />
                <span>💰 Houve troca de peça ou custo adicional?</span>
              </label>
              {temCusto && (
                <div className="custo-campos">
                  <select name="custo_tipo" value={form.custo_tipo} onChange={handleChange}>
                    <option value="">Tipo de Custo *</option>
                    {tiposCusto.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="text"
                    name="custo_descricao"
                    value={form.custo_descricao}
                    onChange={handleChange}
                    placeholder="Descrição"
                  />
                  <input
                    type="number"
                    name="custo_valor"
                    value={form.custo_valor}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="Valor (R$) *"
                  />
                  <textarea
                    name="custo_observacoes"
                    value={form.custo_observacoes}
                    onChange={handleChange}
                    placeholder="Observações do custo"
                    rows="2"
                  />
                  <p className="aviso-custo">⚠️ Custo pendente de confirmação pelo operador interno.</p>
                </div>
              )}
            </div>
          )}

          {/* Mensagens */}
          {erro && <div className="alerta alerta-erro">❌ {erro}</div>}
          {sucesso && <div className="alerta alerta-sucesso">{sucesso}</div>}

          {/* Botão Submit */}
          <button type="submit" className="btn-submit" disabled={carregando}>
            {carregando ? '⏳ Salvando...' : '✅ Registrar Operação'}
          </button>
        </form>

        {/* Histórico */}
        <div className="registros-historico">
          <h2>📜 Histórico de Registros</h2>

          {/* Filtros */}
          <div className="filtro-historico">
            <select value={filtroMaquina} onChange={e => setFiltroMaquina(e.target.value)}>
              <option value="">Todas as máquinas</option>
              {maquinas.map(m => (
                <option key={m.numero_serie} value={m.numero_serie}>{m.numero_serie}</option>
              ))}
            </select>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos os Tipos</option>
              {tiposAcao.map(t => <option key={t} value={t}>{iconeTipo({ tipo_acao: t })} {t}</option>)}
              <option value="custo">💰 Custo</option>
            </select>
            <input
              type="date"
              value={filtroData}
              onChange={e => setFiltroData(e.target.value)}
            />
          </div>

          {/* Lista */}
          {carregandoHistorico ? (
            <p className="historico-mensagem">Carregando...</p>
          ) : historicoFiltrado.length === 0 ? (
            <div className="historico-vazio">
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="historico-lista">
              {historicoFiltrado.map(item => (
                <div key={`${item._tipo}-${item.id}`} className="historico-item">
                  <div className="item-header">
                    <strong>{iconeTipo(item)} {item.numero_serie}{item.nome_cliente ? ` — ${item.nome_cliente}` : ''}</strong>
                    <span className="item-tipo">
                      {item._tipo === 'custo' ? `${item.tipo} (Custo)` : item.tipo_acao}
                    </span>
                  </div>

                  <div className="item-info">
                    <span className="info-data">
                      📅 {formatarData(item._tipo === 'custo' ? item.data : item.data_visita)}
                      {item._tipo === 'registro' && item.tecnico_nome ? ` · 👤 Registrado por: ${item.tecnico_nome}` : ''}
                      {item._tipo === 'registro' && item.nome_conferente ? ` · Conferente: ${item.nome_conferente}` : ''}
                    </span>
                    {item._tipo === 'registro' && item.quantidade_litros && (
                      <span className="info-qtd">🔶 {item.quantidade_litros}L</span>
                    )}
                    {item._tipo === 'custo' && (
                      <span className={`info-custo ${item.status === 'Confirmado' ? 'confirmado' : 'pendente'}`}>
                        {moeda(item.valor)} · {item.status === 'Confirmado' ? '✅' : '⏳'}
                      </span>
                    )}
                  </div>

                  {item._tipo === 'registro' && item.observacao && (
                    <div className="item-obs">💬 {item.observacao}</div>
                  )}
                  {item._tipo === 'custo' && item.descricao && (
                    <div className="item-obs">{item.descricao}</div>
                  )}

                  {/* Ações — Custo pendente */}
                  {item._tipo === 'custo' && item.status === 'Pendente' && isMaster && (
                    <div className="item-acoes">
                      <button className="botao-acao confirmar" onClick={() => handleConfirmarCusto(item.id)}>✅ Confirmar</button>
                      <button className="botao-acao remover" onClick={() => handleDeletarCusto(item.id)}>🗑️ Remover</button>
                    </div>
                  )}

                  {/* Ações — Registro (master) */}
                  {item._tipo === 'registro' && isMaster && editandoId !== item.id && (
                    <div className="item-acoes">
                      <button className="botao-acao editar" onClick={() => handleAbrirEdicao(item)}>✏️ Editar</button>
                      <button className="botao-acao remover" onClick={() => handleDeletarRegistro(item.id)}>🗑️ Remover</button>
                    </div>
                  )}

                  {/* Formulário de edição */}
                  {item._tipo === 'registro' && editandoId === item.id && (
                    <div className="form-edicao">
                      {item.tipo_acao === 'Abastecimento' && (
                        <div className="form-grupo">
                          <label>Quantidade (L)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formEdicao.quantidade_litros}
                            onChange={(e) => setFormEdicao({ ...formEdicao, quantidade_litros: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="form-grupo">
                        <label>Nome do Conferente</label>
                        <input
                          type="text"
                          value={formEdicao.nome_conferente}
                          onChange={(e) => setFormEdicao({ ...formEdicao, nome_conferente: e.target.value })}
                        />
                      </div>
                      <div className="form-grupo">
                        <label>Observação</label>
                        <textarea
                          rows="2"
                          value={formEdicao.observacao}
                          onChange={(e) => setFormEdicao({ ...formEdicao, observacao: e.target.value })}
                        />
                      </div>
                      <div className="item-acoes">
                        <button className="botao-acao confirmar" onClick={() => handleSalvarEdicao(item.id)} disabled={salvandoEdicao}>
                          {salvandoEdicao ? 'Salvando...' : '✓ Salvar'}
                        </button>
                        <button className="botao-acao" onClick={() => setEditandoId(null)}>✕ Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrosOperacionais;
