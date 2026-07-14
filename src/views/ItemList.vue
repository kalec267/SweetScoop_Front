<template>
     <div class="title-area">
    <h3>재고 현황</h3>

    <button @click="$router.push('/items/new')">
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

      <button @click="deleteItem(item.id)" class="btn">
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

<script setup>

import {useRouter} from "vue-router";

const router = useRouter();


const editItem=(id)=>{
  router.push(`/items/${id}/edit`);
}

</script>