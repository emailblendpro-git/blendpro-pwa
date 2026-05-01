import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Maquinas from './pages/Maquinas';
import Clientes from './pages/Clientes';
import Usuarios from './pages/Usuarios';
import Manutencoes from './pages/Manutencoes';
import Chamados from './pages/Chamados';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import Vendedores from './pages/Vendedores';
import Abastecer from './pages/Abastecer';
import { useUsuario } from './hooks/useUsuario';

function RotaProtegida({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    const destino = window.location.pathname;
    return <Navigate to={`/?redirect=${encodeURIComponent(destino)}`} />;
  }
  return children;
}

function RotaRestrita({ children, perfisPermitidos }) {
  const { perfil } = useUsuario();
  if (!perfil) return <Navigate to="/" />;
  if (!perfisPermitidos.includes(perfil)) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={
          <RotaProtegida><Dashboard /></RotaProtegida>
        } />

        <Route path="/maquinas" element={
          <RotaProtegida><Maquinas /></RotaProtegida>
        } />

        <Route path="/clientes" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Clientes />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/usuarios" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Usuarios />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/manutencoes" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno', 'operador_externo']}>
              <Manutencoes />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/chamados" element={
          <RotaProtegida><Chamados /></RotaProtegida>
        } />

        <Route path="/produtos" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Produtos />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/relatorios" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Relatorios />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/vendedores" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Vendedores />
            </RotaRestrita>
          </RotaProtegida>
        } />

      <Route path="/abastecer/:serial" element={
          <RotaProtegida><Abastecer /></RotaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  );
}