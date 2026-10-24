import { createInMemoryInquiryRepository } from "./in-memory-inquiry-repository";
import { describeInquiryRepositoryContract } from "./inquiry-repository.contract";

describeInquiryRepositoryContract("인메모리", createInMemoryInquiryRepository);
