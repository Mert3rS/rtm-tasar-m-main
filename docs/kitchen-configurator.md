# Mutfak tasarım atölyesi

`/tasarim-olustur?urun=mutfak` yeni mutfak başlangıcını açar. Referans düzen; süper mat antrasit kapak, açık kuvars tezgâh, çekmeceler, üst dolaplar ve seçilebilir evye/ocak/fırın içerir. Bunlar ön tasarım seçenekleridir; gerçek ürün, cihaz markası veya üretim uygunluğu iddiası değildir.

Ürün ve ölçü adımında düz, sola dönen L ve sağa dönen L planları bulunur. Ana duvar genişliği `d.w`, dolap derinliği `d.d`, dönüş duvarının köşe dahil toplam uzunluğu `k.length` alanındadır. L planında ana duvarın köşe alanı ayrılır; dönüşteki net dolap sırası `k.length - d.d` uzunluğundadır. Köşe kör köşedir; özel köşe mekanizması temsil edilmez. Dönüş modülleri her iki L yönünde köşeden serbest uca doğru sıralanır.

`k.modules` isteğe bağlı genişletmesi üst ve alt sıraları bağımsız tutar. Ana alt sıra mevcut `r.main` ölçülerini kullanır; üst sıra ve dönüşün iki sırası ayrı genişlik/kilit/tip/cam dizilerine sahiptir. Her sıra 1–8 modüldür; genişlik en az 30 cm'dir. Kilitli ölçüler korunur, imkânsız düzenleme atomik reddedilir. Dönüş kısalırken kilitsiz sıralar minimum genişliğe sığacak kadar azaltılabilir; kilitler otomatik silinmez. Evye/fırın/bulaşık makinesi tekil seçimlerdir ve başka sıraya taşınırken önceki konum kapaklıya döner. Ocak ayrıca seçilir. Üst sırada kapak, cam vitrin, açık raf ve davlumbaz vardır. Cam türü modül bazında, çerçeve rengi ortaktır. Şeffaf, füme, buzlu ve yivli cam temsil edilir.

Vitrinli 300, Kompakt 240 ve Dengeli 360 başlangıçları ziyaretçinin açık seçimiyle uygulanır; CMS kaydı veya seed oluşturmaz. 300 cm düzeni kullanıcının paylaştığı [referanstan](https://rtratolye.com/siparis.html) esinlenir: 50/60/50/80/60 cm alt modüller, ankastre/evye/bulaşık makinesi, iki cam vitrin ve bronz çerçeve. Hazır renk kombinasyonları ölçüleri değiştirmez. Seçim odağı, gövde/kapak renkleri, 10 cm baza, düğme kulp, ek tezgâh yüzeyleri ve gola LED mevcut izinli tasarım akışına dahildir. Yeni storage anahtarı, haricî görsel veya betik yoktur.

`d.h` baza dahil alt dolap yüksekliğidir. Seçili tezgâh 4 cm, üst dolap başlangıcı ise tezgâh üst kotu + `k.gap` olarak çizilir. Toplam yükseklik üst dolaplar varsa üst dolap yüksekliğini de içerir. 3B görünüm, teknik plan, açılmış dönüş görünüşü ve teklif aynı geometri yardımcılarını kullanır. Evye/ocak için seçili tezgâh ve en az 50 cm modül gerekir. Fırın en az 50 cm genişlik ve 60 cm net yükseklik; bulaşık makinesi en az 45 cm genişlik ve 60 cm net yükseklik ister. Bunlar temsilî önizleme eşikleridir. Sığmayan cihaz çizimde kapaklı görünür ve teklif metnine cihaz olarak eklenmez. Ocak evye/bulaşık makinesiyle aynı modülde çizilmez.

Yeni mutfak tasarımları mevcut strict v2 şemasındaki isteğe bağlı `k.modules` nesnesini kullanır. Eski bağlantılara varsayılan alan eklenmez; kanonik paylaşım kimliği korunur. Eski `k` düzeni yeni modül editöründe ilk açık düzenlemeye kadar dönüştürülmez. Mutfak dışındaki ürünlerde `k` reddedilir. CMS koleksiyonu veya veritabanı şeması değişmez, migration gerekmez. Var olan izinli tasarım storage anahtarı kullanılır.

Doğrulama:

```sh
pnpm typecheck
pnpm lint
pnpm test:int
pnpm exec playwright test tests/e2e/kitchen.e2e.spec.ts --workers=1
pnpm build
```

Tarayıcı testi CMS içeriği oluşturmaz; kısa bağlantı API'sini çevrimdışı yanıtla taklit eder. Görseller `.tools/kitchen-qa/` altında Git dışında tutulur.
