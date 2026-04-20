import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const resposta = await api.post('/auth/login', { email, senha });
      localStorage.setItem('token', resposta.data.token);
      navigate('/dashboard');
    } catch (err) {
      setErro('Email ou senha incorretos.');
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <p style={styles.subtitulo}>Plataforma de Gestão</p>
        <form onSubmit={handleLogin}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div style={styles.senhaContainer}>
            <input
              style={styles.inputSenha}
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button"
              style={styles.botaoOlho}
              onClick={() => setMostrarSenha(!mostrarSenha)}
            >
              {mostrarSenha ? '🙈' : '👁️'}
            </button>
          </div>
          {erro && <p style={styles.erro}>{erro}</p>}
          <button style={styles.botao} type="submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#0f172a',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '40px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '380px',
  },
  titulo: { color: '#38bdf8', textAlign: 'center', marginBottom: '4px' },
  subtitulo: { color: '#94a3b8', textAlign: 'center', marginBottom: '24px' },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  senhaContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  inputSenha: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
  },
  botaoOlho: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    fontSize: '18px',
  },
  botao: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  erro: { color: '#f87171', marginBottom: '12px', textAlign: 'center' },
};