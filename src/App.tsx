import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import PharmacyLogin from './pages/PharmacyLogin';
import ClientLogin from './pages/ClientLogin';
import PharmacyDashboard from './pages/PharmacyDashboard';
import ClientDashboard from './pages/ClientDashboard';
import RecuperarSenha from './pages/RecuperarSenha';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loginMode, setLoginMode] = useState<'pharmacy' | 'client'>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === '/farmacia' ? 'pharmacy' : 'client';
    }
    return 'client';
  });
  const { isAuthenticated, userRole, checkAuth } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, [checkAuth]);

  if (typeof window !== 'undefined' && window.location.pathname === '/recuperarsenha') {
    return <RecuperarSenha />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-[#0F3C4C] text-lg">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (loginMode === 'pharmacy') {
      return (
        <PharmacyLogin
          onLogin={() => window.location.reload()}
          onSwitchToClient={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            } else {
              setLoginMode('client');
            }
          }}
        />
      );
    } else {
      return (
        <ClientLogin
          onLogin={() => window.location.reload()}
          onSwitchToPharmacy={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/farmacia';
            } else {
              setLoginMode('pharmacy');
            }
          }}
        />
      );
    }
  }

  if (userRole === 'pharmacy') {
    return <PharmacyDashboard onLogout={() => window.location.reload()} />;
  } else {
    return <ClientDashboard onLogout={() => window.location.reload()} />;
  }
}

export default App;
