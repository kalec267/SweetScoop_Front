<template>
  <div class="container mt-5">
    <h2 class="mb-4">🏬 본점 관리 시스템 - 분점 관리</h2>
    <hr />

    <div class="card mb-5 shadow-sm">
      <div class="card-header bg-primary text-white fw-bold">신규 분점 등록</div>
      <div class="card-body">
        <form @submit.prevent="registerBranch" class="row g-3">
          <div class="col-md-5">
            <input v-model="newBranch.branchName" type="text" class="form-control" placeholder="지점명 (예: 강남점)" required />
          </div>
          <div class="col-md-5">
            <input v-model="newBranch.location" type="text" class="form-control" placeholder="위치/주소" required />
          </div>
          <div class="col-md-2">
            <button type="submit" class="btn btn-success w-100">등록하기</button>
          </div>
        </form>
      </div>
    </div>

    <h3 class="mb-3 fw-bold">등록된 분점 리스트</h3>
    <table class="table table-hover table-bordered align-middle shadow-sm">
      <thead class="table-dark">
        <tr>
          <th style="width: 10%;">지점 ID</th>
          <th style="width: 25%;">지점명 (클릭 시 하단 상세조회)</th>
          <th style="width: 30%;">위치 / 주소</th>
          <th style="width: 15%; text-align: center;">통합 운영 상태</th>
          <th style="width: 20%; text-align: center;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="branches.length === 0">
          <td colspan="5" class="text-center text-muted">등록된 분점이 없습니다.</td>
        </tr>
        <tr v-for="branch in branches" :key="branch.id" :class="{'table-primary': selectedBranchId === branch.id}">
          <td>{{ branch.id }}</td>
          
          <td v-if="editingId === branch.id">
            <input v-model="editForm.branchName" type="text" class="form-control form-control-sm" required />
          </td>
          <td v-else>
            <a href="#" @click.prevent="selectedBranchId = branch.id" class="text-decoration-none fw-bold text-primary">
              {{ branch.branchName }} 🔍
            </a>
          </td>

          <td v-if="editingId === branch.id">
            <input v-model="editForm.location" type="text" class="form-control form-control-sm" required />
          </td>
          <td v-else>{{ branch.location }}</td>

          <td class="text-center">
            <span :class="getStatusBadgeClass(branch.status)">
              {{ branch.status }}
            </span>
          </td>

          <td class="text-center">
            <span v-if="editingId === branch.id">
              <button @click="saveEdit(branch.id)" class="btn btn-sm btn-primary me-1">저장</button>
              <button @click="cancelEdit" class="btn btn-sm btn-secondary">취소</button>
            </span>
            <span v-else>
              <button @click="startEdit(branch)" class="btn btn-sm btn-warning me-1 text-white">수정</button>
              <button @click="deleteBranch(branch.id)" class="btn btn-sm btn-danger">삭제</button>
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <BranchDetail 
      ref="detailComponentRef"
      :branch-id="selectedBranchId" 
      @close="selectedBranchId = null"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import BranchDetail from './BranchDetail.vue' // 💡 자식 컴포넌트 불러오기

// 상태 정의
const branches = ref([])
const newBranch = ref({ branchName: '', location: '' })

const editingId = ref(null)
const editForm = ref({ branchName: '', location: '' })

// 💡 현재 선택된 분점 ID 상태값 관리
const selectedBranchId = ref(null)
const detailComponentRef = ref(null)

const API_URL = 'http://localhost:8080/api/admin/branches'

// 1. 전체 목록 가져오기 (GET)
const fetchBranches = async () => {
  try {
    const response = await axios.get(API_URL)
    branches.value = response.data
  } catch (error) {
    console.error('목록 불러오기 실패:', error)
  }
}

// 2. 신규 분점 등록하기 (POST)
const registerBranch = async () => {
  try {
    await axios.post(API_URL, newBranch.value)
    alert('분점이 성공적으로 등록되었습니다.')
    newBranch.value.branchName = ''
    newBranch.value.location = ''
    fetchBranches()
  } catch (error) {
    console.error('등록 실패:', error)
  }
}

// 3. 수정 모드 진입
const startEdit = (branch) => {
  editingId.value = branch.id
  editForm.value = { branchName: branch.branchName, location: branch.location }
}

// 4. 수정 취소
const cancelEdit = () => {
  editingId.value = null
}

// 5. 수정 내용 저장 (PUT)
const saveEdit = async (id) => {
  if (!editForm.value.branchName.trim() || !editForm.value.location.trim()) {
    alert('모든 필드를 입력해 주세요.')
    return
  }
  try {
    await axios.put(`${API_URL}/${id}`, editForm.value)
    alert('분점 정보가 수정되었습니다.')
    editingId.value = null
    fetchBranches()
    
    // 만약 현재 열어놓은 상세 정보창과 같은 지점을 수정했다면 자식창도 새로고침 시키기
    if (selectedBranchId.value === id && detailComponentRef.value) {
      detailComponentRef.value.refresh()
    }
  } catch (error) {
    console.error('수정 실패:', error)
  }
}

// 6. 분점 삭제하기 (DELETE)
const deleteBranch = async (id) => {
  if (!confirm('정말 이 분점을 삭제하시겠습니까?')) return
  try {
    await axios.delete(`${API_URL}/${id}`)
    alert('분점이 삭제되었습니다.')
    if (selectedBranchId.value === id) {
      selectedBranchId.value = null // 지워진 지점의 하단 자식 상세창은 닫음
    }
    fetchBranches()
  } catch (error) {
    console.error('삭제 실패:', error)
  }
}

// 7. 목록 운영상태 배지 스타일
const getStatusBadgeClass = (status) => {
  return {
    'badge bg-success': status === '정상',
    'badge bg-warning text-dark': status && status.includes('대기'),
    'badge bg-danger': status && status.includes('중단'),
    'badge bg-secondary': status === '기기 없음'
  }
}

onMounted(() => {
  fetchBranches()
})
</script>