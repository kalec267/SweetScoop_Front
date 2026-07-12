<template>
  <div class="flex flex-col flex-1">
    <!-- 카테고리 탭 -->
    <div class="flex overflow-x-auto border-b border-gray-100 bg-gray-50 scrollbar-none">
      <button v-for="cat in store.categories" :key="cat.id" class="px-5 py-3 text-sm font-bold text-gray-500">
        {{ cat.name }}
      </button>
    </div>
    
    <!-- ⭐️ 이제 이 리스트는 무조건 DB에 적재된 진짜 데이터 기반으로 그려집니다! -->
    <div class="flex-1 p-4 grid grid-cols-2 gap-4 content-start overflow-y-auto">
      <button 
        v-for="size in store.sizeList" :key="size.id"
        @click="goToNextStep(size)"
        class="bg-white border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-between shadow-sm h-40"
      >
        <div class="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-2xl">🍦</div>
        <div class="text-center">
          <div class="font-bold text-gray-900 text-sm">{{ size.name }}</div>
          <div class="text-pink-500 font-extrabold text-sm mt-1">₩{{ size.price.toLocaleString() }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'; // ⭐️ 온마운트 생명주기 API 도입
import { useRouter } from 'vue-router'; 
import { useKioskStore } from '../stores/kiosk'; 

const router = useRouter();
const store = useKioskStore();

// ⭐️ 컴포넌트가 화면에 장착되는 순간 백엔드로 찔러서 실시간 DB 데이터를 긁어옵니다.
onMounted(() => {
  store.fetchInitialData();
});

const goToNextStep = (size) => {
  store.selectSize(size);
  router.push('/kiosk/options');
};
</script>