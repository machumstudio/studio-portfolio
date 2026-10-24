import { describe } from "vitest";
import {
  hasSupabaseEnv,
  secretClient,
  supabaseUrl,
} from "../supabase/contract-support";
import { describePhotoStorageContract } from "./photo-storage.contract";
import { createSupabasePhotoStorage } from "./supabase-photo-storage";

// 버킷 동작(서명 업로드, 형식/크기 제한, 덮어쓰기 금지, 공개 주소)을 본다. 권한은 photo-storage-rls.contract.test.ts.
// 실행마다 다른 폴더(contract-<run>)에 올리고 끝나면 지운다
const run = Math.random().toString(36).slice(2, 10);

describe.skipIf(!hasSupabaseEnv)("Supabase Storage", () => {
  describePhotoStorageContract(
    "Supabase",
    () => ({
      storage: createSupabasePhotoStorage(secretClient(), supabaseUrl()),
      // 브라우저와 같이 서명 주소에 키 없이 PUT 한다
      put: async (ticket, body, type) => {
        const response = await fetch(ticket.url, {
          method: "PUT",
          headers: { ...ticket.headers, ...(type && { "content-type": type }) },
          body,
        });
        return response.ok;
      },
      get: async (src) => {
        const response = await fetch(src, { cache: "no-store" });
        return response.ok
          ? new Uint8Array(await response.arrayBuffer())
          : null;
      },
    }),
    `contract-${run}`,
  );
});
