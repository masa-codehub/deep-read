import React from 'react';

interface TermsAgreementCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  termsUrl: string;
  privacyPolicyUrl: string;
  disabled?: boolean;
}

/**
 * 利用規約・プライバシーポリシー同意チェックボックス
 */
const TermsAgreementCheckbox: React.FC<TermsAgreementCheckboxProps> = ({
  checked,
  onChange,
  termsUrl,
  privacyPolicyUrl,
  disabled,
}) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        aria-checked={checked}
        aria-label="利用規約およびプライバシーポリシーに同意"
      />
      <span>
        <a href={termsUrl} target="_blank" rel="noopener noreferrer">利用規約</a>
        および
        <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>
        に同意します
      </span>
    </label>
  );
};

export default TermsAgreementCheckbox;
