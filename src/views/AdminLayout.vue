
<template>
  <div class="layout">

    <aside class="sidebar">
<a href="#" class="logo" @click.prevent="refreshList">
    SWEET
    SCOOP
</a>

      <div class="menu-container">

        <h3>메뉴</h3>

        <router-link to="/">
          대시보드
        </router-link>

        <router-link to="/">
          재고 신청
        </router-link>

        <router-link to="/">
          재고 현황
        </router-link>

        <router-link to="/">
          배송 관리
        </router-link>

        <router-link to="/">
          분점 관리
        </router-link>
        
        <router-link to="/">
          통계 / 리포트
        </router-link>
      </div>

<div class = "setting">

    <router-link to="/">
          설정
    </router-link>
    <router-link to="/">
          관리자
    </router-link>
    </div>
    </aside>
    

    <!-- 새 div 추가 -->
    <div class="right-area">

  <div class="top-header">
    <h2>재고 현황</h2>
  </div>
    <div class="summary-container">

    <div class="summary-card">
      <h4>전체 품목</h4>
      <p>{{ items.length }}</p>
    </div>

    <div class="summary-card">
      <h4>품목 부족</h4>
      <p>??</p>
    </div>

    <div class="summary-card">
      <h4>신청 대기</h4>
      <p>??</p>
    </div>

    <div class="summary-card">
      <h4>여유 재고</h4>
      <p>??</p>
    </div>

  </div>

    <main class="content-box">

<template v-if="currentView === 'list'">
    
      <div class="title-area">
    <h3>재고 현황</h3>

    <button @click="currentView='create'">
      + 품목 등록
    </button>

  </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>카테고리ID</th>
            <th>단위</th>
            <th>품목명</th>
            <th>관리</th>
          </tr>
        </thead>

        <tbody>
  <tr v-for="item in paginatedItems" :key="item.id">

    <td>{{ item.id }}</td>

    <td>{{ item.categoryId }}</td>

    <td>{{ item.unit }}</td>

    <td>{{ item.itemName }}</td>

    <td>
      <button @click="editItem(item.id)" class="btn">
        수정
      </button>

      <button @click="deleteItem(item.id)" class="deletebtn">
        삭제
      </button>
    </td>

  </tr>
</tbody>
      </table>
   <div class="pagination">

   <!-- 이전 -->
  <button 
    @click="prevPage"
    :disabled="currentPage === 1">
    <
  </button>


  <!-- 페이지 번호 -->
  <button
    v-for="page in pageNumbers"
    :key="page"
    @click="goPage(page)"
    :class="{ active: currentPage === page }"
  >
    {{ page }}
  </button>


  <!-- 다음 -->
  <button 
    @click="nextPage"
    :disabled="currentPage === totalPages">
    >
  </button>
    <button>
      + 추가 신청
    </button>
    </div>

      </template>
  <!-- 등록 화면 -->
<ItemCreate 
  v-if="currentView === 'create'"
  @close="refreshList"
/>


  <!-- 수정 화면 -->
  <ItemEdit
    v-if="currentView === 'edit'"
    :id="selectedId"
     @close="refreshList"
  />

  </main>


  </div>
</div>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import ItemCreate from "./ItemCreate.vue";
import ItemEdit from "./ItemEdit.vue";


const currentView = ref("list");
const selectedId = ref(null);

const router = useRouter();

const items = ref([]);

// 페이지 설정
const currentPage = ref(1);
const pageSize = 5;


// 전체 페이지 수
const totalPages = computed(() => {
  return Math.ceil(items.value.length / pageSize);
});


// 현재 페이지 데이터
const paginatedItems = computed(() => {

  const start = 
    (currentPage.value - 1) * pageSize;

  return items.value.slice(
    start,
    start + pageSize
  );

});


// 다음 페이지
const nextPage = () => {

  if(currentPage.value < totalPages.value){
    currentPage.value++;
  }

};


// 이전 페이지
const prevPage = () => {

  if(currentPage.value > 1){
    currentPage.value--;
  }

};

// 목록 조회
const getItems = async () => {
  const response = await axios.get(
    "http://localhost:8888/api/items"
  );

  items.value = response.data;
};


// 삭제
const deleteItem = async (id) => {

  if (!confirm("삭제하시겠습니까?")) {
    return;
  }

  await axios.delete(
    `http://localhost:8888/api/items/${id}`
  );

  // 삭제 후 목록 다시 조회
  getItems();

  if(currentPage.value > totalPages.value){
  currentPage.value = totalPages.value;
};
}

// 수정
const editItem = (id) => {

  selectedId.value = id;

  currentView.value = "edit";

};

// 화면 로딩 시 목록 조회
onMounted(() => {
  getItems();
});


const pageNumbers = computed(() => {

  const pages = [];

  if(totalPages.value <= 6){
    for(let i = 1; i <= totalPages.value; i++){
      pages.push(i);
    }
  }
  else {

    pages.push(1);
    pages.push(2);
    pages.push(3);
    pages.push(4);
    pages.push(5);

    if(currentPage.value > 5 && currentPage.value < totalPages.value){
      pages.push("...");
      pages.push(currentPage.value);
    }
    else {
      pages.push("...");
    }

    pages.push(totalPages.value);

  }

  return pages;

});

const goPage = (page) => {

  if(page === "..."){
    return;
  }

  currentPage.value = page;

};
const goList = () => {
  currentView.value = "list";
};
const refreshList = async () => {
  await getItems();
  currentView.value = "list";
};
</script>