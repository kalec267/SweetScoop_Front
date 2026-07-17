<template>
  <div v-if="branchId" class="card mt-5 border-info shadow animate-fade-in">
    
    <div class="card-header bg-info text-white d-flex justify-content-between align-items-center py-3">
      <h5 class="mb-0 fw-bold">🎯 {{ branchData?.branchName }} 상세 정보 및 기기 현황</h5>
      <button @click="closeDetail" class="btn-close btn-close-white" title="닫기"></button>
    </div>
    
    <div class="card-body p-4" v-if="branchData">
      
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="p-3 bg-light rounded border border-start-4 border-primary">
            <div class="text-muted small">📍 분점 위치</div>
            <div class="fs-5 fw-bold text-dark mt-1">{{ branchData.location }}</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="p-3 bg-light rounded border border-start-4 border-dark">
            <div class="text-muted small">🖥️ 총 키오스크 대수</div>
            <div class="fs-5 fw-bold text-dark mt-1">{{ branchData.kiosks?.length || 0 }} 대</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="p-3 bg-light rounded border border-start-4 border-success">
            <div class="text-muted small">📊 통합 운영 상태</div>
            <div class="mt-1">
              <span :class="getStatusBadgeClass(branchData.status) + ' fs-6 px-3 py-1'">
                {{ branchData.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <h5 class="fw-bold mb-3 text-secondary border-bottom pb-2">🖥️ 개별 키오스크 기기 리스트</h5>
      
      <div v-if="!branchData.kiosks || branchData.kiosks.length === 0" class="text-center my-5 text-muted">
        이 분점에 등록된 키오스크 기기가 존재하지 않습니다.
      </div>
      
      <div v-else class="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-3">
        <div v-for="(kiosk, index) in branchData.kiosks" :key="kiosk.id" class="col">
          <div class="card text-center h-100 border border-light-subtle shadow-sm">
            <div class="card-body py-4">
              <div class="text-muted small mb-1">기기 고유 ID: {{ kiosk.id }}</div>
              <h5 class="fw-bold text-primary mb-3">{{ index + 1 }}호기 키오스크</h5>
              <span :class="getKioskBadgeClass(kiosk.status)">{{ kiosk.status }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

// 💡 부모(List) 컴포넌트로부터 받아올 데이터 정의
const props = defineProps({
  branchId: {
    type: Number,
    default: null
  }
})

// 💡 부모 컴포넌트에게 이벤트를 보내기 위한 에밋 설정
const emit = defineEmits(['close', 'refresh-list'])

const branchData = ref(null)
const API_URL = '/api/admin/branches'

// 💡 부모가 준 branchId가 바뀔 때마다 자동으로 백엔드 데이터 실시간 동적 로드
watch(() => props.branchId, (newId) => {
  if (newId) {
    fetchBranchDetail(newId)
  } else {
    branchData.value = null
  }
}, { immediate: true })

// 특정 분점 상세조회 통신 (GET)
const fetchBranchDetail = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`)
    branchData.value = response.data
  } catch (error) {
    console.error('상세 정보 로드 실패:', error)
    alert('상세 정보를 불러올 수 없습니다.')
  }
}

// 닫기 버튼 이벤트 전송
const closeModal = () => {
  emit('close')
}

// 통합 운영 상태 디자인 배지
const getStatusBadgeClass = (status) => {
  return {
    'badge bg-success': status === '정상',
    'badge bg-warning text-dark': status && status.includes('대기'),
    'badge bg-danger': status && status.includes('중단'),
    'badge bg-secondary': status === '기기 없음'
  }
}

// 개별 키오스크 디자인 배지
const getKioskBadgeClass = (status) => {
  return {
    'badge px-3 py-2 bg-success-subtle text-success border border-success': status === '정상',
    'badge px-3 py-2 bg-danger-subtle text-danger border border-danger': status === '장애',
    'badge px-3 py-2 bg-dark-subtle text-dark border border-secondary': status === '꺼짐'
  }
}

// 외부에서 호출할 수 있도록 리프레시 기능 열어두기 (부모가 정보 수정 시 호출용)
defineExpose({
  refresh: () => {
    if (props.branchId) fetchBranchDetail(props.branchId)
  }
})
</script>