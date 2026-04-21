import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Maquinas from './pages/Maquinas';
import Clientes from './pages/Clientes';
import Usuarios from './pages/Usuarios';
import Manutencoes from './pages/Manutencoes';

function RotaProtegida({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
        <Route path="/maquinas" element={<RotaProtegida><Maquinas /></RotaProtegida>} />
        <Route path="/clientes" element={<RotaProtegida><Clientes /></RotaProtegida>} />
        <Route path="/usuarios" element={<RotaProtegida><Usuarios /></RotaProtegida>} />
        <Route path="/manutencoes" element={<RotaProtegida><Manutencoes /></RotaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}