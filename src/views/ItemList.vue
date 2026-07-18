<template>
  <section class="item-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">본사 물류 관리</p>
        <h2>품목 관리</h2>
        <p class="description">
          키오스크와 분점에서 사용하는 물류 품목을 조회하고 관리합니다.
        </p>
      </div>

      <button
        type="button"
        class="primary-button"
        @click="goToCreate"
      >
        + 품목 등록
      </button>
    </header>

    <div class="summary-grid">
      <article class="summary-card">
        <span class="summary-icon">📦</span>
        <div>
          <p>전체 품목</p>
          <strong>{{ items.length }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <span class="summary-icon">🗂️</span>
        <div>
          <p>카테고리 수</p>
          <strong>{{ categoryCount }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <span class="summary-icon">⚖️</span>
        <div>
          <p>사용 단위 수</p>
          <strong>{{ unitCount }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <span class="summary-icon">📄</span>
        <div>
          <p>현재 페이지</p>
          <strong>{{ totalPages === 0 ? 0 : currentPage }} / {{ totalPages }}</strong>
        </div>
      </article>
    </div>

    <div class="content-card">
      <div class="card-toolbar">
        <div>
          <h3>품목 목록</h3>
          <p>총 {{ filteredItems.length }}개의 품목</p>
        </div>

        <div class="toolbar-controls">
          <div class="search-box">
            <span>🔍</span>
            <input
              v-model.trim="searchKeyword"
              type="search"
              placeholder="품목명, 단위, 카테고리 검색"
            />
          </div>

          <button
            type="button"
            class="secondary-button"
            :disabled="isLoading"
            @click="getItems"
          >
            새로고침
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="state-box">
        <div class="spinner"></div>
        <p>품목 목록을 불러오는 중입니다.</p>
      </div>

      <div v-else-if="loadError" class="state-box error-state">
        <span class="state-icon">⚠️</span>
        <h4>품목 목록을 불러오지 못했습니다.</h4>
        <p>{{ loadError }}</p>
        <button type="button" class="secondary-button" @click="getItems">
          다시 시도
        </button>
      </div>

      <div v-else-if="filteredItems.length === 0" class="state-box">
        <span class="state-icon">📭</span>
        <h4>표시할 품목이 없습니다.</h4>
        <p>검색어를 변경하거나 새 품목을 등록해 주세요.</p>
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>카테고리 ID</th>
              <th>단위</th>
              <th>품목명</th>
              <th>관리</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in paginatedItems"
              :key="item.id"
            >
              <td>
                <span class="id-badge">#{{ item.id }}</span>
              </td>
              <td>{{ item.categoryId }}</td>
              <td>
                <span class="unit-badge">{{ item.unit || "-" }}</span>
              </td>
              <td class="item-name">{{ item.itemName }}</td>
              <td>
                <div class="action-buttons">
                  <button
                    type="button"
                    class="edit-button"
                    @click="editItem(item.id)"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    class="delete-button"
                    :disabled="deletingId === item.id"
                    @click="deleteItem(item.id)"
                  >
                    {{ deletingId === item.id ? "삭제 중" : "삭제" }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer
        v-if="!isLoading && !loadError && totalPages > 0"
        class="pagination-area"
      >
        <button
          type="button"
          class="page-button"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          &lt;
        </button>

        <button
          v-for="(page, index) in pageNumbers"
          :key="`${page}-${index}`"
          type="button"
          class="page-button"
          :class="{ active: currentPage === page }"
          :disabled="page === '...'"
          @click="goPage(page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          class="page-button"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          &gt;
        </button>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import api from "@/api/index.js";

const router = useRouter();

const items = ref([]);
const currentPage = ref(1);
const searchKeyword = ref("");
const isLoading = ref(false);
const loadError = ref("");
const deletingId = ref(null);

const pageSize = 5;

const filteredItems = computed(() => {
  const keyword = searchKeyword.value.toLowerCase();

  if (!keyword) {
    return items.value;
  }

  return items.value.filter((item) => {
    return [
      item.id,
      item.categoryId,
      item.unit,
      item.itemName,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(keyword)
    );
  });
});

const totalPages = computed(() =>
  Math.ceil(filteredItems.value.length / pageSize)
);

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredItems.value.slice(start, start + pageSize);
});

const categoryCount = computed(() => {
  return new Set(
    items.value
      .map((item) => item.categoryId)
      .filter((value) => value !== null && value !== undefined)
  ).size;
});

const unitCount = computed(() => {
  return new Set(
    items.value
      .map((item) => item.unit)
      .filter((value) => String(value ?? "").trim() !== "")
  ).size;
});

const pageNumbers = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 7) {
    for (let page = 1; page <= total; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  pages.push(1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < total - 1) pages.push("...");

  pages.push(total);
  return pages;
});

const normalizeItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const getItems = async () => {
  isLoading.value = true;
  loadError.value = "";

  try {
    const response = await api.get("/api/items");
    items.value = normalizeItems(response.data);

    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(totalPages.value, 1);
    }
  } catch (error) {
    console.error("품목 목록 조회 실패:", error);
    items.value = [];
    loadError.value =
      error.response?.data?.message ||
      "백엔드 서버와 API 경로를 확인해 주세요.";
  } finally {
    isLoading.value = false;
  }
};

const goToCreate = () => {
  router.push({ name: "ItemCreate" });
};

const editItem = (id) => {
  router.push({
    name: "ItemEdit",
    params: { id },
  });
};

const deleteItem = async (id) => {
  if (!window.confirm("해당 품목을 삭제하시겠습니까?")) return;

  deletingId.value = id;

  try {
    await api.delete(`/api/items/${id}`);
    await getItems();
    window.alert("품목이 삭제되었습니다.");
  } catch (error) {
    console.error("품목 삭제 실패:", error);
    window.alert(
      error.response?.data?.message ||
      error.response?.data ||
      "품목 삭제에 실패했습니다."
    );
  } finally {
    deletingId.value = null;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1;
};

const goPage = (page) => {
  if (typeof page === "number") currentPage.value = page;
};

watch(searchKeyword, () => {
  currentPage.value = 1;
});

onMounted(getItems);
</script>

<style scoped>
.item-page {
  width: 100%;
  min-width: 0;
  padding: 32px;
  background: #f8fafc;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
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
  font-weight: 800;
}

.description {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 20px;
  border: 1px solid #edf0f4;
  border-radius: 14px;
  background: white;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}

.summary-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #fce7f3;
  font-size: 20px;
}

.summary-card p {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 13px;
}

.summary-card strong {
  color: #172033;
  font-size: 23px;
}

.content-card {
  overflow: hidden;
  border: 1px solid #e5eaf0;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 22px;
  border-bottom: 1px solid #edf0f4;
}

.card-toolbar h3 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 18px;
}

.card-toolbar p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 280px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dfe5ec;
  border-radius: 9px;
  background: #f8fafc;
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #334155;
}

.primary-button,
.secondary-button,
.edit-button,
.delete-button {
  border: 0;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  padding: 11px 16px;
  background: #d13b7d;
  color: white;
}

.primary-button:hover {
  background: #b52a65;
}

.secondary-button {
  padding: 10px 14px;
  border: 1px solid #dfe5ec;
  background: white;
  color: #475569;
}

.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}

th,
td {
  padding: 16px 18px;
  border-bottom: 1px solid #edf0f4;
  text-align: center;
}

th {
  background: #fafbfc;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

td {
  color: #334155;
  font-size: 14px;
}

tbody tr:hover {
  background: #fffafd;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.id-badge {
  color: #d13b7d;
  font-weight: 800;
}

.unit-badge {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.item-name {
  color: #1e293b;
  font-weight: 700;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 7px;
}

.edit-button,
.delete-button {
  padding: 8px 12px;
}

.edit-button {
  background: #ede9fe;
  color: #6d28d9;
}

.delete-button {
  background: #fee2e2;
  color: #dc2626;
}

.delete-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.state-box {
  min-height: 280px;
  padding: 48px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  text-align: center;
}

.state-box h4 {
  margin: 12px 0 5px;
  color: #475569;
}

.state-box p {
  margin: 0 0 16px;
  font-size: 13px;
}

.state-icon {
  font-size: 38px;
}

.spinner {
  width: 34px;
  height: 34px;
  margin-bottom: 13px;
  border: 4px solid #f1f5f9;
  border-top-color: #d13b7d;
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
}

.pagination-area {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 18px;
  border-top: 1px solid #edf0f4;
}

.page-button {
  min-width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: white;
  color: #334155;
  cursor: pointer;
}

.page-button.active {
  border-color: #d13b7d;
  background: #d13b7d;
  color: white;
}

.page-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

@media (max-width: 1050px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-controls,
  .search-box {
    width: 100%;
  }
}

@media (max-width: 700px) {
  .item-page {
    padding: 20px 16px;
  }

  .page-header {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-controls {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
