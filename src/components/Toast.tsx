import { useToast } from '../store/useToast';

/** Notification éphémère ancrée en bas d'écran. */
export function Toast() {
  const msg = useToast((s) => s.msg);
  return <div className={`toast${msg ? ' show' : ''}`}>{msg}</div>;
}
