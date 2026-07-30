import { ProcessProvider } from '../contexts/ProcessContext';
import './globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ProcessProvider enabled={Boolean(pageProps.user)}>
      <Component {...pageProps} />
    </ProcessProvider>
  );
}
