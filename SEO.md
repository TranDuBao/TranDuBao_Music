# Hướng Dẫn Tối Ưu SEO & Lập Chỉ Mục Google - DuBao MusicStream

Tài liệu hướng dẫn quản lý và tối ưu SEO (Search Engine Optimization) cho dự án **DuBao MusicStream** (`https://dubaomusic.vercel.app`).

---

## 1. Các thành phần SEO đã được tích hợp

### 1.1 Thẻ Meta SEO & Open Graph (`frontend/index.html`)
- **Title**: `DuBao MusicStream - Nghe Nhạc Trực Tuyến Miễn Phí`
- **Meta Description**: Mô tả nội dung bài hát, nghe nhạc chất lượng cao, nhạc trẻ, EDM, playlist miễn phí.
- **Open Graph (FB/Zalo Card)**: Tối ưu ảnh xem trước (`og:image`), tiêu đề (`og:title`), và mô tả (`og:description`) khi chia sẻ link qua Facebook, Zalo, Telegram.
- **Canonical URL**: Định danh trang gốc `https://dubaomusic.vercel.app`.

### 1.2 Tệp điều hướng Robot & Sơ đồ trang web (`frontend/public/`)
- **`robots.txt`**: Cho phép tất cả các công cụ tìm kiếm (Googlebot, Bingbot...) cào dữ liệu và chỉ đường tới file Sitemap.
- **`sitemap.xml`**: Khai báo danh sách các trang chính (`/`, `/app`, `/login`) và tần suất cập nhật.

---

## 2. Bước 1: Push mã nguồn SEO mới nhất lên GitHub

Mở Terminal tại thư mục gốc dự án và chạy các lệnh:

```bash
git add .
git commit -m "Feat: Add SEO meta tags, robots.txt, and sitemap.xml"
git push origin main
```

---

## 3. Bước 2: Đăng ký lập chỉ mục Google Search Console (Google Index)

Để trang web xuất hiện trên Google khi người dùng gõ tìm kiếm, làm theo các bước sau:

1. Truy cập vào trang [Google Search Console](https://search.google.com/search-console).
2. Đăng nhập bằng tài khoản Gmail của bạn.
3. Chọn **Add Property** (Thêm trang web mới):
   - Chọn loại **URL prefix** (Tiền tố URL).
   - Nhập URL: `https://dubaomusic.vercel.app`
4. **Xác minh quyền sở hữu (Verification)**:
   - Cách dễ nhất: Chọn phương thức **HTML Tag**.
   - Copy thẻ `<meta name="google-site-verification" content="..." />` dán vào phần `<head>` trong file `frontend/index.html`, sau đó `git push` lại.
   - Bấm **Verify** trên Google Search Console.
5. **Gửi Sitemap cho Google**:
   - Ở menu bên trái Search Console, chọn **Sitemaps** (Sơ đồ trang web).
   - Nhập `sitemap.xml` vào ô và bấm **Submit** (Gửi).
   - Google sẽ quét và bắt đầu đưa trang web của bạn lên kết quả tìm kiếm sau vài ngày.

---

## 4. Bước 3: Kiểm tra hiển thị khi chia sẻ trên Zalo & Facebook

Để kiểm tra hiển thị hình ảnh xem trước khi gửi link:
- **Facebook Sharing Debugger**: Truy cập [developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug/), nhập `https://dubaomusic.vercel.app` và bấm **Fetch new scrape information**.
- **Zalo Developers Tool**: Nhập link vào tin nhắn Zalo để kiểm tra khung xem trước.
