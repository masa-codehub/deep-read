import React, { useState } from "react";
import { registerUser } from "../../../../infrastructure/services/api";
import { useNavigate } from "react-router-dom";
import { validateEmail, validatePassword } from "../../../../utils/validators";

interface SignUpFormErrors {
  email?: string | string[];
  password?: string | string[];
  passwordConfirm?: string | string[];
  agree?: string | string[];
  form?: string | string[];
}

interface FormValues {
  email: string;
  password: string;
  passwordConfirm: string;
  agree: boolean;
}

export const SignUpForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getCurrentValues = (): FormValues => ({ email, password, passwordConfirm, agree });

  // 共通バリデーション
  const validateForm = (values: FormValues): SignUpFormErrors => {
    const newErrors: SignUpFormErrors = {};
    if (!values.email) {
      newErrors.email = "メールアドレスは必須です";
    } else if (!validateEmail(values.email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }
    if (!values.password) {
      newErrors.password = "パスワードは必須です";
    } else if (!validatePassword(values.password)) {
      newErrors.password = "8文字以上の英字と数字を含むパスワードを入力してください";
    }
    if (!values.passwordConfirm) {
      newErrors.passwordConfirm = "確認用パスワードを入力してください";
    } else if (values.password !== values.passwordConfirm) {
      newErrors.passwordConfirm = "パスワードが一致しません";
    }
    if (!values.agree) {
      newErrors.agree = "利用規約とプライバシーポリシーへの同意が必要です";
    }
    return newErrors;
  };

  // メールアドレスonBlurバリデーション
  const handleEmailBlur = () => {
    setErrors(prev => ({ ...prev, email: validateForm(getCurrentValues()).email }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm(getCurrentValues());
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    setErrors({});
    const res = await registerUser(email, password);
    setLoading(false);
    if (res.success) {
      navigate("/library");
    } else {
      const apiErrors: SignUpFormErrors = {};
      if (res.errors) {
        if (res.errors.email) apiErrors.email = Array.isArray(res.errors.email) ? res.errors.email[0] : res.errors.email;
        if (res.errors.password) apiErrors.password = Array.isArray(res.errors.password) ? res.errors.password[0] : res.errors.password;
        if (res.errors.passwordConfirm) apiErrors.passwordConfirm = Array.isArray(res.errors.passwordConfirm) ? res.errors.passwordConfirm[0] : res.errors.passwordConfirm;
        if (res.errors.agree) apiErrors.agree = Array.isArray(res.errors.agree) ? res.errors.agree[0] : res.errors.agree;
      }
      if (res.message) apiErrors.form = res.message;
      if (!res.message && Object.keys(apiErrors).length === 0) apiErrors.form = "登録に失敗しました。";
      setErrors(prev => ({ ...prev, ...apiErrors }));
    }
  };

  return (
    <form className="space-y-6" aria-label="サインアップフォーム" onSubmit={handleSubmit}>
      {errors.form && (
        <div className="text-red-600 text-sm mb-2" role="alert">{errors.form}</div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={email}
          onChange={e => {
            const newEmail = e.target.value;
            setEmail(newEmail);
            setErrors(prev => ({ ...prev, email: validateForm({ ...getCurrentValues(), email: newEmail }).email }));
          }}
          onBlur={handleEmailBlur}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600" id="email-error" data-testid="email-error">{errors.email}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={password}
          onChange={e => {
            const newPassword = e.target.value;
            setPassword(newPassword);
            setErrors(prev => ({ ...prev, password: validateForm({ ...getCurrentValues(), password: newPassword }).password }));
          }}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600" id="password-error">{errors.password}</p>
        )}
      </div>
      <div>
        <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
          パスワード（確認用）
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={passwordConfirm}
          onChange={e => {
            const newPasswordConfirm = e.target.value;
            setPasswordConfirm(newPasswordConfirm);
            setErrors(prev => ({ ...prev, passwordConfirm: validateForm({ ...getCurrentValues(), passwordConfirm: newPasswordConfirm }).passwordConfirm }));
          }}
          aria-invalid={!!errors.passwordConfirm}
          aria-describedby={errors.passwordConfirm ? "passwordConfirm-error" : undefined}
        />
        {errors.passwordConfirm && (
          <p className="mt-1 text-sm text-red-600" id="passwordConfirm-error">{errors.passwordConfirm}</p>
        )}
      </div>
      <div className="flex items-center">
        <input
          id="agree"
          name="agree"
          type="checkbox"
          required
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          checked={agree}
          onChange={e => {
            const newAgree = e.target.checked;
            setAgree(newAgree);
            setErrors(prev => ({ ...prev, agree: validateForm({ ...getCurrentValues(), agree: newAgree }).agree }));
          }}
          aria-invalid={!!errors.agree}
          aria-describedby={errors.agree ? "agree-error" : undefined}
        />
        <label htmlFor="agree" className="ml-2 block text-sm text-gray-900">
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">利用規約</a>と
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">プライバシーポリシー</a>に同意します
        </label>
      </div>
      {errors.agree && (
        <p className="mt-1 text-sm text-red-600" id="agree-error">{errors.agree}</p>
      )}
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "登録中..." : "登録"}
      </button>
    </form>
  );
};
