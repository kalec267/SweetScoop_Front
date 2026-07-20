<template>
  <!-- v-if 조건부 렌더링 및 제공해주신 .detail-section 클래스 적용 -->
  <div v-if="branchId" class="detail-section content-card">
    
    <!-- 카드 헤더 영역 -->
    <div class="card-heading" style="border-bottom: 1px solid rgba(219, 226, 234, 0.5); align-items: center;">
      <div>
        <h2>🎯 {{ branchData?.branchName || '로딩 중...' }} 상세 정보</h2>
        <p>분점의 상세 위치와 개별 키오스크 기기들의 실시간 가동 현황을 확인합니다.</p>
      </div>
      <!-- CSS의 action-button cancel 스타일을 활용한 닫기 버튼 -->
      <button @click="closeModal" class="action-button cancel" title="닫기" style="height: 38px; min-width: 65px;">
        닫기
      </button>
    </div>
    
    <!-- 데이터 로드 완료 시 표출 영역 -->
    <div style="padding: 26px;" v-if="branchData">
      
      <!-- 상단 요약 그리드 (3칸 배치 고정) -->
      <div class="summary-grid" :style="{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }">
        <!-- 1. 위치 정보 -->
        <div class="summary-card">
          <div class="summary-icon blue">📍</div>
          <div>
            <span class="summary-label">분점 위치</span>
            <strong>{{ branchData.location || '-' }}</strong>
          </div>
        </div>
        
        <!-- 2. 키오스크 대수 -->
        <div class="summary-card">
          <div class="summary-icon orange">🖥️</div>
          <div>
            <span class="summary-label">총 키오스크 대수</span>
            <strong>{{ branchData.kiosks?.length || 0 }}대</strong>
          </div>
        </div>
        
        <!-- 3. 통합 운영 상태 -->
        <div class="summary-card">
          <div class="summary-icon green">📊</div>
          <div>
            <span class="summary-label">통합 운영 상태</span>
            <div style="margin-top: 4px;">
              <span :class="['status-badge', getStatusBadgeClass(branchData.status)]">
                <span class="status-dot"></span>
                {{ branchData.status || '정보 없음' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 키오스크 리스트 섹션 -->
      <h2 style="font-size: 18px; font-weight: 800; margin: 28px 0 16px; color: #253047;">
        🖥️ 개별 키오스크 기기 가동 현황
      </h2>
      
      <!-- 키오스크가 없을 때 -->
      <div v-if="!branchData.kiosks || branchData.kiosks.length === 0" class="table-state empty-state">
        <span>📭</span>
        <strong>등록된 기기 없음</strong>
        <p>이 분점에 등록된 키오스크 기기가 존재하지 않습니다.</p>
      </div>
      
      <!-- 🌟 수정 포인트: 테이블 열 정렬 및 너비 고정화 -->
      <div v-else class="table-container" style="border: 1px solid #edf1f5; border-radius: 12px; overflow: hidden;">
        <!-- table-layout: fixed를 주어 지정한 너비 비율이 강제 적용되도록 만듭니다 -->
        <table class="branch-table" style="min-width: 100%; table-layout: fixed;">
          <thead>
            <tr>
              <!-- 각 헤더(th)에 명확한 너비 비율(%)을 지정해 칸이 뒤죽박죽 섞이지 않게 잡았습니다 -->
              <th class="center" style="width: 10%;">번호</th>
              <th style="width: 30%;">기기 고유 ID</th>
              <th style="width: 35%;">기기 명칭</th>
              <th class="center" style="width: 25%;">가동 상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(kiosk, index) in branchData.kiosks" :key="kiosk.id">
              <td class="center">
                <span class="branch-id">{{ index + 1 }}</span>
              </td>
              <!-- text-overflow 속성 추가로 혹시 ID가 유독 길어져도 칸을 부수지 않도록 방어했습니다 -->
              <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <strong style="font-family: Consolas, monospace; color: #4f46e5;">{{ kiosk.id }}</strong>
              </td>
              <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <strong style="color: #253047;">{{ index + 1 }}호기 키오스크</strong>
              </td>
              <td class="center">
                <span :class="['status-badge', getKioskBadgeClass(kiosk.status)]">
                  <span class="status-dot"></span>
                  {{ kiosk.status || '알 수 없음' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
    
    <!-- 로딩 중일 때 -->
    <div class="table-state" v-else>
      <div class="spinner"></div>
      <p>분점 상세 데이터를 불러오는 중입니다...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

// 1. Props 및 Emits 선언
const props = defineProps({
  branchId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['close', 'refresh-list'])

// 2. 상태(State) 선언
const branchData = ref(null)
const API_URL = '/api/admin/branches'

// 3. API 통신 함수
const fetchBranchDetail = async (id) => {
  try {
    const cleanId = String(id).trim()
    console.log(`[BranchDetail] 백엔드 API 요청 시작 -> 주소: ${API_URL}/${cleanId}`)
    
    const response = await axios.get(`${API_URL}/${cleanId}`)
    branchData.value = response.data
    
    console.log('[BranchDetail] 백엔드 데이터 로드 성공:', response.data)
  } catch (error) {
    console.error('❌ [BranchDetail] 상세 정보 로드 실패!')
    if (error.response) {
      console.error(`- 에러 코드(Status): ${error.response.status}`)
      console.error('- 에러 내용(Data):', error.response.data)
    } else if (error.request) {
      console.error('- 서버로부터 응답을 받지 못했습니다. 백엔드가 가동 중인지 확인하세요.')
    } else {
      console.error('- 요청 설정 내부 에러:', error.message)
    }
    alert('상세 정보를 불러올 수 없습니다. 개발자 도구(F12) 콘솔 창을 확인해 주세요.')
  }
}

// 4. 관찰자(Watch) 설정
watch(() => props.branchId, (newId) => {
  if (newId) {
    console.log(`[BranchDetail] branchId 변경 감지 -> 새로운 ID: ${newId}`)
    fetchBranchDetail(newId)
  } else {
    branchData.value = null
  }
}, { immediate: true })

// 5. 컴포넌트 폐쇄 기능
const closeModal = () => {
  emit('close')
}

// 6. 통합 상태 클래스 매칭 기능
const getStatusBadgeClass = (status) => {
  if (!status) return 'empty'
  if (status === '정상') return 'normal'
  if (status.includes('대기')) return 'waiting'
  if (status.includes('중단')) return 'stopped'
  return 'empty'
}

// 7. 개별 키오스크 상태 클래스 매칭 기능
const getKioskBadgeClass = (status) => {
  if (!status) return 'empty'
  if (status === '정상') return 'normal'
  if (status === '장애' || status === '점검') return 'stopped'
  if (status === '꺼짐') return 'empty'
  return 'waiting'
}

// 부모 컴포넌트 제어용 노출
defineExpose({
  refresh: () => {
    if (props.branchId) fetchBranchDetail(props.branchId)
  }
})
</script>