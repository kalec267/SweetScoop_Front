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

      <!-- 🌟 키오스크 등록 영역 추가 -->
      <div class="kiosk-register-box" style="margin-top: 24px; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <div>
          <strong style="font-size: 15px; color: #1e293b; display: block; margin-bottom: 2px;">➕ 신규 키오스크 기기 추가</strong>
          <p style="font-size: 13px; color: #64748b; margin: 0;">해당 지점에 새 키오스크를 등록합니다. (기기 ID는 자동 발급)</p>
        </div>

        <form @submit.prevent="registerKiosk" style="display: flex; align-items: center; gap: 10px;">
          <select 
            v-model="newKioskStatus" 
            class="table-input" 
            style="padding: 8px 12px; height: 38px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #fff;"
          >
            <option value="정상">정상</option>
            <option value="점검">점검</option>
            <option value="장애">장애</option>
            <option value="꺼짐">꺼짐</option>
          </select>

          <button 
            type="submit" 
            class="primary-button" 
            :disabled="isSubmitting" 
            style="height: 38px; padding: 0 16px; font-size: 13px; white-space: nowrap;"
          >
            {{ isSubmitting ? '등록 중...' : '+ 키오스크 등록' }}
          </button>
        </form>
      </div>

      <!-- 하단 키오스크 리스트 섹션 -->
      <h2 style="font-size: 18px; font-weight: 800; margin: 28px 0 16px; color: #253047;">
        🖥️ 개별 키오스크 기기 가동 현황
      </h2>
      
      <!-- 키오스크가 없을 때 -->
      <div v-if="!branchData.kiosks || branchData.kiosks.length === 0" class="table-state empty-state">
        <span>📭</span>
        <strong>등록된 기기 없음</strong>
        <p>이 분점에 등록된 키오스크 기기가 존재하지 않습니다. 상단에서 추가해 주세요.</p>
      </div>
      
      <!-- 키오스크 목록 테이블 -->
      <div v-else class="table-container" style="border: 1px solid #edf1f5; border-radius: 12px; overflow: hidden;">
        <table class="branch-table" style="min-width: 100%; table-layout: fixed;">
          <thead>
            <tr>
              <th class="center" style="width: 10%;">번호</th>
              <th style="width: 20%;">기기 고유 ID</th>
              <th style="width: 25%;">기기 명칭</th>
              <th class="center" style="width: 20%;">가동 상태</th>
              <th class="center" style="width: 25%;">기기 관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(kiosk, index) in branchData.kiosks" :key="kiosk.id">
              <td class="center">
                <span class="branch-id">{{ index + 1 }}</span>
              </td>
              <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <strong style="font-family: Consolas, monospace; color: #4f46e5;">#{{ kiosk.id }}</strong>
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
              <!-- 🌟 변경된 부분: 드롭다운으로 원하는 상태 바로 선택 후 변경 -->
              <td class="center">
                <div class="action-group" style="justify-content: center; gap: 8px;">
                  <select 
                    :value="kiosk.status"
                    @change="onStatusChange(kiosk, $event.target.value)"
                    style="padding: 4px 8px; height: 32px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px; outline: none; background: #fff; cursor: pointer;"
                  >
                    <option value="정상">정상</option>
                    <option value="점검">점검</option>
                    <option value="장애">장애</option>
                    <option value="꺼짐">꺼짐</option>
                  </select>

                  <button 
                    type="button" 
                    class="action-button delete" 
                    style="padding: 4px 10px; font-size: 12px; height: 32px;"
                    @click="deleteKiosk(kiosk.id)"
                  >
                    삭제
                  </button>
                </div>
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
const newKioskStatus = ref('정상')
const isSubmitting = ref(false)

const API_BRANCH_URL = '/api/admin/branches'
const API_KIOSK_URL = '/api/admin/kiosks'

// 3. API 통신 함수 (상세 정보 조회)
const fetchBranchDetail = async (id) => {
  try {
    const cleanId = String(id).trim()
    console.log(`[BranchDetail] 백엔드 API 요청 시작 -> 주소: ${API_BRANCH_URL}/${cleanId}`)
    
    const response = await axios.get(`${API_BRANCH_URL}/${cleanId}`)
    branchData.value = response.data
    
    console.log('[BranchDetail] 백엔드 데이터 로드 성공:', response.data)
  } catch (error) {
    console.error('❌ [BranchDetail] 상세 정보 로드 실패!', error)
    alert('상세 정보를 불러올 수 없습니다. 개발자 도구(F12) 콘솔 창을 확인해 주세요.')
  }
}

// 4. 키오스크 등록 기능
const registerKiosk = async () => {
  if (!props.branchId) return

  isSubmitting.value = true
  try {
    await axios.post(`${API_BRANCH_URL}/${props.branchId}/kiosks`, {
      status: newKioskStatus.value
    })

    alert('신규 키오스크가 성공적으로 등록되었습니다.')
    newKioskStatus.value = '정상'
    
    // 상세 정보 및 메인 목록 동시 갱신
    await fetchBranchDetail(props.branchId)
    emit('refresh-list')
  } catch (error) {
    console.error('❌ 키오스크 등록 실패:', error)
    alert(error.response?.data?.message || '키오스크 등록 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// 5. 🌟 지정된 상태로 변경 기능 (드롭다운 선택 시 실행)
const onStatusChange = async (kiosk, newStatus) => {
  // 동일한 상태로 재선택된 경우 API 요청 취소
  if (kiosk.status === newStatus) return

  const confirmed = confirm(`키오스크 #${kiosk.id}의 상태를 [${newStatus}](으)로 변경하시겠습니까?`)
  if (!confirmed) {
    // 취소 시 화면을 기존 데이터로 원복하기 위해 재조회
    await fetchBranchDetail(props.branchId)
    return
  }

  try {
    await axios.patch(`${API_KIOSK_URL}/${kiosk.id}/status`, {
      status: newStatus
    })

    alert(`키오스크 #${kiosk.id}의 상태가 [${newStatus}](으)로 변경되었습니다.`)
    await fetchBranchDetail(props.branchId)
    emit('refresh-list')
  } catch (error) {
    console.error('❌ 키오스크 상태 변경 실패:', error)
    alert(error.response?.data?.message || '상태 변경 중 오류가 발생했습니다.')
    await fetchBranchDetail(props.branchId)
  }
}

// 6. 키오스크 삭제 기능
const deleteKiosk = async (kioskId) => {
  const confirmed = confirm(`키오스크 #${kioskId}를 삭제하시겠습니까?`)
  if (!confirmed) return

  try {
    await axios.delete(`${API_KIOSK_URL}/${kioskId}`)

    alert('키오스크가 삭제되었습니다.')
    await fetchBranchDetail(props.branchId)
    emit('refresh-list')
  } catch (error) {
    console.error('❌ 키오스크 삭제 실패:', error)
    alert(error.response?.data?.message || '키오스크 삭제 중 오류가 발생했습니다.')
  }
}

// 7. 관찰자(Watch) 설정
watch(() => props.branchId, (newId) => {
  if (newId) {
    console.log(`[BranchDetail] branchId 변경 감지 -> 새로운 ID: ${newId}`)
    fetchBranchDetail(newId)
  } else {
    branchData.value = null
  }
}, { immediate: true })

// 8. 컴포넌트 폐쇄 기능
const closeModal = () => {
  emit('close')
}

// 9. 통합 상태 클래스 매칭 기능
const getStatusBadgeClass = (status) => {
  if (!status) return 'empty'
  if (status === '정상') return 'normal'
  if (status.includes('대기') || status.includes('점검')) return 'waiting'
  if (status.includes('중단') || status.includes('장애')) return 'stopped'
  return 'empty'
}

// 10. 개별 키오스크 상태 클래스 매칭 기능
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