import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function BecomeSellerModal({ onClose, onSuccess }) {
  const { becomeSeller } = useAuth();
  const dialogRef = useRef(null);
  const [shopName, setShopName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedShopName = shopName.trim();
    const trimmedBankName = bankName.trim();
    const trimmedBankAccountHolder = bankAccountHolder.trim();
    const trimmedBankAccount = bankAccount.trim();
    const trimmedBankBranch = bankBranch.trim();

    if (!trimmedShopName) {
      setError('Vui lòng nhập tên gian hàng.');
      return;
    }
    if (trimmedShopName.length > 100) {
      setError('Tên gian hàng tối đa 100 ký tự.');
      return;
    }
    if (!trimmedBankName) {
      setError('Vui lòng nhập tên ngân hàng.');
      return;
    }
    if (!trimmedBankAccountHolder) {
      setError('Vui lòng nhập tên chủ tài khoản.');
      return;
    }
    if (!/^[0-9]{6,50}$/.test(trimmedBankAccount)) {
      setError('Số tài khoản ngân hàng phải gồm 6-50 chữ số.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await becomeSeller({
        shopName: trimmedShopName,
        bankName: trimmedBankName,
        bankAccountHolder: trimmedBankAccountHolder,
        bankAccount: trimmedBankAccount,
        bankBranch: trimmedBankBranch || null
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Không thể mở gian hàng.');
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && !busy) onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px'
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="become-seller-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%', maxWidth: '480px', backgroundColor: '#ffffff',
          borderRadius: '16px', padding: '28px', boxSizing: 'border-box',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 id="become-seller-title" style={{ margin: '0 0 6px', fontSize: '20px', color: '#0f172a' }}>
              Mở gian hàng bán hàng
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              Nhập thông tin để thêm quyền Người bán vào tài khoản hiện tại.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            disabled={busy}
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: '#64748b', fontSize: '22px', padding: '2px 6px' }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: '16px', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid #fecaca', backgroundColor: '#fef2f2',
              color: '#dc2626', fontSize: '13px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
          <label>
            Tên gian hàng *
            <input
              name="shopName"
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              required
              maxLength={100}
              autoFocus
              placeholder="Ví dụ: Phụ Kiện Công Nghệ Shop"
            />
          </label>
          <label>
            Tên ngân hàng *
            <input
              name="bankName"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
              required
              maxLength={100}
              placeholder="Ví dụ: Techcombank"
            />
          </label>
          <label>
            Tên chủ tài khoản *
            <input
              name="bankAccountHolder"
              value={bankAccountHolder}
              onChange={(event) => setBankAccountHolder(event.target.value)}
              required
              maxLength={100}
              placeholder="Ví dụ: NGUYEN VAN A"
            />
          </label>
          <label>
            Số tài khoản ngân hàng (ít nhất 6 số)*
            <input
              name="bankAccount"
              value={bankAccount}
              onChange={(event) => setBankAccount(event.target.value)}
              required
              inputMode="numeric"
              pattern="[0-9]{6,50}"
              maxLength={50}
              placeholder="Ví dụ: 19036789123456"
            />
          </label>
          <label>
            Chi nhánh ngân hàng
            <input
              name="bankBranch"
              value={bankBranch}
              onChange={(event) => setBankBranch(event.target.value)}
              maxLength={100}
              placeholder="Ví dụ: Chi nhánh TP. Thủ Đức"
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
            <button type="button" disabled={busy} onClick={onClose}>Hủy</button>
            <button
              type="submit"
              disabled={busy}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', minWidth: '150px' }}
            >
              {busy ? 'Đang xử lý...' : 'Xác nhận mở gian hàng'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
