import React from "react";
import { SignUpForm } from "../components/features/Auth/SignUpForm";

const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">新規ユーザー登録</h1>
        <SignUpForm />
      </div>
    </div>
  );
};

export default SignUpPage;
