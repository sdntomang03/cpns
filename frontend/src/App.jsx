import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from './components/common/NotificationProvider';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </NotificationProvider>
  );
}
