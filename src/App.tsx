import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import DynamicSEO from '@/components/DynamicSEO';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <DynamicSEO />
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
