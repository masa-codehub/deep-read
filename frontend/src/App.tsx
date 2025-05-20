import './presentation/styles/App.css';
import LibraryPage from './presentation/pages/LibraryPage';
import SettingsPage from './presentation/pages/SettingsPage'; // issue#84_01 から
import { useLegalConsent } from './presentation/hooks/useLegalConsent'; // main から
import ConsentModal from './presentation/components/features/Legal/ConsentModal'; // main から

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
  } = useLegalConsent(); // main の機能

  return (
    <div className="app" style={{ position: 'relative' }}> {/* main のスタイルを適用 */}
      <LibraryPage /> {/* main で表示されていたページ */}
      {/* <SettingsPage /> */} {/* issue#84_01 で表示されていたページ (ルーティングで切り替える想定) */}
      
      {/* main の法的同意モーダル機能 */}
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