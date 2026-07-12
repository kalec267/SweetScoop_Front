<template>
  <div class="flex flex-col flex-1 justify-between overflow-hidden">
    <div class="grid grid-cols-2 text-center font-bold border-b border-gray-100 flex-shrink-0">
      <div class="py-3 text-gray-400 bg-gray-50/50">상품정보</div>
      <div class="py-3 border-b-2 border-pink-500 text-pink-500 bg-pink-50/30">플레이버</div>
    </div>

    <div class="flex-1 p-4 overflow-y-auto grid grid-cols-3 gap-3 content-start">
      <button 
        v-for="flavor in store.flavorList" :key="flavor.id"
        @click="store.toggleFlavor(flavor)"
        class="relative bg-white border border-gray-100 rounded-xl p-2 flex flex-col items-center justify-between aspect-square"
      >
        <div v-if="getSelectionIndex(flavor.id) !== -1" class="absolute top-1.5 right-1.5 w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-black">
          {{ getSelectionIndex(flavor.id) + 1 }}
        </div>
        <div class="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-xl">🟢</div>
        <div class="text-center text-[11px] font-bold text-gray-800 break-keep">{{ flavor.name }}</div>
      </button>
    </div>

    <div class="bg-gray-900 text-white p-4 flex-shrink-0">
      <div class="text-xs font-semibold text-pink-400 mb-2">선택 현황 ({{ store.orderState.selectedFlavors.length }} / {{ store.orderState.maxFlavorCount }})</div>
      <div class="flex space-x-3 justify-center py-2 bg-gray-800 rounded-xl">
        <div v-for="i in store.orderState.maxFlavorCount" :key="i" class="w-10 h-10 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center text-xs relative font-bold bg-gray-700/30">
          <span v-if="store.orderState.selectedFlavors[i-1]" class="text-lg">🟢</span>
          <span v-else class="text-gray-500">{{ i }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-4">
        <button @click="router.push('/kiosk/options')" class="py-3.5 border border-gray-700 rounded-xl font-bold text-gray-400 bg-gray-800">＜ 이전</button>
        <button 
          @click="submitOrder"
          :disabled="store.orderState.selectedFlavors.length < store.orderState.maxFlavorCount"
          :class="['py-3.5 rounded-xl font-bold text-white shadow-md', store.orderState.selectedFlavors.length === store.orderState.maxFlavorCount ? 'bg-pink-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed']"
        >
          장바구니 담기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useKioskStore } from '../stores/kiosk';
import axios from 'axios';

const router = useRouter();
const store = useKioskStore();

const getSelectionIndex = (flavorId) => store.orderState.selectedFlavors.findIndex(f => f.id === flavorId);

const submitOrder = async () => {
  try {
    // 컵 매핑용 테이블 매칭 테이블 설계 (DB 테이블에 저장된 실제 CUP ID 번호를 지정해 줍니다)
    const cupMap = { '컵': 1, '콘': 2, '와플콘': 3 };

    // JPA가 한 번에 싹 파싱할 수 있게 객체 뼈대를 구축합니다.
    const orderPayload = {
      branchId: 1,  
      kioskId: 1,  
      orderType: "매장", 
      items: Object.entries(store.orderState.containerQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([typeName, qty]) => ({
          sizeId: store.orderState.sizeId,
          cupId: cupMap[typeName], // '컵' 문자열을 실제 CUP 테이블의 FK ID인 1로 변환
          quantity: qty,
          menuIds: store.orderState.selectedFlavors.map(f => f.id) // ["엄마는 외계인"] 문자열 대신 고유 MENU ID인 [1, 2] 전송
        }))
    };

    // 진짜 스프링 부트 서버의 엔드포인트로 전송!
    const response = await axios.post('http://localhost:8888/api/kiosk/orders', orderPayload);
    
    // 백엔드 KioskOrderResponse의 message 출력 ("주문이 안전하게 처리되었습니다.")
    alert(response.data.message); 
    
    store.resetOrder();
    router.push('/kiosk/sizes');
  } catch (error) {
    console.error("최종 주문 실패:", error);
    alert("서버 전송 중 에러가 발생했습니다.");
  }
};
</script>