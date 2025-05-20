import './presentation/styles/App.css';
import LibraryPage from './presentation/pages/LibraryPage';
import { useLegalConsent } from './presentation/hooks/useLegalConsent';
import ConsentModal from './presentation/components/features/Legal/ConsentModal';

function App() {
  const {
    showConsentModal,
    closeConsentModal,
    handleAgree,
    isLoading,
    error,
    latestTermsUrl,
    latestPrivacyPolicyUrl,
    isAgreementRequired,
  } = useLegalConsent();

  return (
    <div className="app" style={{ position: 'relative' }}>
      <LibraryPage />
      <ConsentModal
        show={showConsentModal}
        onClose={closeConsentModal}
        onAgree={handleAgree}
        termsUrl={latestTermsUrl}
        privacyPolicyUrl={latestPrivacyPolicyUrl}
        isLoading={isLoading}
        error={error}
      />
      {/* 同意が必要な場合は全体をオーバーレイで覆い操作不可に */}
      {isAgreementRequired && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(255,255,255,0.6)',
            zIndex: 998, // モーダルより下
            pointerEvents: 'auto',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default App;
