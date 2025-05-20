import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "./LoginForm";
import { loginUser } from "../../../../infrastructure/services/api";
import { BrowserRouter } from "react-router-dom";

vi.mock("../../../../infrastructure/services/api");

const mockedLoginUser = loginUser as unknown as jest.Mock;

// useNavigateのモック
let mockNavigate: ReturnType<typeof vi.fn>;
vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
  });

  function setup() {
    return render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );
  }

  it("フォームが正しくレンダリングされる", () => {
    setup();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ログイン" })).toBeInTheDocument();
  });

  it("有効な入力でAPIが呼ばれリダイレクトされる", async () => {
    mockedLoginUser.mockResolvedValueOnce({ success: true });
    setup();
    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
    await waitFor(() => {
      expect(mockedLoginUser).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockNavigate).toHaveBeenCalledWith("/library");
    });
  });

  it("認証失敗時にエラーメッセージが表示される", async () => {
    mockedLoginUser.mockResolvedValueOnce({ success: false, message: "メールアドレスまたはパスワードが正しくありません。" });
    setup();
    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "wrong@example.com" } });
    fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
    await waitFor(() => {
      expect(screen.getByText("メールアドレスまたはパスワードが正しくありません。")).toBeInTheDocument();
    });
  });

  it("メールアドレス未入力でバリデーションエラーが表示される", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
    expect(await screen.findByText("メールアドレスは必須です")).toBeInTheDocument();
  });

  it("パスワード未入力でバリデーションエラーが表示される", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
    expect(await screen.findByText("パスワードは必須です")).toBeInTheDocument();
  });
});
