import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import SettingsForm from './SettingsForm';
import * as api from '../../../../infrastructure/services/api';

// MSWサーバーセットアップ
const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SettingsForm', () => {
  const defaultSettings = {
    apiKey: 'sk-test-1234abcd5678efgh',
    fileUploadLimitMB: 50,
  };

  beforeEach(() => {
    vi.spyOn(api, 'getUserSettings').mockResolvedValue(defaultSettings);
    vi.spyOn(api, 'updateUserSettings').mockResolvedValue({
      success: true,
      message: '設定を保存しました',
      updatedSettings: defaultSettings,
    });
  });

  it('初期値がフォームに表示され、APIキーはマスキングされる', async () => {
    render(<SettingsForm />);
    expect(await screen.findByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByLabelText(/APIキー/)).toHaveValue('********efgh');
  });

  it('ファイル上限に無効な値を入力するとエラーが表示される', async () => {
    render(<SettingsForm />);
    const input = await screen.findByLabelText(/ファイルアップロード上限/);
    fireEvent.change(input, { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: /保存/ }));
    await waitFor(() => {
      expect(screen.getByTestId('file-upload-limit-error')).toHaveTextContent('1〜1000の数値で入力してください。');
    });
  });

  it('有効な値で保存するとAPIが呼ばれ、成功メッセージが表示される', async () => {
    render(<SettingsForm />);
    const input = await screen.findByLabelText(/ファイルアップロード上限/);
    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /保存/ }));
    expect(await screen.findByText(/設定を保存しました/)).toBeInTheDocument();
    expect(api.updateUserSettings).toHaveBeenCalledWith({ fileUploadLimitMB: 100 });
  });

  it('APIキー編集欄に切り替え、新しいAPIキーを入力して保存できる', async () => {
    render(<SettingsForm />);
    fireEvent.click(await screen.findByRole('button', { name: /APIキーを編集/ }));
    const apiKeyInput = screen.getByLabelText(/新しいAPIキー/);
    fireEvent.change(apiKeyInput, { target: { value: 'sk-new-9999' } });
    fireEvent.click(screen.getByRole('button', { name: /保存/ }));
    await waitFor(() => expect(api.updateUserSettings).toHaveBeenCalledWith({ apiKey: 'sk-new-9999', fileUploadLimitMB: 50 }));
  });

  it('APIエラー時はエラーメッセージが表示される', async () => {
    (api.updateUserSettings as any).mockResolvedValueOnce({
      success: false,
      message: 'サーバーエラー',
      errors: { fileUploadLimitMB: '不正な値です' },
    });
    render(<SettingsForm />);
    const input = await screen.findByLabelText(/ファイルアップロード上限/);
    fireEvent.change(input, { target: { value: '100' } }); // バリデーションOK値
    fireEvent.click(screen.getByRole('button', { name: /保存/ }));
    await waitFor(() => {
      expect(screen.getByTestId('form-error-msg')).toHaveTextContent('サーバーエラー');
    });
  });
});
