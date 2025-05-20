import React, { useState } from "react";
import { loginUser } from "../../../../infrastructure/services/api";
import { useNavigate } from "react-router-dom";
import { validateEmail } from "../../../../utils/validators";

interface LoginFormValues {
  email: string;
  password: string;
  // 将来的な拡張用: rememberMe?: boolean;
}

interface LoginFormErrors {
  email?: string | string[];
  password?: string | string[];
  form?: string | string[];
}

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = (values: LoginFormValues): LoginFormErrors => {
    const newErrors: LoginFormErrors = {};
    if (!values.email) {
      newErrors.email = "メールアドレスは必須です";
    } else if (!validateEmail(values.email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }
    if (!values.password) {
      newErrors.password = "パスワードは必須です";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const formErrors = validateForm({ email, password });
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setLoading(true);
    const res = await loginUser(email, password);
    setLoading(false);
    if (res.success) {
      navigate("/library");
    } else {
      const apiFieldErrors = res.errors || {};
      const formMessage = res.message || 'ログインに失敗しました。';
      setErrors({ ...apiFieldErrors, form: formMessage });
    }
  };

  return (
    <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-md mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6 text-center">ログイン</h2>
      {errors.form && (
        <div className="mb-4 text-red-600 text-center text-sm" role="alert">{errors.form}</div>
      )}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.email ? "border-red-500" : ""}`}
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          disabled={loading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1" id="email-error">{errors.email}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.password ? "border-red-500" : ""}`}
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          disabled={loading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && <p className="text-red-500 text-xs mt-1" id="password-error">{errors.password}</p>}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          disabled={loading}
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </div>
      <div className="mt-4 flex flex-col items-center">
        <a href="/signup" className="text-blue-500 text-xs hover:underline">新規登録はこちら</a>
        {/* <a href="/forgot-password" className="text-blue-500 text-xs hover:underline mt-2">パスワードをお忘れですか？</a> */}
      </div>
    </form>
  );
};
