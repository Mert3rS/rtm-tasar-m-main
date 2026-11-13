import { EditableRegion } from '@/components/site/EditableRegion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowIcon } from '@/components/site/ArrowIcon'
import { TextAnimate } from '@/components/site/TextAnimate'
import storyboardImage from '../../../public/assets/home/configurator-storyboard-v1.png'
import type { HomepageCopy } from '@/lib/homepageContent'

export function DesignStudioTeaser({ copy }: { copy: HomepageCopy }) {
  return (
    <section
      aria-labelledby="design-studio-teaser-heading"
      className="design-studio-teaser section-space"
    >
      <div className="site-shell design-studio-teaser-grid">
        <EditableRegion as="div" className="design-studio-teaser-copy" data-rtm-edit="site-settings" data-rtm-field="homepage__studioHeading" data-rtm-label="Atölye tanıtım metinleri">
          <p className="eyebrow">05 / DİJİTAL TASARIM ATÖLYESİ</p>
          <h2 id="design-studio-teaser-heading">
            <TextAnimate animation="slideUp" as="span" by="word" duration={0.56}>
              {copy.studioHeading}
            </TextAnimate>
            <br />
            <em>
              <TextAnimate
                animation="blurInUp"
                as="span"
                by="character"
                delay={0.12}
                duration={0.48}
                stagger={0.025}
              >
                {copy.studioEmphasis}
              </TextAnimate>
            </em>
          </h2>
          <TextAnimate animation="fadeIn" as="p" by="text" className="section-intro" delay={0.18}>
            {copy.studioDescription}
          </TextAnimate>
          <Link className="button-primary" href="/tasarim-olustur">
            {copy.studioButton}
            <ArrowIcon diagonal />
          </Link>
        </EditableRegion>
        <Link
          href="/tasarim-olustur"
          className="studio-demo"
          aria-label="Üç boyutlu tasarım aracını aç"
        >
          <div className="studio-demo-bar">
            <span>RTM / TASARIM AKIŞI · 09 SN</span>
            <span className="studio-demo-status">
              <i /> CANLI SÜREÇ
            </span>
          </div>
          <div className="studio-demo-stage">
            <div className="studio-storyboard" aria-hidden="true">
              <Image
                src={storyboardImage}
                alt=""
                sizes="(min-width: 1000px) 58vw, 92vw"
                className="studio-storyboard-strip"
              />
              <div className="studio-storyboard-focus" />
            </div>
            <div className="studio-demo-phases" aria-hidden="true">
              <span>01 / Eskiz</span>
              <span>02 / Gövde</span>
              <span>03 / Detay</span>
              <span>04 / Malzeme</span>
              <span>05 / Mekân</span>
            </div>
            <span className="studio-demo-play" aria-hidden="true">
              RTM
            </span>
            <span className="studio-demo-time" aria-hidden="true">
              00:09
            </span>
          </div>
          <div className="studio-demo-progress" aria-hidden="true">
            <i />
          </div>
        </Link>
      </div>
    </section>
  )
}
