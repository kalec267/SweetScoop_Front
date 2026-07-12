<template>
  <div class="flex flex-col flex-1 justify-between">
    <!-- 상단 서브 탭 -->
    <div class="grid grid-cols-2 text-center font-bold border-b border-gray-100 flex-shrink-0">
      <div class="py-3 border-b-2 border-pink-500 text-pink-500 bg-pink-50/30">상품정보</div>
      <div class="py-3 text-gray-400 bg-gray-50/50">플레이버</div>
    </div>

    <!-- 본문 내용 -->
    <div class="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
      <div class="text-center">
        <div class="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">🍨</div>
        <h2 class="text-xl font-bold text-gray-900">{{ store.orderState.sizeName }}</h2>
        <p class="text-xs text-gray-400 mt-1">원하는 맛의 아이스크림을 {{ store.orderState.sizeName }}로 즐기세요!</p>
        <div class="text-red-500 font-bold text-xs mt-4 bg-red-50 py-1.5 px-4 rounded-full inline-block">
          ★★ 本 제품은 포장이 불가합니다 ★★
        </div>
      </div>

      <!-- [변경] 피그마 시안 스타일의 3열 용기 선택 및 개별 수량 카드 영역 -->
      <div class="grid grid-cols-3 gap-3 my-6">
        <div 
          v-for="type in ['컵', '콘', '와플콘']" :key="type"
          :class="[
            'border-2 rounded-2xl p-3 flex flex-col items-center justify-between transition-all min-h-[160px]',
            store.orderState.containerQuantities[type] > 0 ? 'border-pink-500 bg-pink-50/20' : 'border-gray-200 bg-white'
          ]"
        >
          <!-- 용기 이미지/이모지 영역 -->
          <div class="text-3xl my-1">
            {{ type === '컵' ? '🥛' : type === '콘' ? '📐' : '🧇' }}
          </div>
          
          <!-- 용기 텍스트 정보 -->
          <div class="text-center">
            <div :class="['font-bold text-xs', store.orderState.containerQuantities[type] > 0 ? 'text-pink-600' : 'text-gray-700']">
              {{ type }}(포장불가)
            </div>
          </div>

          <!-- 수량 핸들러 제어기 (카드 내부 배치) -->
          <div class="flex items-center space-x-2 mt-2 bg-gray-50 p-1 rounded-lg border border-gray-100 w-full justify-between">
            <button 
              @click="store.decreaseContainer(type)" 
              class="w-6 h-6 bg-white border rounded flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm hover:bg-gray-100 active:bg-gray-200"
            >
              -
            </button>
            <span class="font-extrabold text-xs text-gray-900">
              {{ store.orderState.containerQuantities[type] }}
            </span>
            <button 
              @click="store.increaseContainer(type)" 
              class="w-6 h-6 bg-white border rounded flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm hover:bg-gray-100 active:bg-gray-200"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- 하단 정보 가이드 안내 -->
      <div class="text-center text-xs text-gray-400">
        수량을 추가하시면 자동으로 해당 용기가 선택 설정됩니다.
      </div>
    </div>

    <!-- 하단 제어 단추바 -->
    <footer class="p-4 bg-gray-50 border-t grid grid-cols-2 gap-3 flex-shrink-0">
      <button @click="router.push('/kiosk/sizes')" class="py-3.5 border border-gray-300 rounded-xl font-bold text-gray-600 bg-white hover:bg-gray-50">
        ＜ 이전
      </button>
      <button 
        @click="goToFlavorPage"
        :disabled="store.totalQuantity === 0"
        :class="[
          'py-3.5 rounded-xl font-bold text-white shadow-md transition-all',
          store.totalQuantity > 0 ? 'bg-pink-500 hover:bg-pink-600' : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
        ]"
      >
        플레이버(맛) 선택
      </button>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useKioskStore } from '../stores/kiosk';

const router = useRouter();
const store = useKioskStore();

const goToFlavorPage = () => {
  if (store.totalQuantity > 0) {
    router.push('/kiosk/flavors');
  }
};
</script>