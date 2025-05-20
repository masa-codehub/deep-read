// 法的同意関連の型定義

export interface LegalConsentStatus {
  userId: string;
  hasAgreedToLatestTerms: boolean;
  latestTermsVersion: string;
  userAgreedTermsVersion: string;
  hasAgreedToLatestPrivacyPolicy: boolean;
  latestPrivacyPolicyVersion: string;
  userAgreedPrivacyPolicyVersion: string;
}

export interface AgreeToTermsRequest {
  userId: string;
  termsVersion: string;
  privacyPolicyVersion: string;
}
