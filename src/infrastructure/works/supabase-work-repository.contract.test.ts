import { describe } from "vitest";
import { hasSupabaseEnv, secretClient } from "../supabase/contract-support";
import { createSupabaseWorkRepository } from "./supabase-work-repository";
import { replaceAllWorks } from "./supabase-work-writer";
import { describeWorkRepositoryContract } from "./work-repository.contract";

describe.skipIf(!hasSupabaseEnv)("Supabase", () => {
  describeWorkRepositoryContract("Supabase", async (works) => {
    const client = secretClient();
    await replaceAllWorks(client, works);
    return createSupabaseWorkRepository(client);
  });
});
