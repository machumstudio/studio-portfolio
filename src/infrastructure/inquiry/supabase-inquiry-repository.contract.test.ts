import { describe } from "vitest";
import { hasSupabaseEnv, secretClient } from "../supabase/contract-support";
import { describeInquiryRepositoryContract } from "./inquiry-repository.contract";
import { createSupabaseInquiryRepository } from "./supabase-inquiry-repository";
import { replaceAllInquiries } from "./supabase-inquiry-writer";

describe.skipIf(!hasSupabaseEnv)("Supabase", () => {
  describeInquiryRepositoryContract("Supabase", async (inquiries) => {
    const client = secretClient();
    await replaceAllInquiries(client, inquiries);
    return createSupabaseInquiryRepository(client);
  });
});
