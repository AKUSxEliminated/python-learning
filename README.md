# Python Learning Hub

Nền tảng tự học Python cá nhân với AI gia sư. Giáo trình hiện có 3 cấp độ, 12 chương và 25 bài học; người học có thể xem bài, đánh dấu hoàn thành và theo dõi tiến độ.

## Bắt đầu

Yêu cầu Node.js 20.9 trở lên và npm.

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Dùng `npm run typecheck`, `npm run lint` và `npm run build` để kiểm tra dự án.

Sao chép `.env.example` thành `.env.local` khi đã có thông tin Supabase hoặc AI. Không đưa khóa bí mật vào biến `NEXT_PUBLIC_*`.

## Giáo trình

Nội dung nguồn ở `src/features/curriculum/data/curriculum.json`. Tiến độ hiện lưu trong localStorage của trình duyệt và chưa đồng bộ theo tài khoản. Schema RLS cùng seed SQL cho Supabase nằm trong `supabase/`; xem `supabase/README.md` trước khi kết nối project.

Sau khi chỉnh giáo trình, tạo lại seed SQL bằng `npm run curriculum:seed:generate`.
