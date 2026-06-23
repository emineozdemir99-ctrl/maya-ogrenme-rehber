# Maya Öğrenme Rehberi

Ortaokul öğrencilerine Sokratik yöntemle matematik desteği veren, öğretmenlerin tüm etkileşimleri izleyebildiği React + Vite web portalı. OpenAI ve Supabase anahtarları tarayıcıya gönderilmez; tüm hassas işlemler Netlify Functions içinde yapılır.

## Özellikler

- Öğrenci numarası ve şifre ile öğrenci girişi
- Ayrı öğretmen girişi ve rol tabanlı yetkilendirme
- Mesaj geçmişi, otomatik kayıt ve ChatGPT benzeri Maya sohbeti
- Öğrenci listesi, arama, mesaj sayısı ve son giriş bilgisi
- Öğretmen için öğrencinin eksiksiz sohbet geçmişi
- Toplam öğrenci/mesaj/sohbet, bugün aktif öğrenci, en aktif öğrenciler ve son sohbetler
- Mobil uyumlu lacivert, beyaz ve açık mavi arayüz
- Server-side OpenAI çağrısı, bcrypt parola özeti ve imzalı kısa ömürlü oturum

## Mimari

```text
React (tarayıcı)
       │ /api/*
       ▼
Netlify Functions ───── OpenAI API
       │
       └─────────────── Supabase (PostgreSQL)
```

Tarayıcıda Supabase anahtarı veya OpenAI anahtarı bulunmaz. Veritabanında RLS açıktır ve erişim yalnızca sunucudaki `SUPABASE_SERVICE_ROLE_KEY` ile yapılır.

## 1. Gereksinimler

- Node.js 20 veya üzeri
- Bir [Supabase](https://supabase.com/) projesi
- Bir [OpenAI API](https://platform.openai.com/) anahtarı
- Yayınlamak için bir [Netlify](https://www.netlify.com/) hesabı

## 2. Supabase kurulumu

1. Supabase Dashboard içinde yeni bir proje oluşturun.
2. Sol menüden **SQL Editor** ekranını açın.
3. [`supabase/schema.sql`](supabase/schema.sql) dosyasının tamamını kopyalayıp çalıştırın.
4. **Project Settings → API** bölümünden şu iki değeri alın:
   - Project URL → `SUPABASE_URL`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

> Service role anahtarını hiçbir zaman `VITE_` ile başlayan bir değişkene koymayın ve tarayıcı koduna eklemeyin.

Şema üç örnek öğrenci ve bir öğretmen oluşturur:

| Rol | Kullanıcı | Şifre |
|---|---|---|
| Öğrenci | `101` | `1234` |
| Öğrenci | `102` | `1234` |
| Öğrenci | `103` | `1234` |
| Öğretmen | `ogretmen` | `Maya2026!` |

İlk girişten önce bu örnek parolaları değiştirmeniz önerilir. Yeni kullanıcı eklerken parolayı SQL Editor içinde bcrypt ile özetleyin:

```sql
insert into public.students (student_no, full_name, password, class_name)
values ('104', 'Öğrenci Adı', crypt('YeniGucluSifre', gen_salt('bf', 10)), '6-B');

update public.teachers
set password = crypt('YeniGucluOgretmenSifresi', gen_salt('bf', 10))
where username = 'ogretmen';
```

## 3. OpenAI API kurulumu

1. OpenAI Platform üzerinde bir API anahtarı oluşturun.
2. Anahtarı `OPENAI_API_KEY` adıyla ortam değişkenlerine ekleyin.
3. Varsayılan model `gpt-4.1-mini`dir. Başka bir model kullanmak için `OPENAI_MODEL` değerini değiştirin.

Maya’nın sistem yönergesi [`netlify/functions/chat.js`](netlify/functions/chat.js) içindeki `MAYA_PROMPT` sabitindedir. API anahtarı yalnızca bu sunucu fonksiyonunda okunur.

## 4. Yerel geliştirme

Proje klasöründe:

```bash
npm install
```

`.env.example` dosyasını `.env` adıyla kopyalayın ve değerleri doldurun:

```env
SUPABASE_URL=https://proje-kodu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
JWT_SECRET=...
```

Güçlü bir JWT anahtarı üretmek için Node.js kullanabilirsiniz:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Arayüz ve Netlify Functions birlikte çalışacak şekilde başlatın (ilk çalıştırmada Netlify CLI otomatik indirilir):

```bash
npm run dev
```

Netlify CLI ekranda genellikle `http://localhost:8888` adresini verir. Yalnızca arayüz üzerinde çalışmak için `npm run dev:vite` kullanılabilir; bu durumda sunucu fonksiyonları çalışmayacağı için giriş ve sohbet işlemleri kullanılamaz.

Üretim derlemesini doğrulamak için:

```bash
npm run build
npm run lint
```

## 5. Netlify deployment

### Git üzerinden önerilen yöntem

1. Projeyi GitHub, GitLab veya Bitbucket deposuna gönderin.
2. Netlify’da **Add new site → Import an existing project** seçin.
3. Depoyu seçin. `netlify.toml` sayesinde ayarlar otomatik gelir:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. **Site configuration → Environment variables** bölümüne aşağıdaki değişkenleri ekleyin:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (isteğe bağlı)
   - `JWT_SECRET` (en az 32 karakter, rastgele)
5. **Deploy site** düğmesine basın.

### Netlify CLI ile

```bash
npx netlify login
npx netlify init
npx netlify env:set SUPABASE_URL "..."
npx netlify env:set SUPABASE_SERVICE_ROLE_KEY "..."
npx netlify env:set OPENAI_API_KEY "..."
npx netlify env:set OPENAI_MODEL "gpt-4.1-mini"
npx netlify env:set JWT_SECRET "en-az-32-karakterlik-rastgele-deger"
npx netlify deploy --build --prod
```

## Güvenlik notları

- Parolalar düz metin değil bcrypt özeti olarak saklanır.
- Giriş hataları kullanıcı adının var olup olmadığını açıklamaz.
- Öğrenci kimliği istek gövdesinden kabul edilmez; imzalı oturumdan alınır.
- Öğrenciler yalnızca kendilerine ait konuşma kimliğini kullanabilir.
- Öğretmen uçları öğretmen rolünü ayrıca doğrular.
- Oturumlar öğrenciler için 8, öğretmenler için 4 saat sonra sona erer.
- Mesaj uzunluğu istemci ve sunucuda sınırlandırılmıştır.
- RLS açık olduğundan istemci Supabase tablolarını doğrudan okuyamaz.

Üretimde ek olarak Netlify rate limiting, güçlü ve benzersiz parolalar, düzenli anahtar yenileme ve okulunuzun kişisel veri saklama politikasına uygun silme/saklama süreleri uygulanmalıdır.

## Proje yapısı

```text
src/                         React arayüzü
supabase/schema.sql          Tablolar, indeksler, RLS ve örnek hesaplar
netlify/functions/chat.js    OpenAI üzerinden Maya yanıtı
netlify/functions/*.js       Giriş, geçmiş ve öğretmen API uçları
netlify/functions/_lib/      Kimlik doğrulama ve ortak yardımcılar
netlify.toml                 Build, function ve SPA yönlendirmeleri
```

## Sorun giderme

- **Giriş yapılamıyor:** SQL şemasının çalıştığını, doğru Service Role anahtarını kullandığınızı ve yerel geliştirmeyi `npm run dev` ile başlattığınızı kontrol edin.
- **401 hatası:** Oturum süresi dolmuştur veya `JWT_SECRET` deployment sonrasında değişmiştir; yeniden giriş yapın.
- **Sohbet yanıt vermiyor:** `OPENAI_API_KEY`, model adı ve OpenAI hesabının kullanım limitlerini kontrol edin.
- **Netlify sayfa yenilemede 404:** Kökteki `netlify.toml` dosyasının deploy edildiğini doğrulayın.
