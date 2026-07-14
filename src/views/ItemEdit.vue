<template>
<div class="item-container">
    <h1>품목 수정</h1>

    <form @submit.prevent="updateItem" class="item-form">

      <div class="form-row">
        <label>카테고리 ID</label>
        <input type="number" v-model="item.categoryId" />
      </div>

      <div class="form-row">
        <label>단위</label>
        <input type="number" v-model="item.unit" />
      </div>

      <div class="form-row">
        <label>품목명</label>
        <input type="text" v-model="item.itemName" />
      </div>

      <button type="submit">
        수정
      </button>
    </form>
  </div>

</template>


<script setup>
import { reactive, onMounted } from "vue";
import axios from "axios";

const props = defineProps({
  id: Number
});

const emit = defineEmits([
  "updated",
  "close"
]);

const item = reactive({
  categoryId: "",
  unit: "",
  itemName: ""
});


// 기존 데이터 조회
const getItem = async () => {

  const response = await axios.get(
    `http://localhost:8888/api/items/${props.id}`
  );

  item.categoryId = response.data.categoryId;
  item.unit = response.data.unit;
  item.itemName = response.data.itemName;
};


// 수정
const updateItem = async () => {

  await axios.put(
    `http://localhost:8888/api/items/${props.id}`,
    item
  );

  alert("수정 완료");
  emit("updated");
};

// 페이지 열릴 때 조회
onMounted(() => {
  getItem();
});

</script>