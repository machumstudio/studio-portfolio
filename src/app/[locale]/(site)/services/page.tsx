import type { Metadata } from "next";
import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ServicesHero } from "@/components/sections/ServicesHero";
import {
  ServicesPackages,
  type ServiceOffering,
} from "@/components/sections/ServicesPackages";
import { pagePhotos, servicePhoto, servicePhotoIds } from "../_sections/photos";
import { Faq } from "../_sections/site-sections";
import { staticPageMetadata } from "../_seo/page-metadata";

// 패키지와 가격은 당분간 고정값. 가격은 문구가 아니라 숫자 + 통화로 두고 화면에서 언어별로 표기한다.
// 통화는 원화: 가상 스튜디오가 한국 스튜디오라 원화로 받고, 같은 패키지는 표시 언어와 상관없이 같은 가격이다.
// 가격이 없는 패키지는 맞춤 견적. 포함 항목 키는 맞춤 견적이면 fit/quote, 아니면 fit/includes/extra.
// 서비스 순서는 시안 Services 페이지 (Portrait, Events, Commercial)
const currency = "KRW";
const services = {
  portrait: { individual: 250_000, family: 400_000, couple: 300_000 },
  events: { wedding: 1_500_000, party: 800_000, corporate: null },
  commercial: { product: 500_000, space: 700_000, brand: null },
} as const;
const pricedFeatures = ["fit", "includes", "extra"];
const customFeatures = ["fit", "quote"];

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "/services", "ServicesPage.metadata");
}

// 시안 간격(services-*.json, 노드 h 합과 프레임 높이 차이, 시안 픽셀의 테두리 위치로 확인):
// 헤더-히어로 40/80/100, 히어로-서비스 50/100/150, 이후 섹션 80/150/200
export default function ServicesPage({
  params,
}: PageProps<"/[locale]/services">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("ServicesPage");
  const service = useTranslations("Services.items");
  const photo = useTranslations("Photos");

  const offerings: ServiceOffering[] = Object.entries(services).map(
    ([id, packages]) => ({
      id,
      title: t(`services.${id}`),
      body: service(`${id}.body`),
      images: servicePhotoIds.map((n) => ({
        src: servicePhoto(id, n),
        alt: photo(`services.${id}.${n}`),
      })),
      packages: Object.entries(packages).map(([pkg, amount]) => ({
        id: pkg,
        name: t(`packages.${pkg}.name`),
        price: amount === null ? undefined : { amount, currency },
        features: (amount === null ? customFeatures : pricedFeatures).map(
          (feature) => t(`packages.${pkg}.features.${feature}`),
        ),
      })),
    }),
  );

  return (
    <main
      id="main"
      className="flex flex-col pt-10 pb-20 lg:pt-20 lg:pb-37.5 3xl:pt-25 3xl:pb-50"
    >
      <ServicesHero
        image={{ src: pagePhotos.servicesHero, alt: photo("servicesHero") }}
      />
      <div className="mt-12.5 lg:mt-25 3xl:mt-37.5">
        <ServicesPackages services={offerings} />
      </div>
      <div className="mt-20 lg:mt-37.5 3xl:mt-50">
        <Faq />
      </div>
    </main>
  );
}
