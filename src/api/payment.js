import axios from 'axios';

// 백엔드 주소 설정 (포트 8888)
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const paymentApi = {
  // 백엔드 PaymentRequestDTO 스펙과 동일하게 파라미터 전달
  approvePayment(paymentData) {
    return api.post('/payments/approve', {
      orderId: paymentData.orderId,
      couponId: paymentData.couponId || null,
      method: paymentData.method,
      amount: paymentData.amount,
      cardCompany: paymentData.cardCompany || 'MOCK_CARD'
    });
  }
};

// 기존 코드 하단에 추가 개발
export const orderApi = {
    createOrder(orderData) {
      return api.post('/orders', {
        totalPrice: orderData.totalPrice,
        itemNames: orderData.itemNames
      });
    }
  };