# 0009. 문의 입력 검증은 domain 한 곳에서만 하고, 폼은 서버 액션 결과로 오류를 그린다
- 상태: 채택 (2026-10)

## 배경
문의 칸의 규칙(필수, 길이 한도, 이메일/연락처 형식)은 12칸에서 domain(`createInquiry`, `inquiryLimits`)에 만들었다.
docs/architecture.md 의 처음 그림은 폼이 react-hook-form + zod 로 같은 규칙을 한 번 더 검사하는 것이었는데, 그러면 한도와 형식이 zod 와 domain 두 곳에 생긴다.
features → domain 은 타입 import 만 허용이라 zod 스키마가 `inquiryLimits` 값을 직접 가져올 수도 없다 (12칸 PR 의 남은 TODO).
또 13칸 요구는 JS 없이도 제출과 서버 검증이 동작하는 것이다.

## 결정
- 검증의 단일 출처는 domain 이다. 칸별 오류는 `createInquiry` 의 `InvalidInquiry.fields` 하나만 쓴다
- zod(`features/inquiry/schema.ts`)는 FormData 의 형태(칸이 문자열인지, 빠진 칸은 빈 값)와 문자열 정리(줄바꿈 CRLF → LF, 유니코드 NFC)만 맡는다. 필수/길이/형식은 보지 않는다
- 서버 액션이 `InvalidInquiry.fields` 를 칸별 오류 코드(`required`, `tooLong` + max, `invalidEmail`, `invalidPhone`)로 바꾸고, 화면은 코드를 메시지 키로 번역한다
- 화면에 필요한 한도 값(입력 칸 `maxLength`)은 `application/inquiry/limits.ts` 가 domain 값을 다시 내보낸 것을 쓴다
- 폼은 react-hook-form 없이 `useActionState` + `<form action>` 으로 만든다. JS 가 없으면 일반 POST 로, 있으면 페이지 이동 없이 같은 서버 액션을 부른다. 브라우저 기본 검증 말풍선은 끄고(`noValidate`), `required` 는 보조기기 안내용으로만 둔다

## 대안
- zod 스키마에 같은 규칙을 다시 적고 클라이언트에서 react-hook-form 으로 미리 검사: 입력 중 즉시 피드백은 좋지만 규칙이 두 벌이 되고, JS 없는 제출은 어차피 서버 결과로 그려야 해서 오류 표시 경로도 두 벌이 된다
- 한도만 공유하고 형식 규칙은 zod 에 둠: 이메일/연락처 판단이 화면과 서버에서 어긋날 수 있다 (예: zod `email()` 과 domain 정규식의 차이)
- features → domain 값 import 허용: 의존 규칙 표의 예외가 생긴다. application 이 다시 내보내는 한 줄이 더 단순하다

## 결과
- 규칙을 바꾸면 domain 과 그 테스트만 고친다. 화면 문구는 오류 코드별 메시지 키라 따로 늘지 않는다
- 오류는 제출해야 보인다 (입력 중 즉시 검사 없음). 문의 폼은 칸이 5개라 제출 후 한 번에 모두 보여 주고 첫 오류 칸으로 포커스를 옮기는 것으로 충분하다고 본다
- 관리자 작업 폼(18칸)은 이미지 업로드처럼 클라이언트 상태가 많아 react-hook-form 을 다시 검토한다. 그때도 규칙의 출처는 domain 이다
