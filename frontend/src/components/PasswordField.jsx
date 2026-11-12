import { useState } from 'react';
import { EyeIcon } from './Icons';
export default function PasswordField({ label, name, autoComplete = 'new-password', minLength, disabled = false }) {
  const [visible, setVisible] = useState(false);
  return <label>{label}<span className="password-input"><input name={name} type={visible ? 'text' : 'password'} required minLength={minLength} maxLength={72} autoComplete={autoComplete} disabled={disabled} /><button type="button" aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}><EyeIcon hidden={visible} /></button></span></label>;
}
