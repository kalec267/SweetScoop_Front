<template>
  <div class="menu-management-container">
    <div class="page-header">
      <div>
        <h2>본사 맛(메뉴) 관리</h2>
        <p class="subtitle">키오스크에 노출될 아이스크림 맛 및 메뉴를 추가·수정·삭제합니다.</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">＋ 신규 맛 등록</button>
    </div>

    <!-- 카테고리 필터 탭 영역 -->
    <div class="category-filter-bar">
      <button 
        v-for="cat in categoryOptions" 
        :key="cat.id" 
        :class="['filter-btn', { active: selectedCategory === cat.id }]"
        @click="changeCategory(cat.id)"
      >
        {{ cat.name }}
      </button>
    </div>
  
    <!-- 메뉴 리스트 테이블 -->
    <div class="table-wrapper">
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
          <tr v-for="menu in paginatedMenus" :key="menu.id">
            <td>#MENU-{{ menu.id }}</td>
            <td><span class="category-tag">{{ getCategoryName(menu.categoryId) }}</span></td>
            <td class="item-id-cell"> 물류 ID: {{ menu.itemId || menu.item_id || menu.item_Id || '미연동' }}</td>
            <td class="menu-name">{{ menu.name }}</td>
            <td>
              <img :src="menu.menuImg" alt="메뉴 이미지" class="menu-thumb" v-if="menu.menuImg" />
              <span v-else class="no-img">이미지 없음</span>
            </td>
            <td>
              <div class="btn-group">
                <button class="btn-edit" @click="openEditModal(menu)">수정</button>

                <!-- 아이스크림(categoryId === 1)이 아닐 때만 가격변경 버튼 노출 -->
                <button 
                  v-if="Number(menu.categoryId) !== 1" 
                  class="btn-price" 
                  @click="openPriceModal(menu)"
                >
                  가격변경
                </button>

                <button class="btn-delete" @click="handleDelete(menu.id)">삭제</button>
              </div>
            </td>
          </tr>
          
          <tr v-if="paginatedMenus.length === 0">
            <td colspan="6" class="text-center py-5 text-muted">해당 카테고리에 등록된 메뉴가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 하단 페이지네이션 컴포넌트 -->
    <div class="pagination-container" v-if="filteredMenus.length > 0">
      <div class="pagination-info">
        전체 {{ filteredMenus.length }}개 항목 중 
        {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredMenus.length) }} 표시
      </div>
      <div class="pagination-pages">
        <button class="btn-page-nav" @click="setPage(currentPage - 1)" :disabled="currentPage === 1">&lt;</button>
        
        <button 
          v-for="page in totalPages" 
          :key="page" 
          class="btn-page"
          :class="{ active: currentPage === page }" 
          @click="setPage(page)"
        >
          {{ page }}
        </button>

        <button class="btn-page-nav" @click="setPage(currentPage + 1)" :disabled="currentPage === totalPages">&gt;</button>
      </div>
    </div>
  
    <!-- 1. 등록 / 수정 팝업 모달 -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ isEditMode ? '맛/메뉴 정보 수정' : '신규 맛/메뉴 등록' }}</h3>
        
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

        <!-- 💡 핵심 추가: 아이스크림(categoryId === 1)이 아닐 때만 가격 입력 필드 노출 -->
        <div class="form-group" v-if="Number(menuForm.categoryId) !== 1">
          <label>메뉴 단가 (원)</label>
          <input type="number" v-model.number="menuForm.price" placeholder="판매 가격 입력 (예: 3500)" />
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
  
    <!-- 2. 가격 변경 전용 팝업 모달 (아이스모찌, 음료 전용) -->
    <div v-if="isPriceModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h3>[{{ targetMenu.name }}] 가격 변경</h3>
        <p class="modal-subtitle">변경할 메뉴의 단가를 입력하세요.</p>
        
        <div class="form-group">
          <label>변경할 가격 (원)</label>
          <input type="number" v-model.number="priceForm.price" placeholder="금액 입력" />
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
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { createAdminMenu, updateAdminMenu, updateSizePrice, deleteAdminMenu } from '../api/menu';
  
// 상태 관리 정의
const isModalOpen = ref(false);
const isPriceModalOpen = ref(false);
const isEditMode = ref(false);
const selectedMenuId = ref(null);
const targetMenu = ref({});
  
// 카테고리 필터 관련 상태값 (ALL: 전체)
const selectedCategory = ref(1);
const categoryOptions = [
  { id: 1, name: '아이스크림' },
  { id: 2, name: '아이스모찌' },
  { id: 3, name: '음료' }
];

// 폼 데이터 바인딩 객체 (price 기본값 추가)
const menuForm = ref({ categoryId: 1, itemId: 1, name: '', price: 0, menuImg: '' });
const priceForm = ref({ sizeId: 1, price: 0 });
  
// 1. 맛 목록 조회 연동 (GET)
const menus = ref([]); 

// 페이징 관련 상태값
const currentPage = ref(1);
const itemsPerPage = 5;

// [카테고리 필터링된 메뉴 목록]
const filteredMenus = computed(() => {
  if (selectedCategory.value === 'ALL') {
    return menus.value;
  }
  return menus.value.filter(m => Number(m.categoryId) === Number(selectedCategory.value));
});

// [페이징 가공]
const paginatedMenus = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredMenus.value.slice(start, end);
});

// [전체 페이지 수 계산]
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredMenus.value.length / itemsPerPage));
});

// [카테고리 변경 핸들러]
const changeCategory = (catId) => {
  selectedCategory.value = catId;
  currentPage.value = 1;
};

// [페이지 전환 핸들러]
const setPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const fetchMenus = async () => {
  try {
    const res = await axios.get('/api/admin/menus');
    menus.value = res.data;
  } catch (error) {
    console.error("메뉴 로드 실패");
  }
};
  
// 2. 맛/메뉴 등록 및 수정 분기 처리
const submitMenuForm = async () => {
  try {
    // 아이스크림일 경우 가격을 0으로 초기화하여 백엔드에 전송
    const payload = { ...menuForm.value };
    if (Number(payload.categoryId) === 1) {
      delete payload.price; // 또는 payload.price = 0;
    }

    if (isEditMode.value) {
      await updateAdminMenu(selectedMenuId.value, payload);
      alert("맛/메뉴 정보가 성공적으로 수정되었습니다.");
    } else {
      await createAdminMenu(payload);
      alert("신규 맛/메뉴가 성공적으로 등록되었습니다.");
    }
    closeModal();
    fetchMenus();
    currentPage.value = 1;
  } catch (err) {
    alert("처리 중 에러가 발생했습니다.");
  }
};
  
// 3. 가격 변경 처리
const submitPriceUpdate = async () => {
  try {
    await updateSizePrice(targetMenu.value.id, { 
      price: Number(priceForm.value.price) 
    });
    
    alert("가격이 성공적으로 변경되었습니다.");
    closePriceModal();
    fetchMenus();
  } catch (err) {
    alert("가격 변경 실패");
  }
};
  
// 4. 맛/메뉴 삭제 처리
const handleDelete = async (id) => {
  if (!confirm("정말 이 메뉴를 삭제하시겠습니까? 관련 데이터에 영향을 줄 수 있습니다.")) return;
  try {
    await deleteAdminMenu(id);
    alert("메뉴가 성공적으로 삭제되었습니다.");
    fetchMenus();
    currentPage.value = 1;
  } catch (err) {
    alert("삭제 실패");
  }
};
  
// 모달 제어 함수
const openCreateModal = () => {
  isEditMode.value = false;
  menuForm.value = { categoryId: 1, itemId: 1, name: '', price: 0, menuImg: '' };
  isModalOpen.value = true;
};
  
const openEditModal = (menu) => {
  isEditMode.value = true;
  selectedMenuId.value = menu.id;

  const resolvedItemId = menu.itemId || menu.item_id || menu.item_Id || '';

  menuForm.value = {
    categoryId: menu.categoryId ? Number(menu.categoryId) : 1, 
    itemId: resolvedItemId, 
    name: menu.name || '',
    price: menu.price ? Number(menu.price) : 0,
    menuImg: menu.menuImg || ''
  };

  isModalOpen.value = true;
};
  
const closeModal = () => isModalOpen.value = false;
  
const openPriceModal = (menu) => {
  targetMenu.value = menu;
  priceForm.value = { 
    sizeId: 1, 
    price: menu.price ?? 0 
  };
  isPriceModalOpen.value = true;
};
  
const closePriceModal = () => isPriceModalOpen.value = false;

const getCategoryName = (id) => {
  switch (Number(id)) {
    case 1: return '아이스크림';
    case 2: return '아이스모찌';
    case 3: return '음료';
    default: return '기타';
  }
};
  
onMounted(fetchMenus);
</script>
  
<style scoped>
.menu-management-container { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }

/* 카테고리 필터 버튼 스타일 */
.category-filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.filter-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover { background: #f1f5f9; }
.filter-btn.active {
  background: #6f42c1;
  color: white;
  border-color: #6f42c1;
}

.table-wrapper { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th { background: #f8fafc; padding: 12px; font-size: 13px; color: #64748b; text-align: left; border-bottom: 1px solid #edf2f7; }
td { padding: 14px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.item-id-cell { vertical-align: middle; font-weight: 500; color: #334155; }
.menu-name { font-weight: 600; color: #1e293b; }
.menu-thumb { width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; }
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
.modal-subtitle { font-size: 12px; color: #94a3b8; margin-top: -8px; margin-bottom: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.form-group input, .form-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }

/* 하단 페이지네이션 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #f1f5f9;
}
.pagination-info { font-size: 13px; color: #64748b; }
.pagination-pages { display: flex; align-items: center; gap: 6px; }
.btn-page {
  background: white;
  border: 1px solid #e2e8f0;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
.btn-page.active {
  background: #6f42c1;
  color: white;
  border-color: #6f42c1;
}
.btn-page:disabled, .btn-page-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-page-nav {
  background: white;
  border: 1px solid #e2e8f0;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #64748b;
}
.no-img { font-size: 12px; color: #94a3b8; }
.text-center { text-align: center; }
.py-5 { padding-top: 3rem; padding-bottom: 3rem; }
.text-muted { color: #94a3b8; }
</style>