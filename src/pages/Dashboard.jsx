import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

export default function Dashboard() {
  const navigate = useNavigate();
  const [maquinas, setMaquinas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pendentesCount, setPendentesCount] = useState(0);
  const [semComunicacao, setSemComunicacao] = useState(0);
  const { usuario, podeGerenciar, podeManutencao, isCliente } = useUsuario();

  useEffect(() => {
    api.get('/maquinas').then((res) => {
      setMaquinas(res.data);
      setSemComunicacao(res.data.filter(m => m.status === 'Ativa' && m.sem_comunicacao).length);
    }).catch(() => setMaquinas([]));
    if (podeGerenciar) {
      api.get('/clientes').then((res) => setClientes(res.data)).catch(() => setClientes([]));
      api.get('/usuarios').then((res) => setUsuarios(res.data)).catch(() => setUsuarios([]));
      const agora = new Date();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const ano = String(agora.getFullYear());
      api.get(`/manutencoes/pendentes?mes=${mes}&ano=${ano}`)
        .then((res) => setPendentesCount(res.data.registros?.length || 0))
        .catch(() => setPendentesCount(0));
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={styles.nomeUsuario}>👤 {usuario?.nome || 'Usuário'}</span>
          <button style={styles.botaoSair} onClick={handleLogout}>Sair</button>
        </div>
      </div>
      <div style={styles.conteudo}>
        <h2 style={styles.bemVindo}>Dashboard</h2>
        <div style={styles.cards}>

          {/* Máquinas — todos veem */}
          <div style={styles.card} onClick={() => navigate('/maquinas')}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <p style={styles.cardTitulo}>Total de Máquinas</p>
              {semComunicacao > 0 && (
                <span style={{ ...styles.badge, backgroundColor: '#ef4444' }}>{semComunicacao}</span>
              )}
            </div>
            <p style={styles.cardValor}>{maquinas.length}</p>
            <p style={styles.cardLink}>Ver todas →</p>
          </div>

          {/* Clientes — apenas Master e Operador Interno */}
          {podeGerenciar && (
            <div style={styles.card} onClick={() => navigate('/clientes')}>
              <p style={styles.cardTitulo}>Total de Clientes</p>
              <p style={styles.cardValor}>{clientes.length}</p>
              <p style={styles.cardLink}>Ver todos →</p>
            </div>
          )}

          {/* Usuários — apenas Master e Operador Interno */}
          {podeGerenciar && (
            <div style={styles.card} onClick={() => navigate('/usuarios')}>
              <p style={styles.cardTitulo}>Total de Usuários</p>
              <p style={styles.cardValor}>{usuarios.length}</p>
              <p style={styles.cardLink}>Ver todos →</p>
            </div>
          )}

          {/* Registros — todos exceto Cliente */}
          {podeManutencao && (
            <div style={styles.card} onClick={() => navigate('/manutencoes')}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <p style={styles.cardTitulo}>Registros</p>
                {podeGerenciar && pendentesCount > 0 && (
                  <span style={styles.badge}>{pendentesCount}</span>
                )}
              </div>
              <p style={styles.cardValor}>📋</p>
              <p style={styles.cardLink}>Ver registros →</p>
            </div>
          )}

          {/* Chamados — todos veem */}
          <div style={styles.card} onClick={() => navigate('/chamados')}>
            <p style={styles.cardTitulo}>Chamados</p>
            <p style={styles.cardValor}>🎫</p>
            <p style={styles.cardLink}>Ver chamados →</p>
          </div>

          {/* Produtos — apenas Master e Operador Interno */}
          {podeGerenciar && (
            <div style={styles.card} onClick={() => navigate('/produtos')}>
              <p style={styles.cardTitulo}>Produtos</p>
              <p style={styles.cardValor}>🧴</p>
              <p style={styles.cardLink}>Ver produtos →</p>
            </div>
          )}

          {/* Relatórios — apenas Master e Operador Interno */}
          {podeGerenciar && (
            <div style={styles.card} onClick={() => navigate('/relatorios')}>
              <p style={styles.cardTitulo}>Relatórios</p>
              <p style={styles.cardValor}>📊</p>
              <p style={styles.cardLink}>Ver relatórios →</p>
            </div>
          )}

          {/* Vendedores — apenas Master e Operador Interno */}
          {podeGerenciar && (
            <div style={styles.card} onClick={() => navigate('/vendedores')}>
              <p style={styles.cardTitulo}>Vendedores</p>
              <p style={styles.cardValor}>🤝</p>
              <p style={styles.cardLink}>Ver vendedores →</p>
            </div>
          )}

          {/* Prestadores — apenas Master e Operador Interno */}
          {podeGerenciar && (
            <div style={styles.card} onClick={() => navigate('/prestadores')}>
              <p style={styles.cardTitulo}>Prestadores</p>
              <p style={styles.cardValor}>👷</p>
              <p style={styles.cardLink}>Ver prestadores →</p>
            </div>
          )}

          {/* Agente de IA — todos os perfis */}
          <div style={{ ...styles.card, borderLeft: '3px solid #38bdf8' }} onClick={() => navigate('/agente')}>
            <p style={styles.cardTitulo}>Assistente IA</p>
            <p style={styles.cardValor}>🤖</p>
            <p style={styles.cardLink}>Perguntar ao agente →</p>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0f172a', minHeight: '100vh', color: '#f1f5f9' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  titulo: { color: '#38bdf8', margin: 0 },
  nomeUsuario: { color: '#94a3b8', fontSize: '14px' },
  botaoSair: { padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  conteudo: { padding: '40px 32px' },
  bemVindo: { color: '#f1f5f9', marginBottom: '24px' },
  cards: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  card: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', minWidth: '180px', cursor: 'pointer' },
  cardTitulo: { color: '#94a3b8', margin: '0 0 8px 0', fontSize: '14px' },
  cardValor: { color: '#38bdf8', margin: 0, fontSize: '36px', fontWeight: 'bold' },
  cardLink: { color: '#38bdf8', margin: '8px 0 0 0', fontSize: '13px' },
  badge: { position: 'absolute', top: '-8px', right: '-16px', backgroundColor: '#f59e0b', color: '#fff', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', padding: '2px 7px', minWidth: '18px', textAlign: 'center' },
};