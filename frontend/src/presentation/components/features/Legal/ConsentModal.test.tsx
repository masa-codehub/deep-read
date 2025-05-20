import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConsentModal from './ConsentModal';

describe('ConsentModal', () => {
  const termsUrl = '/terms';
  const privacyPolicyUrl = '/privacy';
  const baseProps = {
    show: true,
    onClose: vi.fn(),
    onAgree: vi.fn().mockResolvedValue(undefined),
    termsUrl,
    privacyPolicyUrl,
    isLoading: false,
    error: null,
  };

  it('モーダルが表示される', () => {
    render(<ConsentModal {...baseProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('ご同意のお願い')).toBeInTheDocument();
  });

  it('規約リンク・同意チェックボックス・同意ボタンが表示される', () => {
    render(<ConsentModal {...baseProps} />);
    expect(screen.getAllByText('利用規約')[0]).toHaveAttribute('href', termsUrl);
    expect(screen.getAllByText('プライバシーポリシー')[0]).toHaveAttribute('href', privacyPolicyUrl);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /同意して続行/ })).toBeDisabled();
  });

  it('チェックボックスがオンで同意ボタンが有効になる', () => {
    render(<ConsentModal {...baseProps} />);
    const checkbox = screen.getByRole('checkbox');
    const agreeBtn = screen.getByRole('button', { name: /同意して続行/ });
    fireEvent.click(checkbox);
    expect(agreeBtn).toBeEnabled();
  });

  it('同意ボタンクリックでonAgreeが呼ばれる', async () => {
    const onAgree = vi.fn().mockResolvedValue(undefined);
    render(<ConsentModal {...baseProps} onAgree={onAgree} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    const agreeBtn = screen.getByRole('button', { name: /同意して続行/ });
    fireEvent.click(agreeBtn);
    await waitFor(() => expect(onAgree).toHaveBeenCalled());
  });

  it('閉じるボタンクリックでonCloseが呼ばれる', () => {
    render(<ConsentModal {...baseProps} />);
    const closeBtn = screen.getByRole('button', { name: /閉じる/ });
    fireEvent.click(closeBtn);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('エラーが表示される', () => {
    render(<ConsentModal {...baseProps} error="エラーです" />);
    expect(screen.getByText('エラーです')).toBeInTheDocument();
  });

  it('show=falseで何も表示されない', () => {
    render(<ConsentModal {...baseProps} show={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
