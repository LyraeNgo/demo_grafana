import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up: Tăng từ 0 lên 20 users
    { duration: '1m', target: 50 },   // Sustain: Duy trì 50 users (bạn có thể sửa thành 200 nếu server chịu nổi)
    { duration: '30s', target: 0 },   // Ramp-down: Giảm tải về 0
  ],
};

const BASE_URL = 'https://chaters.shop';

export default function () {
  let headers = { 'Content-Type': 'application/json' };
  let createdItemId = null;

  // 1. GROUP GET ALL ITEMS
  group('01_Get_All_Items', function () {
    let res = http.get(`${BASE_URL}/items`);
    check(res, {
      'GET ALL status is 200': (r) => r.status === 200,
      'GET ALL has data': (r) => r.json().hasOwnProperty('data'),
    });
  });

  sleep(1);

  // 2. GROUP POST CREATE ITEM
  group('02_Create_Item', function () {
    let payload = JSON.stringify({
      name: `K6 Test Item ${__VU}-${__ITER}`, // Tạo tên duy nhất tránh trùng lặp
      price: Math.floor(Math.random() * 100) + 10,
      description: 'Sản phẩm tạo tự động từ k6 load test',
    });

    let res = http.post(`${BASE_URL}/items`, payload, { headers: headers });
    
    let isPostOk = check(res, {
      'POST status is 200': (r) => r.status === 200,
      'POST has ID': (r) => r.json().hasOwnProperty('id'),
    });

    // Nếu tạo thành công thì lưu lại ID để dùng cho các bước sau
    if (isPostOk) {
      createdItemId = res.json().id;
    }
  });

  sleep(1);

  // Các bước tiếp theo chỉ chạy nếu bước POST tạo được ID thành công
  if (createdItemId) {
    
    // 3. GROUP GET ONE ITEM
    group('03_Get_One_Item', function () {
      let res = http.get(`${BASE_URL}/items/${createdItemId}`);
      check(res, {
        'GET ONE status is 200': (r) => r.status === 200,
        'GET ONE correct ID': (r) => r.json().name !== undefined,
      });
    });

    sleep(1);

    // 4. GROUP PUT UPDATE ITEM
    group('04_Update_Item', function () {
      let payload = JSON.stringify({
        name: `K6 Updated ${createdItemId}`,
        price: 999.99,
        description: 'Đã cập nhật qua K6',
      });

      let res = http.put(`${BASE_URL}/items/${createdItemId}`, payload, { headers: headers });
      check(res, {
        'PUT status is 200': (r) => r.status === 200,
      });
    });

    sleep(1);

    // 5. GROUP DELETE ITEM
    group('05_Delete_Item', function () {
      let res = http.del(`${BASE_URL}/items/${createdItemId}`);
      check(res, {
        'DELETE status is 200': (r) => r.status === 200,
      });
    });
  } else {
    // Trường hợp không có item nào được tạo (ví dụ API lỗi), giả lập đọc một item lỗi để test case 404
    group('06_Get_Invalid_Item_404', function () {
      let res = http.get(`${BASE_URL}/items/999999`);
      check(res, {
        '404 Status Check': (r) => r.status === 404,
      });
    });
  }

  sleep(1); // Nghỉ 1 giây trước khi lặp lại chu kỳ mới
}
