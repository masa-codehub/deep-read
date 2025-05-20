import React, { useState } from 'react';
import TermsAgreementCheckbox from '../../common/TermsAgreementCheckbox';

interface ConsentModalProps {
  show: boolean;
  onClose: () => void;
  onAgree: () => Promise<void>;
  termsUrl: string;
  privacyPolicyUrl: string;
  isLoading?: boolean;
  error?: string | null;
}

const modalStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 32,
  minWidth: 320,
  maxWidth: 400,
  boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const ConsentModal: React.FC<ConsentModalProps> = ({
  show,
  onClose,
  onAgree,
  termsUrl,
  privacyPolicyUrl,
  isLoading,
  error,
}) => {
  const [checked, setChecked] = useState(false);
  const handleAgree = async () => {
    await onAgree();
    setChecked(false);
  };
  if (!show) return null;
  return (
    <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="legal-consent-title">
      <div style={dialogStyle}>
        <h2 id="legal-consent-title" style={{ margin: 0, fontSize: 20 }}>ご同意のお願い</h2>
        <p style={{ fontSize: 14 }}>
          サービスをご利用いただくには、<a href={termsUrl} target="_blank" rel="noopener noreferrer">利用規約</a>および
          <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>への同意が必要です。
        </p>
        <TermsAgreementCheckbox
          checked={checked}
          onChange={setChecked}
          termsUrl={termsUrl}
          privacyPolicyUrl={privacyPolicyUrl}
        />
        {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={handleAgree}
            disabled={!checked || isLoading}
            style={{ flex: 1, padding: '8px 0', fontWeight: 'bold' }}
          >
            {isLoading ? '同意中...' : '同意して続行'}
          </button>
          <button onClick={onClose} disabled={isLoading} style={{ flex: 1, padding: '8px 0' }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
