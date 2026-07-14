<style scoped>

</style>
<template>
  <div class="item-container">
    <h1>품목 등록</h1>

    <form @submit.prevent="saveItem" class="item-form">
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

      <button type="submit">등록</button>
    </form>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import axios from "axios";

const item = reactive({
  categoryId: "",
  unit: "",
  itemName: ""
});

const saveItem = async () => {
  await axios.post("http://localhost:8888/api/items", item);
  alert("등록되었습니다.");

  item.categoryId = "";
  item.unit = "";
  item.itemName = "";
};
</script>