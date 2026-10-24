// 문의 칸 한도. 검증은 domain(createInquiry) 한 곳에서만 한다.
// 화면(문의 폼의 maxLength, 13칸)은 domain 값을 직접 import 할 수 없어(features → domain 은 타입만) 여기서 받는다
export { inquiryLimits } from "@/domain/inquiry/fields";
