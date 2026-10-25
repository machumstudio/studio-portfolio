import type { Metadata } from "next";
import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ContactHero } from "@/components/sections/ContactHero";
import { ContactInfo } from "@/components/sections/ContactInfo";
import { ContactMessage } from "@/components/sections/ContactMessage";
import { submitInquiryAction } from "@/features/inquiry/actions";
import { InquiryForm } from "@/features/inquiry/ui/InquiryForm";
import { pagePhotos } from "../_sections/photos";
import { studioContact } from "../_sections/studio-contact";
import { Testimonials } from "../_sections/site-sections";
import { staticPageMetadata } from "../_seo/page-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "/contact", "ContactPage.metadata");
}

// 시안 간격(contact-*.json, 노드 h 합과 프레임 높이 차이, 시안 픽셀의 테두리 위치로 확인):
// 헤더-히어로 40/80/100, 히어로-연락처 정보 50/80/100, 메시지-후기 80/150/200, 후기-푸터 80/150/200.
// 연락처 정보와 메시지 보내기는 간격 없이 위 테두리로 나뉜다
export default function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const photo = useTranslations("Photos");

  return (
    <main
      id="main"
      className="flex flex-col pt-10 pb-20 lg:pt-20 lg:pb-37.5 3xl:pt-25 3xl:pb-50"
    >
      <ContactHero
        image={{ src: pagePhotos.contactHero, alt: photo("contactHero") }}
      />
      <div className="mt-12.5 page-x lg:mt-20 3xl:mt-25">
        <ContactInfo phone={studioContact.phone} email={studioContact.email} />
        <ContactMessage form={<InquiryForm action={submitInquiryAction} />} />
      </div>
      <div className="mt-20 lg:mt-37.5 3xl:mt-50">
        <Testimonials />
      </div>
    </main>
  );
}
