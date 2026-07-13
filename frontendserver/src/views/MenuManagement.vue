<template>
    <div class="menu-management-container">
      <div class="page-header">
        <div>
          <h2>본사 맛(메뉴) 관리</h2>
          <p class="subtitle">키오스크에 노출될 아이스크림 맛 및 메뉴를 추가·수정·삭제합니다.</p>
        </div>
        <button class="btn-primary" @click="openCreateModal">＋ 신규 맛 등록</button>
      </div>
  
      <!-- 메뉴 리스트 테이블 -->
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>메뉴 ID</th>
              <th>카테고리</th>
              <th>물류 연동 아이템</th>
              <th>메뉴/맛 이름</th>
              <th>이미지 미리보기</th>
              <th>관리 액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="menu in menuList" :key="menu.id">
              <td>#MENU-{{ menu.id }}</td>
              <td><span class="category-tag">{{ menu.categoryName }}</span></td>
              <td>{{ menu.itemName }}</td>
              <td class="menu-name">{{ menu.name }}</td>
              <td>
                <img :src="menu.menuImg" alt="메뉴 이미지" class="menu-thumb" v-if="menu.menuImg" />
                <span v-else class="text-muted">이미지 없음</span>
              </td>
              <td>
                <div class="btn-group">
                  <button class="btn-edit" @click="openEditModal(menu)">수정</button>
                  <button class="btn-price" @click="openPriceModal(menu)">가격변경</button>
                  <button class="btn-delete" @click="handleDeleteMenu(menu.id)">삭제</button>
                </div>
              </td>
            </tr>
            <tr v-if="menuList.length === 0">
              <td colspan="6" class="text-center">등록된 메뉴가 없습니다. 백엔드 데이터를 확인하세요.</td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- 1. 등록 / 수정 팝업 모달 -->
      <div v-if="isModalOpen" class="modal-overlay">
        <div class="modal-content">
          <h3>{{ isEditMode ? '맛 정보 수정' : '신규 맛 등록' }}</h3>
          
          <div class="form-group">
            <label>카테고리 선택</label>
            <select v-model="menuForm.categoryId">
              <option :value="1">아이스크림</option>
              <option :value="2">아이스모찌</option>
              <option :value="3">음료</option>
            </select>
          </div>
  
          <div class="form-group">
            <label>물류 원자재(ITEM) ID 연동</label>
            <input type="number" v-model="menuForm.itemId" placeholder="연동할 물류 ID 입력" />
          </div>
  
          <div class="form-group">
            <label>메뉴/맛 이름</label>
            <input type="text" v-model="menuForm.name" placeholder="예: 엄마는 외계인" />
          </div>
  
          <div class="form-group">
            <label>메뉴 이미지 URL</label>
            <input type="text" v-model="menuForm.menuImg" placeholder="이미지 주소 URL 입력" />
          </div>
  
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModal">취소</button>
            <button class="btn-primary" @click="submitMenuForm">저장</button>
          </div>
        </div>
      </div>
  
      <!-- 2. 가격 변경 전용 팝업 모달 -->
      <div v-if="isPriceModalOpen" class="modal-overlay">
        <div class="modal-content">
          <h3>[{{ targetMenu.name }}] 사이즈별 가격 변경</h3>
          <p class="modal-subtitle">변경할 스펙 규격(SIZE)의 가격을 입력하세요.</p>
          
          <div class="form-group">
            <label>사이즈 규격 선택 (SIZE ID)</label>
            <select v-model="priceForm.sizeId">
              <option :value="1">싱글 레귤러 (ID: 1)</option>
              <option :value="6">파인트 (ID: 6)</option>
              <option :value="7">쿼터 (ID: 7)</option>
            </select>
          </div>
  
          <div class="form-group">
            <label>변경할 가격 (원)</label>
            <input type="number" v-model="priceForm.price" placeholder="금액 입력" />
          </div>
  
          <div class="modal-actions">
            <button class="btn-secondary" @click="closePriceModal">취소</button>
            <button class="btn-primary" @click="submitPriceUpdate">가격 적용</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { getAdminMenus, createAdminMenu, updateAdminMenu, updateSizePrice, deleteAdminMenu } from '../api/menu';
  
  // 상태 관리 정의
  const menuList = ref([]);
  const isModalOpen = ref(false);
  const isPriceModalOpen = ref(false);
  const isEditMode = ref(false);
  const selectedMenuId = ref(null);
  const targetMenu = ref({});
  
  // 폼 데이터 바인딩 객체
  const menuForm = ref({ categoryId: 1, itemId: 1, name: '', menuImg: '' });
  const priceForm = ref({ sizeId: 1, price: 0 });
  
  // 1. 맛 목록 조회 연동 (GET)
  const fetchMenus = async () => {
    try {
      const data = await getAdminMenus();
      menuList.value = data;
    } catch (err) {
      console.error("메뉴 로드 실패, 임시 데이터를 표시합니다.");
      // 백엔드 연결 확인용 Mock 데이터 폴백
      menuList.value = [
        { id: 1, categoryName: '아이스크림', itemName: '엄마는 외계인 튜브', name: '엄마는 외계인', menuImg: 'https://www.baskinrobbins.co.kr/upload/product/main/91c8668227bcf556c43a968b97e342e6.png' },
        { id: 2, categoryName: '아이스크림', itemName: '아몬드 봉봉 튜브', name: '아몬드 봉봉', menuImg: 'https://www.baskinrobbins.co.kr/upload/product/main/e7cb5667c3147ddb0b31e28d1f365980.png' }
      ];
    }
  };
  
  // 2. 맛 등록 및 수정 분기 처리 (POST / PUT)
  const submitMenuForm = async () => {
    try {
      if (isEditMode.value) {
        await updateAdminMenu(selectedMenuId.value, menuForm.value);
        alert("맛 정보가 성공적으로 수정되었습니다.");
      } else {
        await createAdminMenu(menuForm.value);
        alert("신규 맛이 성공적으로 등록되었습니다.");
      }
      closeModal();
      fetchMenus();
    } catch (err) {
      alert("처리 중 에러가 발생했습니다.");
    }
  };
  
  // 3. 가격 변경 처리 (PATCH)
  const submitPriceUpdate = async () => {
    try {
      await updateSizePrice(priceForm.value.sizeId, { price: priceForm.value.price });
      alert("선택 스펙의 가격이 성공적으로 변경되었습니다.");
      closePriceModal();
    } catch (err) {
      alert("가격 변경 실패");
    }
  };
  
  // 4. 맛 삭제 처리 (DELETE)
  const handleDeleteMenu = async (id) => {
    if (!confirm("정말 이 메뉴를 삭제하시겠습니까? 관련 데이터에 영향을 줄 수 있습니다.")) return;
    try {
      await deleteAdminMenu(id);
      alert("메뉴가 성공적으로 삭제되었습니다.");
      fetchMenus();
    } catch (err) {
      alert("삭제 실패");
    }
  };
  
  // 모달 창 제어 유틸리티 함수들
  const openCreateModal = () => {
    isEditMode.value = false;
    menuForm.value = { categoryId: 1, itemId: 1, name: '', menuImg: '' };
    isModalOpen.value = true;
  };
  
  const openEditModal = (menu) => {
    isEditMode.value = true;
    selectedMenuId.value = menu.id;
    menuForm.value = { categoryId: 1, itemId: 1, name: menu.name, menuImg: menu.menuImg };
    isModalOpen.value = true;
  };
  
  const closeModal = () => isModalOpen.value = false;
  
  const openPriceModal = (menu) => {
    targetMenu.value = menu;
    priceForm.value = { sizeId: 1, price: 0 };
    isPriceModalOpen.value = true;
  };
  
  const closePriceModal = () => isPriceModalOpen.value = false;
  
  onMounted(fetchMenus);
  </script>
  
  <style scoped>
  /* 맛 관리 전용 스타일 스펙 */
  .menu-management-container { padding: 20px; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
  .table-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f8fafc; padding: 12px; font-size: 13px; color: #64748b; text-align: left; border-bottom: 1px solid #edf2f7; }
  td { padding: 14px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .menu-name { font-weight: 600; color: #1e293b; }
  .menu-thumb { width: 50px; height: 50px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0; }
  .category-tag { background: #f5f3ff; color: #6f42c1; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  .btn-group { display: flex; gap: 6px; }
  .btn-edit { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .btn-price { background: #fefce8; color: #d97706; border: 1px solid #fef08a; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .btn-delete { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .btn-primary { background: #6f42c1; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
  .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 8px; cursor: pointer; }
  /* 모달 레이아웃 */
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999; }
  .modal-content { background: white; padding: 24px; border-radius: 12px; width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .form-group label { font-size: 13px; font-weight: 600; color: #475569; }
  .form-group input, .form-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  </style>