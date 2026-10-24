import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ko from "../../messages/ko.json";

function entries(obj: object, prefix = ""): [string, string][] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object"
      ? entries(v, `${prefix}${k}.`)
      : [[`${prefix}${k}`, String(v)]],
  );
}

const keys = (obj: object) => entries(obj).map(([key]) => key);
const koValues = new Map(entries(ko));

// 번역하지 않는 값: 브랜드/고객사/SNS 이름, 후기 작성자 이름, 숫자, 시안 크레딧.
// 새 키를 추가했는데 en 을 ko 그대로 두면 이 목록에 없어서 실패한다
const sameInBothLocales = new Set([
  "Metadata.title",
  "Layout.brand",
  "Layout.wordmark",
  "Layout.footer.clients.klovesto",
  "Layout.footer.clients.nukeway",
  "Layout.footer.clients.clovens",
  "Layout.footer.clients.menvol",
  "Layout.footer.copyright",
  "Layout.footer.credit",
  "Layout.footer.social.instagram",
  "Layout.footer.social.facebook",
  "Layout.footer.social.x",
  "Hero.name",
  "Testimonials.items.emily.name",
  "Testimonials.items.john.name",
  "Testimonials.items.samantha.name",
  "Testimonials.items.olivia.name",
  "Testimonials.items.lucas.name",
  "Testimonials.items.sofia.name",
  "WorkPage.metadata.title",
  "AboutPage.stats.items.years.value",
  "AboutPage.stats.items.clients.value",
  "AboutPage.stats.items.awards.value",
  "AboutPage.stats.items.abroad.value",
  "AboutPage.stats.items.followers.value",
  "AboutPage.stats.items.retention.value",
  "NotFound.eyebrow",
]);

// ICU 자리표시자 이름 ({name}, {count, plural, ...} 의 count). plural 안의 # 와 문구는 언어마다 달라도 된다
const placeholders = (message: string) =>
  [...message.matchAll(/\{\s*([A-Za-z_]\w*)\s*[,}]/g)]
    .map((match) => match[1])
    .filter((name, index, all) => all.indexOf(name) === index)
    .sort();

describe("messages", () => {
  it("ko 와 en 의 키가 같다", () => {
    expect(keys(en).sort()).toEqual(keys(ko).sort());
  });

  it("en 에 한글이 없다", () => {
    const korean = entries(en).filter(([, value]) => /[가-힣]/.test(value));
    expect(korean.map(([key]) => key)).toEqual([]);
  });

  it("en 이 ko 와 같은 값은 번역하지 않기로 한 것뿐이다", () => {
    const same = entries(en)
      .filter(([key, value]) => koValues.get(key) === value)
      .map(([key]) => key);
    expect(same.sort()).toEqual([...sameInBothLocales].sort());
  });

  it("ko 와 en 의 자리표시자가 같다", () => {
    const mismatched = entries(en).filter(
      ([key, value]) =>
        placeholders(value).join() !==
        placeholders(koValues.get(key) ?? "").join(),
    );
    expect(mismatched.map(([key]) => key)).toEqual([]);
  });
});
