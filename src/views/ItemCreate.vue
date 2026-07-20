<template>
  <section class="form-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">본사 물류 관리</p>
        <h2>품목 등록</h2>
        <p>새로운 물류 품목 정보를 등록합니다.</p>
      </div>

      <button type="button" class="back-button" @click="goToList">
        목록으로
      </button>
    </header>

    <div class="form-card">
      <div class="card-title">
        <span class="title-icon">📦</span>
        <div>
          <h3>기본 정보</h3>
          <p>카테고리, 단위, 품목명을 정확하게 입력해 주세요.</p>
        </div>
      </div>

      <form class="item-form" @submit.prevent="saveItem">
        <div class="form-group">
          <label for="categoryId">
            카테고리 ID <span>*</span>
          </label>
          <input
            id="categoryId"
            v-model.number="item.categoryId"
            type="number"
            min="1"
            placeholder="예: 1"
            required
          />
          <small>품목이 소속될 CATEGORY 테이블의 ID입니다.</small>
        </div>

        <div class="form-group">
          <label for="unit">
            단위 <span>*</span>
          </label>
          <input
            id="unit"
            v-model.trim="item.unit"
            type="text"
            maxlength="20"
            placeholder="예: g, kg, ea, ml"
            required
          />
          <small></small>
        </div>

        <div class="form-group full">
          <label for="itemName">
            품목명 <span>*</span>
          </label>
          <input
            id="itemName"
            v-model.trim="item.itemName"
            type="text"
            maxlength="100"
            placeholder="예: 엄마는 외계인 튜브"
            required
          />
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-button" @click="goToList">
            취소
          </button>
          <button type="submit" class="submit-button" :disabled="isSaving">
            {{ isSaving ? "등록 중..." : "품목 등록" }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import api from "@/api/index.js";

const router = useRouter();
const isSaving = ref(false);

const item = reactive({
  categoryId: null,
  unit: "",
  itemName: "",
});

const goToList = () => {
  router.push({ name: "ItemList" });
};

const saveItem = async () => {
  isSaving.value = true;

  try {
    await api.post("/api/items", {
      categoryId: Number(item.categoryId),
      unit: item.unit,
      itemName: item.itemName,
    });

    window.alert("품목이 등록되었습니다.");
    await router.push({ name: "ItemList" });
  } catch (error) {
    console.error("품목 등록 실패:", error);
    window.alert(
      error.response?.data?.message ||
      error.response?.data ||
      "품목 등록에 실패했습니다."
    );
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.form-page {
  width: 100%;
  min-width: 0;
  padding: 32px;
  background: #f8fafc;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #d13b7d;
  font-size: 13px;
  font-weight: 800;
}

.page-header h2 {
  margin: 0;
  color: #172033;
  font-size: 28px;
}

.page-header p:not(.eyebrow) {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.back-button,
.cancel-button,
.submit-button {
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.back-button,
.cancel-button {
  padding: 10px 15px;
  border: 1px solid #dfe5ec;
  background: white;
  color: #475569;
}

.form-card {
  max-width: 850px;
  padding: 28px;
  border: 1px solid #e5eaf0;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 13px;
  padding-bottom: 20px;
  border-bottom: 1px solid #edf0f4;
}

.title-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #fce7f3;
  font-size: 20px;
}

.card-title h3 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 18px;
}

.card-title p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.item-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  padding-top: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.form-group label span {
  color: #d13b7d;
}

.form-group input {
  width: 100%;
  height: 44px;
  padding: 0 13px;
  border: 1px solid #dfe5ec;
  border-radius: 9px;
  outline: none;
  color: #334155;
  font-size: 14px;
}

.form-group input:focus {
  border-color: #d13b7d;
  box-shadow: 0 0 0 3px rgba(209, 59, 125, 0.1);
}

.form-group small {
  color: #94a3b8;
  font-size: 12px;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding-top: 8px;
}

.submit-button {
  padding: 11px 18px;
  border: 0;
  background: #d13b7d;
  color: white;
}

.submit-button:hover {
  background: #b52a65;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .form-page {
    padding: 20px 16px;
  }

  .page-header {
    flex-direction: column;
  }

  .form-card {
    padding: 20px;
  }

  .item-form {
    grid-template-columns: 1fr;
  }

  .form-group.full,
  .form-actions {
    grid-column: auto;
  }
}
</style>
