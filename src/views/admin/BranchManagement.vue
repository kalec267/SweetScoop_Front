<template>
  <div class="branch-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">HEAD OFFICE MANAGEMENT</p>
        <h1>분점 관리</h1>
        <p class="page-description">
          신규 분점을 등록하고 지점별 운영 상태를 관리합니다.
        </p>
      </div>

      <button
        type="button"
        class="refresh-button"
        :disabled="isLoading"
        @click="fetchBranches"
      >
        <span :class="{ rotating: isLoading }">↻</span>
        새로고침
      </button>
    </header>

    <section class="summary-grid">
      <article class="summary-card">
        <div class="summary-icon blue">🏬</div>
        <div>
          <span class="summary-label">전체 분점</span>
          <strong>{{ branches.length }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon green">●</div>
        <div>
          <span class="summary-label">정상 운영</span>
          <strong>{{ normalBranchCount }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon orange">◷</div>
        <div>
          <span class="summary-label">대기·점검</span>
          <strong>{{ waitingBranchCount }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon red">!</div>
        <div>
          <span class="summary-label">운영 중단</span>
          <strong>{{ stoppedBranchCount }}</strong>
        </div>
      </article>
    </section>

    <section class="content-card">
      <div class="card-heading">
        <div>
          <span class="section-badge">NEW BRANCH</span>
          <h2>신규 분점 등록</h2>
          <p>지점명과 위치를 입력해 새로운 분점을 등록합니다.</p>
        </div>
      </div>

      <form class="register-form" @submit.prevent="registerBranch">
        <div class="form-group">
          <label for="branch-name">지점명</label>

          <div class="input-wrapper">
            <span class="input-icon">🏪</span>

            <input
              id="branch-name"
              v-model.trim="newBranch.branchName"
              type="text"
              placeholder="예: 스윗스쿱 강남점"
              maxlength="50"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="branch-location">위치 / 주소</label>

          <div class="input-wrapper">
            <span class="input-icon">📍</span>

            <input
              id="branch-location"
              v-model.trim="newBranch.location"
              type="text"
              placeholder="예: 서울특별시 강남구 강남대로"
              maxlength="100"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          class="primary-button"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "등록 중..." : "분점 등록 +" }}
        </button>
      </form>
    </section>

    <div v-if="errorMessage" class="error-message">
      <span>⚠️</span>

      <div>
        <strong>요청 처리 중 오류가 발생했습니다.</strong>
        <p>{{ errorMessage }}</p>
      </div>

      <button type="button" @click="errorMessage = ''">
        ×
      </button>
    </div>

    <section class="content-card">
      <div class="list-header">
        <div>
          <span class="section-badge">BRANCH LIST</span>
          <h2>등록된 분점 리스트</h2>
          <p>지점명을 클릭하면 상세 정보를 확인할 수 있습니다.</p>
        </div>

        <div class="branch-count">
          총 <strong>{{ branches.length }}</strong>개 지점
        </div>
      </div>

      <div class="table-container">
        <table class="branch-table">
          <thead>
            <tr>
              <th style="width: 10%">지점 ID</th>
              <th style="width: 25%">지점명</th>
              <th style="width: 30%">위치 / 주소</th>
              <th style="width: 15%" class="center">운영 상태</th>
              <th style="width: 20%" class="center">관리</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="isLoading">
              <td colspan="5">
                <div class="table-state">
                  <div class="spinner"></div>
                  <p>분점 목록을 불러오는 중입니다.</p>
                </div>
              </td>
            </tr>

            <tr v-else-if="branches.length === 0">
              <td colspan="5">
                <div class="table-state empty-state">
                  <span>🏬</span>
                  <strong>등록된 분점이 없습니다.</strong>
                  <p>상단에서 새로운 분점을 등록해 주세요.</p>
                </div>
              </td>
            </tr>

            <tr
              v-for="branch in branches"
              v-else
              :key="branch.id"
              :class="{
                selected: selectedBranchId === branch.id,
                editing: editingId === branch.id
              }"
            >
              <td>
                <span class="branch-id">
                  #{{ branch.id }}
                </span>
              </td>

              <td v-if="editingId === branch.id">
                <input
                  v-model.trim="editForm.branchName"
                  type="text"
                  class="table-input"
                  maxlength="50"
                  required
                />
              </td>

              <td v-else>
                <button
                  type="button"
                  class="branch-name-button"
                  @click="selectBranch(branch.id)"
                >
                  <span class="branch-avatar">
                    {{ getBranchInitial(branch.branchName) }}
                  </span>

                  <span class="branch-name-content">
                    <strong>{{ branch.branchName }}</strong>
                    <small>상세 정보 보기</small>
                  </span>

                  <span class="detail-arrow">›</span>
                </button>
              </td>

              <td v-if="editingId === branch.id">
                <input
                  v-model.trim="editForm.location"
                  type="text"
                  class="table-input"
                  maxlength="100"
                  required
                />
              </td>

              <td v-else>
                <div class="location-cell">
                  <span>📍</span>
                  <span>{{ branch.location }}</span>
                </div>
              </td>

              <td class="center">
                <span :class="getStatusBadgeClass(branch.status)">
                  <span class="status-dot"></span>
                  {{ branch.status || "상태 미확인" }}
                </span>
              </td>

              <td class="center">
                <div
                  v-if="editingId === branch.id"
                  class="action-group"
                >
                  <button
                    type="button"
                    class="action-button save"
                    @click="saveEdit(branch.id)"
                  >
                    저장
                  </button>

                  <button
                    type="button"
                    class="action-button cancel"
                    @click="cancelEdit"
                  >
                    취소
                  </button>
                </div>

                <div v-else class="action-group">
                  <button
                    type="button"
                    class="action-button edit"
                    @click="startEdit(branch)"
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    class="action-button delete"
                    @click="deleteBranch(branch.id)"
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Transition name="detail-slide">
      <section
        v-if="selectedBranchId !== null"
        class="detail-section"
      >
        <BranchDetail
          ref="detailComponentRef"
          :branch-id="selectedBranchId"
          @close="selectedBranchId = null"
        />
      </section>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";

import BranchDetail from "../../components/admin/BranchDetail.vue";

const branches = ref([]);

const newBranch = ref({
  branchName: "",
  location: ""
});

const editingId = ref(null);

const editForm = ref({
  branchName: "",
  location: ""
});

const selectedBranchId = ref(null);
const detailComponentRef = ref(null);

const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");

const API_URL = "/api/admin/branches";

const normalBranchCount = computed(() =>
  branches.value.filter(
    (branch) => branch.status === "정상"
  ).length
);

const waitingBranchCount = computed(() =>
  branches.value.filter(
    (branch) =>
      branch.status?.includes("대기") ||
      branch.status?.includes("점검")
  ).length
);

const stoppedBranchCount = computed(() =>
  branches.value.filter(
    (branch) => branch.status?.includes("중단")
  ).length
);

const getBranchInitial = (branchName) => {
  if (!branchName) {
    return "B";
  }

  return branchName.trim().charAt(0);
};

const selectBranch = (branchId) => {
  selectedBranchId.value =
    selectedBranchId.value === branchId
      ? null
      : branchId;
};

const fetchBranches = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await axios.get(API_URL);
    branches.value = response.data;
  } catch (error) {
    console.error("목록 불러오기 실패:", error);

    errorMessage.value =
      error.response?.data?.message ||
      error.response?.data ||
      "분점 목록을 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
};

const registerBranch = async () => {
  if (
    !newBranch.value.branchName.trim() ||
    !newBranch.value.location.trim()
  ) {
    alert("지점명과 주소를 모두 입력해 주세요.");
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    await axios.post(API_URL, newBranch.value);

    alert("분점이 성공적으로 등록되었습니다.");

    newBranch.value = {
      branchName: "",
      location: ""
    };

    await fetchBranches();
  } catch (error) {
    console.error("등록 실패:", error);

    errorMessage.value =
      error.response?.data?.message ||
      error.response?.data ||
      "분점 등록에 실패했습니다.";
  } finally {
    isSubmitting.value = false;
  }
};

const startEdit = (branch) => {
  editingId.value = branch.id;

  editForm.value = {
    branchName: branch.branchName,
    location: branch.location
  };
};

const cancelEdit = () => {
  editingId.value = null;

  editForm.value = {
    branchName: "",
    location: ""
  };
};

const saveEdit = async (id) => {
  if (
    !editForm.value.branchName.trim() ||
    !editForm.value.location.trim()
  ) {
    alert("모든 필드를 입력해 주세요.");
    return;
  }

  errorMessage.value = "";

  try {
    await axios.put(`${API_URL}/${id}`, editForm.value);

    alert("분점 정보가 수정되었습니다.");

    editingId.value = null;

    await fetchBranches();

    if (
      selectedBranchId.value === id &&
      detailComponentRef.value
    ) {
      detailComponentRef.value.refresh();
    }
  } catch (error) {
    console.error("수정 실패:", error);

    errorMessage.value =
      error.response?.data?.message ||
      error.response?.data ||
      "분점 정보 수정에 실패했습니다.";
  }
};

const deleteBranch = async (id) => {
  const branch = branches.value.find(
    (item) => item.id === id
  );

  const confirmed = confirm(
    `${branch?.branchName || "선택한 분점"}을 삭제하시겠습니까?`
  );

  if (!confirmed) {
    return;
  }

  errorMessage.value = "";

  try {
    await axios.delete(`${API_URL}/${id}`);

    alert("분점이 삭제되었습니다.");

    if (selectedBranchId.value === id) {
      selectedBranchId.value = null;
    }

    if (editingId.value === id) {
      cancelEdit();
    }

    await fetchBranches();
  } catch (error) {
    console.error("삭제 실패:", error);

    errorMessage.value =
      error.response?.data?.message ||
      error.response?.data ||
      "분점 삭제에 실패했습니다.";
  }
};

const getStatusBadgeClass = (status) => {
  return [
    "status-badge",
    {
      normal: status === "정상",
      waiting:
        status?.includes("대기") ||
        status?.includes("점검"),
      stopped: status?.includes("중단"),
      empty:
        status === "기기 없음" ||
        !status
    }
  ];
};

onMounted(fetchBranches);
</script>

<style src="../../css/BranchManagementStyle.css"></style>