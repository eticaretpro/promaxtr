# Promaxtr

Serper.dev maps apisi kullanarak işletmeleri bulabildiğim, bir arama motoru oluşturmak istiyorum. Anasayfa basit ve anlaşılır olmalı, aranan kelime (google places kategorilerini bulabilirsen bunlar yazdıkça önermeli autosuggess) ve şehre göre (Türkiye'deki il ve ilçeleri github jsonda bul ve onlar dışında seçilemesin) aşağıda firmaları listelemeli. Sonuçta gelen firmaları kullanıcı İşletmelerine kaydedebilmeli. İşletme grupları da olmalı tabi. Ayrıca +90 telefon numarası ile giriş yapılmalı. OTP doğrulaması ile kayıt ve üyelik olmalı. OTP.com apisine göre bu yapıyı kurabilirsin. Kullanıcı işletmeleri işletme gruplarına kaydedebilmeli ama bunu yapabilmek için giriş yapmalı. Ayrıca sonra aramalarını da gösterelim. Arama sonuçları böyle değil resimli ve liste şeklinde olmalı, Proje adı Promax olacak. Toplu gruba kaydet özelliği de olmalı. Ama üye giriş yapılmadıysa pasif olmalı. Bu arama yapılan işletmeler veritabanında kayıtlı olsun, bunlara https://we.tc/zaverno bu şekilde sayfa oluşturacağız. Aynı zamanda bu aranan işletmelerde aslında üyelerimiz olacaklar. Yani yeni üyelik diye birşey olmayacak serper.dev apisinden gelen işletmeler aslında üyelerimiz olacak. Sadece 05 ile başlayan numarası olan işletmeleri göstereceğiz apiden gelen. Direk projeyi kodlama başla, api bilgilerini veritabanında saklamayı unutma.

### Locked
- **Brand name**: Promax (user requested: "Proje adı Promax olacak.")
- **Layout & Structure**: Follows the approved homepage wireframe (file_0t0jz4vssf87vr0banq9xwa4w4):
  - Top navigation bar: Promax logo, "Kayıtlı Gruplarım" link, and "İşletme Girişi (05xx OTP)" button.
  - Hero search panel: Centered and clear, with keyword/category input (autosuggest with common Google Places categories), City dropdown (81 Turkish provinces), District dropdown (cascading districts according to selected province), and "İşletmeleri Bul" primary search button.
  - Recent searches: Clickable chips displaying the user's recent search queries.
  - Results action bar: Bulk selection checkbox ("Tümünü Seç"), selected count indicator, and "Seçilenleri Gruba Kaydet" button (disabled when user is logged out with a prompt to log in), plus sorting options.
  - Search results list: Single-column vertical list of wide horizontal row cards with photo thumbnail on the left, business information (title, category badge, rating and review count, address, verified 05xx mobile phone number, and we.tc/[slug] link preview) in the middle, and action buttons ("Sayfayı Gör" and "+ Gruba Kaydet") on the right.
- **Data & Filtering rules**:
  - Filter Serper.dev Google Maps API results strictly to Turkish mobile numbers starting with 05 or +905 (user: "Sadece 05 ile başlayan numarası olan işletmeleri göstereceğiz apiden gelen."). Exclude landlines (0212, 0216, 0312, 0850 etc.).
  - Turkey Provinces and Districts: Pre-seed or embed the complete 81 Turkish provinces and their districts from a reliable source so users cannot select outside valid Turkish administrative divisions.
  - Business Persistence & Slugs: All fetched Serper businesses are stored in the database. Each business gets a dedicated public slug URL (e.g., `/[slug]` / `we.tc/[slug]`) displaying company details, photos, rating, address, and interactive contact actions.
  - Automated Membership model: Businesses retrieved from Serper are pre-seeded directly as the platform's members (user: "Yani yeni üyelik diye birşey olmayacak serper.dev apisinden gelen işletmeler aslında üyelerimiz olacak."). There is no separate open signup form; logging in via SMS OTP with that 05xx number verifies and claims the business profile.
  - Authentication: Phone-based SMS OTP (+90 5xx) compatible with OTP.com API. Authentication is required to save businesses into custom groups or perform bulk saves.
  - API Credentials Storage: System and API settings (Serper.dev API key, OTP.com API credentials/settings) must be stored in the database / settings table with an admin settings view to configure and update them dynamically (user: "api bilgilerini veritabanında saklamayı unutma.").

### Open
- Visual styling: Clean, modern, high-contrast Turkish business directory & CRM look (slate/blue tones, refined typography, crisp badges, smooth shadows).
- Database Schema (Lovable Cloud / Supabase):
  - `system_settings`: stores API keys and configs (Serper API key, OTP.com credentials, sender ID).
  - `businesses`: stores discovered Serper businesses (place_id, title, slug, mobile_phone, address, province, district, category, rating, review_count, thumbnail_url, website, claimed_by, created_at).
  - `business_groups`: user's custom lists (id, user_phone, name, color, created_at).
  - `saved_businesses`: relation between business_groups and businesses.
  - `search_history`: recent searches per session / phone number (category, province, district, timestamp).
  - `otp_verifications`: tracks OTP code requests, expiration, and verification attempts.
- Edge functions / Server routes:
  - Serper search proxy: securely queries `https://google.serper.dev/maps`, filters strictly for `05...` phone numbers, persists results to `businesses`, and returns sanitized results.
  - OTP dispatch & verify: interfaces with OTP.com or simulated OTP fallback when keys are pending, creating an authenticated user session upon successful code validation.
- Responsive design: optimized for desktop 1280×832 and mobile 393×764.

build a real working app, not a clickable prototype; the screen and kit files show layout, content and look (a wireframe's, structure only) and are never code to copy. The screens are the moments the user designed, not the whole product. Before building, walk through each flow as its user would and design what the pictures leave out, as a product designer would for this product: the steps a flow needs to finish and how the app responds to what the user does, including the moments its users will actually run into, like waiting on something or finding nothing yet. Add nothing a user of this product would never meet, and keep an app the user wants simple, simple. Never leave a step the product's core flows need as "coming soon", unless the brief says the user chose to. Where such a step needs an outside service, build every part up to it and say in your reply what's left to connect. Fill product gaps only, never a look the design set: an added step reuses the UI kit's tokens, chrome and parts and the nearest designed screen's layout, with no new visual direction. Look at every screen's picture before writing code; design.md says which picture or sheet holds each screen. Open the UI kit's shells and parts HTML for the header, tab bar, composer and components, not only its tokens. Use each finished screen's copy exactly as design.md lists it; never invent copy for one. A wireframe under design.md's Wireframes gives structure only: build it in the design's look, as design.md says. The screens' photos are placeholders for the mockups only: replace every photo design.md lists with the user's own upload for it, else as design.md says (a photo without people re-composed with imagegen--edit_image from it as a reference, a photo of people generated from its brief and never from the photo), and ship no set photo or its URL. For a design that came with no design.md, every photo on assets.lovable.dev or images.unsplash.com is a set photo: replace it with the user's own upload for it, else a new image generated for its slot, any person in it one who doesn't exist, never from the photo or a picture showing it. Build and check each screen at the canvas it was drawn at: phone 393×764, tablet landscape 1133×744, tablet portrait 744×1133, desktop 1280×832. After building, screenshot the app at those sizes and states, compare each finished screen with its picture, and fix every visual difference you didn't choose; check a wireframe's screen against its structure, never its grey look. End your reply with "Changed from the mockups": each deliberate change and why, and "Added beyond the mockups": each step, state or interaction you built that no screen shows.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://promaxtr.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7778d072-3d69-4b48-a4e9-2ae7025878ad).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
