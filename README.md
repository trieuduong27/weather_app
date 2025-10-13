# 🌤️ Weather App - Ứng dụng Dự báo Thời tiết

Ứng dụng xem thời tiết hiện đại với đầy đủ tính năng, giao diện đẹp mắt và responsive trên mọi thiết bị.

## ✨ Tính năng

### 🎯 Tính năng chính
- **Tìm kiếm thành phố** - Tìm kiếm thời tiết bất kỳ thành phố nào trên thế giới
- **Geolocation** - Tự động phát hiện vị trí hiện tại của bạn
- **Dự báo 5 ngày** - Xem dự báo thời tiết cho 5 ngày tới
- **Thông tin chi tiết** - Nhiệt độ cảm giác, độ ẩm, gió, áp suất, tầm nhìn, mặt trời mọc/lặn

### 🎨 Giao diện & UX
- **Dark/Light Mode** - Chuyển đổi giữa chế độ sáng và tối
- **Responsive Design** - Hoạt động mượt mà trên desktop, tablet và mobile
- **Animations** - Hiệu ứng chuyển động mượt mà và chuyên nghiệp
- **Toast Notifications** - Thông báo trực quan cho mọi hành động

### 🔍 Tìm kiếm thông minh
- **Autocomplete** - Gợi ý thành phố phổ biến khi gõ
- **Search History** - Lưu lịch sử 5 tìm kiếm gần nhất
- **Enter key support** - Nhấn Enter để tìm kiếm nhanh
- **Popular cities** - Danh sách thành phố phổ biến Việt Nam

### 📍 Quản lý địa điểm
- **Lưu địa điểm** - Lưu các thành phố yêu thích
- **Xem nhanh** - Xem thời tiết tất cả địa điểm đã lưu
- **Xóa địa điểm** - Quản lý danh sách dễ dàng

## 🚀 Cách sử dụng

1. **Mở file `index.html`** trong trình duyệt
2. **Cho phép truy cập vị trí** (nếu muốn xem thời tiết vị trí hiện tại)
3. **Tìm kiếm thành phố** bằng cách gõ vào ô tìm kiếm
4. **Lưu địa điểm** yêu thích bằng nút "+" ở phần "Địa điểm đã lưu"
5. **Chuyển đổi theme** bằng nút ở góc trên bên phải

## 🛠️ Công nghệ sử dụng

- **HTML5** - Cấu trúc semantic và accessible
- **CSS3** - Flexbox, Grid, Animations, CSS Variables
- **JavaScript (ES6+)** - Async/Await, Fetch API, LocalStorage
- **OpenWeatherMap API** - Dữ liệu thời tiết real-time
- **Moment.js** - Xử lý thời gian
- **Font Awesome** - Icons đẹp mắt
- **Google Fonts** - Typography chuyên nghiệp

## 📱 Responsive Breakpoints

- **Desktop**: > 768px
- **Tablet**: 481px - 768px  
- **Mobile**: < 480px

## 🔐 Bảo mật

**Lưu ý quan trọng**: API key hiện đang được hardcode trong file `index.js`. Trong môi trường production, bạn nên:

1. Tạo file `.env` để lưu API key
2. Sử dụng backend proxy để ẩn API key
3. Giới hạn domain được phép sử dụng API key

## 🎯 Các cải tiến đã thực hiện

### ✅ Đã sửa
- Lỗi HTML structure (thẻ div đóng sai)
- Duplicate functions (fetchWeatherByCoords, fetchWeatherByCity)
- Thiếu error handling

### ✅ Đã thêm
- Toast notification system
- Dark/light mode với localStorage
- Search autocomplete & history
- 5-day weather forecast
- Saved locations management
- Feels like temperature
- Pressure & visibility data
- Responsive design (mobile/tablet)
- Smooth animations & transitions
- Accessibility improvements (aria-labels)
- Enter key support cho search
- Loading states
- Error handling toàn diện

## 📝 Cấu trúc thư mục

```
weather_app/
├── index.html          # File HTML chính
├── index.css           # Styles với responsive & animations
├── README.md           # Tài liệu này
└── js/
    ├── index.js        # Logic chính của app
    ├── moment.js       # Thư viện xử lý thời gian
    └── all.min.js      # Font Awesome icons
```

## 🌟 Tính năng nổi bật

### 1. Smart Search
- Gợi ý thành phố khi gõ
- Lưu lịch sử tìm kiếm
- Xóa từng item trong lịch sử

### 2. Weather Details
- Nhiệt độ thực tế & cảm giác
- Mặt trời mọc/lặn
- Độ ẩm không khí
- Tốc độ gió (km/h)
- Áp suất khí quyển (hPa)
- Tầm nhìn (km)

### 3. Forecast
- Dự báo 5 ngày
- Icon thời tiết trực quan
- Mô tả chi tiết
- Scroll ngang trên mobile

### 4. Saved Locations
- Lưu không giới hạn địa điểm
- Hiển thị thời tiết real-time
- Click để xem chi tiết
- Xóa dễ dàng

## 🎨 Theme Colors

### Light Mode
- Primary: `#2193b0` → `#6dd5ed`
- Background: `#f5f7fa`

### Dark Mode  
- Primary: `#0f2027` → `#203a43` → `#2c5364`
- Background: `#1a1a2e`

## 📞 API Reference

App sử dụng OpenWeatherMap API:
- **Current Weather**: `/data/2.5/weather`
- **5 Day Forecast**: `/data/2.5/forecast`
- **Units**: Metric (°C, km/h)
- **Language**: Vietnamese (vi)

## 🐛 Known Issues

Không có lỗi đã biết. Nếu phát hiện bug, vui lòng báo cáo!

## 📄 License

Free to use for personal and educational purposes.

## 👨‍💻 Author

Created with ❤️ by Duong
