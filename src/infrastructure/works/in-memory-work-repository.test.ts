import { createInMemoryWorkRepository } from "./in-memory-work-repository";
import { describeWorkRepositoryContract } from "./work-repository.contract";

describeWorkRepositoryContract("인메모리", createInMemoryWorkRepository);
