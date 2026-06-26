import { ToastProvider } from './components/ui/Toast.jsx';
import { AppShell } from './app/AppShell.jsx';

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}
