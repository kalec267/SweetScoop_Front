<template>
  <div class="kiosk-container">
    <header class="kiosk-header">
      <h1>🍦 Sweet Scoop Kiosk</h1>
      <p>원하시는 아이스크림을 선택해 주세요</p>
    </header>

    <div class="menu-grid">
      <div v-for="item in menuList" :key="item.id" class="menu-item" @click="addToCart(item)">
        <div class="menu-emoji">{{ item.emoji }}</div>
        <div class="menu-name">{{ item.name }}</div>
        <div class="menu-price">{{ item.price.toLocaleString() }}원</div>
      </div>
    </div>

    <div class="cart-section">
      <div class="cart-title">🛒 담은 상품 목록</div>
      <div v-if="cart.length === 0" class="empty-cart">선택한 상품이 없습니다.</div>
      <div v-else class="cart-list">
        <div v-for="(cartItem, index) in cart" :key="index" class="cart-row">
          <span>{{ cartItem.name }}</span>
          <div class="cart-ctrl">
            <span>{{ cartItem.price.toLocaleString() }}원</span>
            <button @click.stop="removeFromCart(index)" class="btn-del">❌</button>
          </div>
        </div>
      </div>

      <div class="cart-summary">
        <span class="total-label">총 결제 금액:</span>
        <span class="total-amount">{{ totalCartPrice.toLocaleString() }}원</span>
      </div>

      <button :disabled="cart.length === 0" class="btn-pay-submit" @click="submitOrderToBackend">
        💳 주문하기 (결제화면 이동)
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const menuList = ref([
  { id: 1, name: '바닐라 클래식', price: 4500, emoji: '🍦' },
  { id: 2, name: '리얼 초콜릿', price: 5000, emoji: '🍫' },
  { id: 3, name: '스트로베리 딜라이트', price: 5000, emoji: '🍓' },
  { id: 4, name: '애플민트 스파크', price: 5500, emoji: '🌿' }
]);

const cart = ref([]);
const totalCartPrice = computed(() => cart.value.reduce((sum, item) => sum + item.price, 0));

const addToCart = (item) => cart.value.push(item);
const removeFromCart = (index) => cart.value.splice(index, 1);

// 백엔드 ORDERS 테이블에 '결제대기' 로우 우선 생성 프로세스
const submitOrderToBackend = async () => {
  try {
    const response = await axios.post('http://localhost:8888/api/orders', {
      totalPrice: totalCartPrice.value,
      orderType: '매장'
    });

    if (response.data.success) {
      // 발급받은 실 DB 주문번호를 다음 라우터 컴포넌트로 전달하면서 이동
      router.push({
        name: 'Payment',
        state: { orderId: response.data.orderId, amount: totalCartPrice.value }
      });
    }
  } catch (error) {
    alert('주문서 생성에 실패했습니다.');
  }
};
</script>

<style scoped>
.kiosk-container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif; padding-bottom: 260px; }
.kiosk-header { text-align: center; margin-bottom: 30px; }
.menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
.menu-item { border: 1px solid #e5e8eb; border-radius: 20px; padding: 20px; text-align: center; cursor: pointer; transition: transform 0.2s; }
.menu-item:hover { transform: scale(1.02); background: #fafafa; }
.menu-emoji { font-size: 40px; margin-bottom: 10px; }
.menu-name { font-size: 18px; font-weight: bold; }
.menu-price { font-size: 16px; color: #3182f6; font-weight: bold; margin-top: 5px; }
.cart-section { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 600px; background: white; box-shadow: 0px -10px 30px rgba(0,0,0,0.1); border-top-left-radius: 24px; border-top-right-radius: 24px; padding: 20px; box-sizing: border-box; }
.cart-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
.empty-cart { text-align: center; color: #b0b8c1; padding: 20px 0; }
.cart-list { max-height: 90px; overflow-y: auto; margin-bottom: 15px; }
.cart-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #f2f3f5; }
.cart-ctrl { display: flex; gap: 10px; align-items: center; }
.btn-del { border: none; background: none; cursor: pointer; }
.cart-summary { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 18px; font-weight: bold; }
.total-amount { color: #3182f6; }
.btn-pay-submit { width: 100%; padding: 16px; border: none; border-radius: 16px; background: #3182f6; color: white; font-size: 18px; font-weight: bold; cursor: pointer; }
.btn-pay-submit:disabled { background: #e5e8eb; color: #b0b8c1; cursor: not-allowed; }
</style>