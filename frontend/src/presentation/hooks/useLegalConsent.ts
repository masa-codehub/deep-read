import { useCallback, useEffect, useState } from 'react';
import type { LegalConsentStatus } from '../../types/legal';
import { getLegalConsentStatus, agreeToLegalTerms } from '../../infrastructure/services/api';

// 最新の規約・ポリシーのURL（本来はAPIや環境変数から取得するのが望ましい）
const LATEST_TERMS_URL = '/terms';
const LATEST_PRIVACY_POLICY_URL = '/privacy-policy';

export interface UseLegalConsentReturn {
  consentStatus: LegalConsentStatus | null;
  isLoading: boolean;
  error: string | null;
  isAgreementRequired: boolean;
  showConsentModal: boolean;
  openConsentModal: () => void;
  closeConsentModal: () => void;
  handleAgree: () => Promise<void>;
  latestTermsUrl: string;
  latestPrivacyPolicyUrl: string;
}

export function useLegalConsent(): UseLegalConsentReturn {
  const [consentStatus, setConsentStatus] = useState<LegalConsentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isAgreementRequired, setIsAgreementRequired] = useState(false);

  // 同意が必要かどうか
  useEffect(() => {
    if (isLoading || !consentStatus) {
      setIsAgreementRequired(false);
    } else {
      setIsAgreementRequired(
        !consentStatus.hasAgreedToLatestTerms || !consentStatus.hasAgreedToLatestPrivacyPolicy
      );
    }
  }, [isLoading, consentStatus]);

  // 同意状況取得
  const fetchConsentStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await getLegalConsentStatus();
      setConsentStatus(status);
    } catch (e: any) {
      // setConsentStatus(null); // エラー時もconsentStatusは維持
      setError(e?.message || '同意状況の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsentStatus();
  }, [fetchConsentStatus]);

  // consentStatusの変更時にisAgreementRequired/showConsentModalを明示的に更新
  useEffect(() => {
    if (!isLoading && consentStatus) {
      const required = !consentStatus.hasAgreedToLatestTerms || !consentStatus.hasAgreedToLatestPrivacyPolicy;
      setShowConsentModal(required);
    }
  }, [isLoading, consentStatus]);

  // 同意済みになったらモーダルを閉じる（冗長だがテスト安定化のため明示的に）
  useEffect(() => {
    if (!isLoading && consentStatus && consentStatus.hasAgreedToLatestTerms && consentStatus.hasAgreedToLatestPrivacyPolicy) {
      setShowConsentModal(false);
    }
  }, [isLoading, consentStatus]);

  const openConsentModal = useCallback(() => setShowConsentModal(true), []);
  const closeConsentModal = useCallback(() => setShowConsentModal(false), []);

  // 同意アクション
  const handleAgree = useCallback(async () => {
    if (!consentStatus) return;
    setIsLoading(true);
    setError(null);
    try {
      await agreeToLegalTerms({
        userId: consentStatus.userId,
        termsVersion: consentStatus.latestTermsVersion,
        privacyPolicyVersion: consentStatus.latestPrivacyPolicyVersion,
      });
      await fetchConsentStatus();
    } catch (e: any) {
      setError(e?.message || '同意処理に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [consentStatus, fetchConsentStatus]);

  return {
    consentStatus,
    isLoading,
    error,
    isAgreementRequired,
    showConsentModal,
    openConsentModal,
    closeConsentModal,
    handleAgree,
    latestTermsUrl: LATEST_TERMS_URL,
    latestPrivacyPolicyUrl: LATEST_PRIVACY_POLICY_URL,
  };
}
