# Ana sayfa mutfak dönüşümü denemesi

Bu fotoğraf geçişi denemesinin yerini [3B kurulum animasyonu](kitchen-assembly-experiment.md) aldı.
Aşağıdaki notlar `787fadf` commit'indeki ilk denemeyi açıklar; güncel seçim 3B render işaretini kullanır.

Bu çalışma `experiment/kitchen-scroll` dalındadır. Önceki animasyonun `SpotlightHero.tsx`, `cinematic-hero.css`, `heroSequence.ts` ve film dosyaları korunur. CMS içeriği ve şeması değiştirilmez.

Yerelde, Git tarafından yok sayılan `.env.local` içindeki `RTM_HERO_EXPERIMENT=1` yeni animasyonu açar. Beş görselden biri eksikse mevcut animasyon gösterilir. Değişken yoksa veya `0` ise eski animasyon kullanılır. Değişken değişikliğinde geliştirme sunucusunu yeniden başlatmak gerekebilir.

- Yeni deneme: `http://localhost:3000/`
- Önceki animasyon: `http://localhost:3000/?hero=original`

Görseller kullanıcı tarafından sağlanan yerel fotoğrafların WebP kopyalarıdır. Kaynak fotoğraflar değiştirilmez. Kullanılan sıra `public/assets/home/kitchen-experiment` altında `01-empty`, `02-assembly`, `03-complete`, `04-detail`, `05-wide` şeklindedir. Deneme için bu fotoğraflar CMS kayıtlarına veya örnek portföy içeriğine dönüştürülmez.

Geçiş yalnızca opacity/transform günceller; scroll handler sadece hedef ilerlemeyi hesaplar. Görüntüler çözülmeden üst katman açılmaz. İstek üzerine çalışan requestAnimationFrame döngüsü, bölüm ekran dışındayken ve sekme gizliyken durur; bekleme anında sürekli çalışmaz. Yumuşatma ekran yenileme hızından bağımsızdır. Reduced-motion tercihinde kaydırma sabitlemesi ve geçişler kaldırılır. Tema değişiminde yeniden mount yapılmaz. Yeni bağımlılık, saklama anahtarı veya dış istek eklenmez.

Geri dönüş için `RTM_HERO_EXPERIMENT=0` yeterlidir; deneme dosyalarını silmek veya CMS verisini geri yüklemek gerekmez. Deneme değişiklikleri kaydedildikten sonra `main` dalına dönmek de eski kodu açar.

Yerel tarayıcı kontrolünde masaüstü (1440×1000), mobil (390×844), ileri/geri kaydırma, beş görselin yüklenmesi, yatay taşma, reduced-motion açma/kapama ve eski animasyon bağlantısı doğrulandı. Normal headless Chromium ölçümünde 2 saniyelik kaydırmada 121 kare; 4× CPU yavaşlatmalı 3 saniyelik ölçümde 147 kare, p95 33,4 ms ve 50 ms üzeri iki aralık görüldü. Bunlar yerel geliştirme ortamına ait örnek ölçümlerdir; gerçek mobil cihaz performansının garantisi değildir. Sayaç ve başlık DOM güncellemeleri yalnızca aşama değişiminde yapılır. SiteHeader iki hero türünü de tanıyarak içerik gözlemcisini sonlandırır.
