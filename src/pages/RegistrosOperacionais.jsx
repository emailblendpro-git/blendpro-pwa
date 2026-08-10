// ================================================================
// BLENDPRO PWA — Página: Registros Operacionais
// ================================================================
// Formulário mobile-first para registrar operações (abastecimento, limpeza, etc)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './RegistrosOperacionais.css';

const RegistrosOperacionais = () => {
  const navigate = useNavigate();

  // Estado do formulário
  const [form, setForm] = useState({
    numero_serie: '',
    tipo_acao: 'Abastecimento',
    quantidade_litros: '',
    observacao: '',
    data_visita: new Date().toISOString().slice(0, 16)
  });

  // Estado de máquinas
  const [maquinas, setMaquinas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  // Estado de histórico
  const [historico, setHistorico] = useState([]);
  const [filtroMaquina, setFiltroMaquina] = useState('');

  // Tipos de ação disponíveis
  const tiposAcao = [
    'Abastecimento',
    'Limpeza',
    'Manutenção',
    'Inspeção',
    'Instalação',
    'Retirada'
  ];

  // Carregar máquinas ao montar
  useEffect(() => {
    carregarMaquinas();
  }, []);

  // Carregar histórico ao mudar filtro
  useEffect(() => {
    if (filtroMaquina) {
      carregarHistorico(filtroMaquina);
    }
  }, [filtroMaquina]);

  const carregarMaquinas = async () => {
    try {
      const response = await api.get('/maquinas');
      setMaquinas(Array.isArray(response.data) ? response.data : response.data.dados || []);
    } catch (err) {
      console.error('Erro ao carregar máquinas:', err);
      setErro('Erro ao carregar máquinas');
    }
  };

  const carregarHistorico = async (serial) => {
    try {
      const response = await api.get(`/registros-operacionais?numero_serie=${serial}`);
      setHistorico(Array.isArray(response.data) ? response.data : response.data.dados || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    // Validações
    if (!form.numero_serie) {
      setErro('Selecione uma máquina');
      return;
    }

    if (!form.tipo_acao) {
      setErro('Selecione um tipo de ação');
      return;
    }

    if (form.tipo_acao === 'Abastecimento' && !form.quantidade_litros) {
      setErro('Digite a quantidade de litros');
      return;
    }

    if (form.tipo_acao === 'Abastecimento' && parseFloat(form.quantidade_litros) <= 0) {
      setErro('Quantidade deve ser maior que 0');
      return;
    }

    setCarregando(true);

    try {
      const payload = {
        numero_serie: form.numero_serie,
        tipo_acao: form.tipo_acao,
        data_visita: form.data_visita,
        observacao: form.observacao || null,
        ...(form.tipo_acao === 'Abastecimento' && {
          quantidade_litros: parseFloat(form.quantidade_litros)
        })
      };

      await api.post('/registros-operacionais', payload);

      setSucesso(`✅ ${form.tipo_acao} registrado com sucesso!`);

      // Limpar formulário
      setForm({
        numero_serie: '',
        tipo_acao: 'Abastecimento',
        quantidade_litros: '',
        observacao: '',
        data_visita: new Date().toISOString().slice(0, 16)
      });

      // Recarregar histórico se tivesse filtro
      if (filtroMaquina) {
        setTimeout(() => carregarHistorico(filtroMaquina), 500);
      }
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
      // Se mudar tipo de ação, limpar quantidade se não for abastecimento
      ...(name === 'tipo_acao' &&
        value !== 'Abastecimento' && {
        quantidade_litros: ''
      })
    }));
  };

  const maquinaAtual = maquinas.find(m => m.numero_serie === form.numero_serie);

  return (
    <div className="registros-page">
      <div className="registros-container">
        {/* Header */}
        <div className="registros-header">
          <button className="botao-voltar" onClick={() => navigate('/dashboard')}>← Voltar</button>
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
          <h2>📜 Histórico Recente</h2>

          {/* Filtro */}
          <div className="filtro-historico">
            <select
              value={filtroMaquina}
              onChange={e => setFiltroMaquina(e.target.value)}
              placeholder="Filtrar por máquina..."
            >
              <option value="">Todas as máquinas</option>
              {maquinas.map(m => (
                <option key={m.numero_serie} value={m.numero_serie}>
                  {m.numero_serie}
                </option>
              ))}
            </select>
          </div>

          {/* Lista */}
          {historico.length === 0 ? (
            <div className="historico-vazio">
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="historico-lista">
              {historico.map(registro => (
                <div key={registro.id} className="historico-item">
                  <div className="item-header">
                    <strong>{registro.numero_serie}</strong>
                    <span className="item-tipo">{registro.tipo_acao}</span>
                  </div>

                  <div className="item-info">
                    <span className="info-data">
                      📅 {new Date(registro.data_visita).toLocaleString('pt-BR')}
                    </span>
                    {registro.quantidade_litros && (
                      <span className="info-qtd">
                        🔶 {registro.quantidade_litros}L
                      </span>
                    )}
                  </div>

                  {registro.observacao && (
                    <div className="item-obs">💬 {registro.observacao}</div>
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
