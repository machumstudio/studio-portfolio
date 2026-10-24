import type { MemoryAccount } from "./in-memory-auth";

// DATA_STORE=memory 일 때만 쓰는 테스트 계정 (e2e/admin-auth.spec.ts). 실제 관리자 계정이 아니다.
// 비밀번호가 레포에 있으므로 container 는 DATA_STORE=memory 를 명시했을 때만 이 계정을 켠다
export const memoryAccounts: readonly MemoryAccount[] = [
  {
    id: "memory-admin",
    email: "admin@example.com",
    password: "memory-admin-password",
    role: "admin",
  },
  {
    // 비밀번호는 맞지만 관리자가 아닌 계정 (로그인 실패 문구가 같은지 확인용)
    id: "memory-editor",
    email: "editor@example.com",
    password: "memory-editor-password",
    role: "editor",
  },
];
