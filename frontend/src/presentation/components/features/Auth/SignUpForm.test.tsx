import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SignUpForm } from "./SignUpForm";
import * as api from "../../../../infrastructure/services/api";

// useNavigateのモック
let mockNavigate: ReturnType<typeof vi.fn>;
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// フォーム入力・送信のヘルパー
const fillAndSubmitForm = async (
  email = "test@example.com",
  password = "Password1",
  passwordConfirm = "Password1",
  agree = true
) => {
  await act(async () => {
    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: password } });
    fireEvent.change(screen.getByLabelText("パスワード（確認用）"), { target: { value: passwordConfirm } });
    if (agree) {
      fireEvent.click(screen.getByLabelText(/利用規約.*プライバシーポリシー/));
    }
    fireEvent.click(screen.getByRole("button", { name: "登録" }));
  });
};

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
  });

  it("フォームの各入力フィールドとボタンが表示される", () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード（確認用）")).toBeInTheDocument();
    expect(screen.getByLabelText(/利用規約.*プライバシーポリシー/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
  });

  it("有効な入力でAPIクライアントが呼ばれリダイレクトされる", async () => {
    const mockRegister = vi.spyOn(api, "registerUser").mockResolvedValue({ success: true });
    render(<SignUpForm />);
    await fillAndSubmitForm();
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("test@example.com", "Password1");
      expect(mockNavigate).toHaveBeenCalledWith("/library");
    });
  });

  it("メール形式が不正な場合にエラーメッセージが表示される", async () => {
    render(<SignUpForm />);
    await fillAndSubmitForm("invalid", "Password1", "Password1");
    await waitFor(() => {
      // data-testidで取得し、内容が空でないことを確認
      const error = screen.getByTestId("email-error");
      expect(error).toBeInTheDocument();
      expect(error.textContent).not.toBe("");
    });
  });

  it("パスワードが短い場合にエラーメッセージが表示される", async () => {
    render(<SignUpForm />);
    await fillAndSubmitForm("test@example.com", "short", "short");
    expect(await screen.findByText(/8文字以上の英字と数字/)).toBeInTheDocument();
  });

  it("パスワード不一致時にエラーメッセージが表示される", async () => {
    render(<SignUpForm />);
    await fillAndSubmitForm("test@example.com", "Password1", "Password2");
    expect(await screen.findByText(/パスワードが一致しません/)).toBeInTheDocument();
  });

  it("APIがバリデーションエラーを返した場合にエラーメッセージが表示される", async () => {
    vi.spyOn(api, "registerUser").mockResolvedValue({
      success: false,
      errors: { email: "このメールアドレスは既に登録されています" },
      message: "バリデーションエラー"
    });
    render(<SignUpForm />);
    await fillAndSubmitForm("dup@example.com");
    expect(await screen.findByText(/既に登録/)).toBeInTheDocument();
  });

  it("APIが一般エラーを返した場合にフォーム上部にエラーメッセージが表示される", async () => {
    vi.spyOn(api, "registerUser").mockResolvedValue({
      success: false,
      message: "サーバーエラーが発生しました"
    });
    render(<SignUpForm />);
    await fillAndSubmitForm();
    expect(await screen.findByText(/サーバーエラー/)).toBeInTheDocument();
  });
});
