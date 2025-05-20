import { render, screen, fireEvent } from '@testing-library/react';
import TermsAgreementCheckbox from './TermsAgreementCheckbox';

describe('TermsAgreementCheckbox', () => {
  const termsUrl = '/terms';
  const privacyPolicyUrl = '/privacy';

  it('ラベルとリンクが正しく表示される', () => {
    render(
      <TermsAgreementCheckbox
        checked={false}
        onChange={() => {}}
        termsUrl={termsUrl}
        privacyPolicyUrl={privacyPolicyUrl}
      />
    );
    expect(screen.getByText('利用規約')).toHaveAttribute('href', termsUrl);
    expect(screen.getByText('プライバシーポリシー')).toHaveAttribute('href', privacyPolicyUrl);
    expect(screen.getByText(/同意します/)).toBeInTheDocument();
  });

  it('チェック状態がpropsと同期している', () => {
    const { rerender } = render(
      <TermsAgreementCheckbox
        checked={false}
        onChange={() => {}}
        termsUrl={termsUrl}
        privacyPolicyUrl={privacyPolicyUrl}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    rerender(
      <TermsAgreementCheckbox
        checked={true}
        onChange={() => {}}
        termsUrl={termsUrl}
        privacyPolicyUrl={privacyPolicyUrl}
      />
    );
    expect(checkbox).toBeChecked();
  });

  it('onChangeが正しく呼ばれる', () => {
    const handleChange = vi.fn();
    render(
      <TermsAgreementCheckbox
        checked={false}
        onChange={handleChange}
        termsUrl={termsUrl}
        privacyPolicyUrl={privacyPolicyUrl}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledWith(true);
  });
});
