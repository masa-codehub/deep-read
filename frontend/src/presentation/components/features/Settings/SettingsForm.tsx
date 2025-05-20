import React, { useEffect, useState } from 'react';
import { getUserSettings, updateUserSettings } from '../../../../infrastructure/services/api';
import type { UserSettingsData, UserSettingsInputData } from '../../../../types/settings';

const maskApiKey = (apiKey: string) => '********' + apiKey.slice(-4);

const SettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [form, setForm] = useState<UserSettingsInputData>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [editApiKey, setEditApiKey] = useState(false);

  useEffect(() => {
    getUserSettings().then(data => {
      setSettings(data);
      setForm({ fileUploadLimitMB: data.fileUploadLimitMB });
    }).catch(() => setFormError('設定の取得に失敗しました'));
  }, []);

  // バリデーション関数
  const validate = (input: UserSettingsInputData): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (input.fileUploadLimitMB === undefined || input.fileUploadLimitMB === null) {
      newErrors.fileUploadLimitMB = 'ファイルアップロード上限を入力してください。';
    } else if (Number.isNaN(input.fileUploadLimitMB) || input.fileUploadLimitMB < 1 || input.fileUploadLimitMB > 1000) {
      newErrors.fileUploadLimitMB = '1〜1000の数値で入力してください。';
    }
    if (editApiKey && (input.apiKey === undefined || input.apiKey.trim().length === 0)) {
      newErrors.apiKey = 'APIキーを入力してください。';
    }
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? (value === '' ? undefined : Number(value)) : value;
    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    // 入力中は該当フィールドのエラーとフォーム全体のエラーをクリア
    if (formError) {
      setFormError('');
    }
    // 入力値で即時バリデーション
    const nextForm = { ...form, [name]: newValue };
    const validationErrors = validate(nextForm);
    setFieldErrors(validationErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setFormError('');
    setFieldErrors({});

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormError('入力内容に誤りがあります。');
      await new Promise(r => setTimeout(r, 0)); // レンダリング反映を待つ
      return;
    }

    setLoading(true);
    const payload: UserSettingsInputData = { ...form };
    if (!editApiKey) {
      delete payload.apiKey;
    }
    const res = await updateUserSettings(payload);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || '設定を保存しました');
      if (res.updatedSettings) {
        setSettings(res.updatedSettings);
        setForm({ fileUploadLimitMB: res.updatedSettings.fileUploadLimitMB });
      }
      setEditApiKey(false);
      setFieldErrors({});
      setFormError('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setFormError(res.message || '設定の保存に失敗しました。');
      if (res.errors) {
        setFieldErrors(res.errors as Record<string, string>);
      }
    }
  };

  if (!settings && !formError) return <div>読み込み中...</div>;
  if (formError && !settings) {
    return <div className="text-red-600" data-testid="form-error-msg">{formError}</div>;
  }

  return (
    <form className="max-w-md mx-auto p-6 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">ユーザー設定</h2>
      {formError && <div className="mb-2 text-red-600" data-testid="form-error-msg">{formError}</div>}
      {successMsg && <div className="mb-2 text-green-600" data-testid="success-msg">{successMsg}</div>}
      <div className="mb-4">
        <label className="block font-semibold mb-1" htmlFor="apiKeyDisplay">APIキー</label>
        {!editApiKey ? (
          <div className="flex items-center gap-2">
            <input
              id="apiKeyDisplay"
              name="apiKeyDisplay"
              type="text"
              value={settings ? maskApiKey(settings.apiKey) : ''}
              readOnly
              className="w-full border rounded px-2 py-1 bg-gray-100"
              aria-label="APIキー"
            />
            <button type="button" className="text-blue-600 underline" onClick={() => setEditApiKey(true)}>
              APIキーを編集
            </button>
          </div>
        ) : (
          <input
            id="apiKey"
            name="apiKey"
            type="password"
            value={form.apiKey ?? ''}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            aria-label="新しいAPIキー"
            placeholder="新しいAPIキーを入力"
          />
        )}
        <div className="text-red-600 text-sm min-h-[1.5em]" data-testid="api-key-error">
          {fieldErrors.apiKey || ''}
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1" htmlFor="fileUploadLimitMB">ファイルアップロード上限 (MB)</label>
        <input
          id="fileUploadLimitMB"
          name="fileUploadLimitMB"
          type="number"
          min={1}
          max={1000}
          value={form.fileUploadLimitMB ?? ''}
          onChange={handleChange}
          className={`w-full border rounded px-2 py-1${fieldErrors.fileUploadLimitMB ? ' border-red-500' : ''}`}
          aria-label="ファイルアップロード上限"
          aria-invalid={!!fieldErrors.fileUploadLimitMB}
          aria-describedby="file-upload-limit-error"
        />
        <div className="text-red-600 text-sm min-h-[1.5em]" data-testid="file-upload-limit-error">
          {fieldErrors.fileUploadLimitMB || ''}
        </div>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? '保存中...' : '保存'}
      </button>
    </form>
  );
};

export default SettingsForm;
