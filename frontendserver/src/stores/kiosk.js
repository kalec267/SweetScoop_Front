import { defineStore } from 'pinia';
import axios from 'axios';

export const useKioskStore = defineStore('kiosk', {
  state: () => ({
    categories: [
      { id: 1, name: '아이스크림' },
      { id: 2, name: '커피' },
      { id: 3, name: '음료' }
    ],
    sizeList: [],  // ❌ 임시 데이터 삭제 -> ⭕ DB에서 받아올 공간
    flavorList: [], // ❌ 임시 데이터 삭제 -> ⭕ DB에서 받아올 공간
    
    orderState: {
      sizeId: null,
      sizeName: '',
      basePrice: 0,
      maxFlavorCount: 0,
      containerQuantities: { '컵': 0, '콘': 0, '와플콘': 0 },
      selectedContainer: '', 
      selectedFlavors: []
    }
  }),
  
  actions: {
    // ⭐️ [신규] 백엔드 DB로부터 초기 세팅 정보를 긁어오는 마법의 함수
    async fetchInitialData() {
      try {
        // 1. Spring Boot 서버로부터 DB의 사이즈 리스트 가져오기
        const sizeResponse = await axios.get('http://localhost:8888/api/kiosk/data/sizes');
        this.sizeList = sizeResponse.data;

        // 2. 플레이버 리스트 가져오기 (백엔드 API가 완성되면 주석을 푸세요)
        // const flavorResponse = await axios.get('http://localhost:8888/api/kiosk/data/flavors');
        // this.flavorList = flavorResponse.data;
        
        // 임시 방편: 백엔드 맛 API 연동 전까지는 아래 더미를 유지하거나 DB 연동 후 대체
        if(this.flavorList.length === 0) {
          this.flavorList = [
            { id: 1, name: '엄마는 외계인' },
            { id: 2, name: '아몬드 봉봉' },
            { id: 3, name: '민트 초콜릿 칩' }
          ];
        }
      } catch (error) {
        console.error("DB 기준 정보 로드 실패:", error);
      }
    },

    selectSize(size) {
      this.orderState.sizeId = size.id;
      this.orderState.sizeName = size.name;
      this.orderState.basePrice = size.price;
      this.orderState.maxFlavorCount = size.flavor_cnt; // DB의 flavor_cnt 컬럼과 매핑됨
      
      this.orderState.containerQuantities = { '컵': 1, '콘': 0, '와플콘': 0 };
      this.orderState.selectedContainer = '컵';
      this.orderState.selectedFlavors = [];
    },
    
    toggleFlavor(flavor) {
      const index = this.orderState.selectedFlavors.findIndex(f => f.id === flavor.id);
      if (index !== -1) {
        this.orderState.selectedFlavors.splice(index, 1);
      } else {
        if (this.orderState.selectedFlavors.length >= this.orderState.maxFlavorCount) {
          alert(`최대 ${this.orderState.maxFlavorCount}가지 맛만 선택 가능합니다.`);
          return;
        }
        this.orderState.selectedFlavors.push({ id: flavor.id, name: flavor.name });
      }
    },
    
    increaseContainer(type) { this.orderState.containerQuantities[type]++; },
    decreaseContainer(type) { /* 이전 코드와 동일 */ },
    resetOrder() { /* 이전 코드와 동일 */ }
  },
  getters: {
    totalQuantity: (state) => Object.values(state.orderState.containerQuantities).reduce((a, b) => a + b, 0)
  }
});