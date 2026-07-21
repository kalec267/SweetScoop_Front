<template>
  <!-- v-if 조건부 렌더링 및 .detail-section 클래스 적용 -->
  <div v-if="branchId" class="detail-section content-card">
    <!-- 카드 헤더 -->
    <div class="card-heading" style="border-bottom: 1px solid rgba(219, 226, 234, 0.5); align-items: center;">
      <div>
        <h2>🎯 {{ branchData?.branchName || '로딩 중...' }} 상세 정보</h2>
        <p>분점의 상세 위치, 등록된 점주 계정 목록 및 개별 키오스크 가동 현황을 관리합니다.</p>
      </div>
      <button @click="closeModal" class="action-button cancel" style="height: 38px; min-width: 65px;">닫기</button>
    </div>

    <div style="padding: 26px;" v-if="branchData">
      <!-- 요약 그리드 (위치 / 대수 / 상태) -->
      <div class="summary-grid" :style="{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }">
        <div class="summary-card">
          <div class="summary-icon blue">📍</div>
          <div>
            <span class="summary-label">분점 위치</span>
            <strong>{{ branchData.location || '-' }}</strong>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon orange">🖥️</div>
          <div>
            <span class="summary-label">총 키오스크 대수</span>
            <strong>{{ branchData.kiosks?.length || 0 }}대</strong>
          </div>
        </div>
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

      <!-- 👥 분점 점주 계정 목록 & 선택 수정/삭제 영역 -->
      <div class="manager-section" style="margin-top: 28px; padding: 22px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h3 style="font-size: 17px; font-weight: 800; color: #1e293b; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">
          👥 등록된 점주 계정 목록
        </h3>

        <!-- 점주 목록 테이블 -->
        <div class="table-container" style="border: 1px solid #edf1f5; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          <table class="branch-table" style="width: 100%; table-layout: fixed;">
            <thead>
              <tr>
                <th style="width: 15%;">계정 고유ID</th>
                <th style="width: 25%;">로그인 아이디</th>
                <th style="width: 25%;">점주 성명</th>
                <th class="center" style="width: 35%;">계정 관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!branchData.managers || branchData.managers.length === 0">
                <td colspan="4" class="empty-td" style="text-align: center; padding: 20px; color: #94a3b8;">
                  등록된 점주 계정이 없습니다. 아래에서 새로 등록하세요.
                </td>
              </tr>
              <tr 
                v-for="mgr in branchData.managers" 
                :key="mgr.id"
                :style="{ background: selectedManagerId === mgr.id ? '#f0f9ff' : 'transparent' }"
              >
                <td><strong style="font-family: Consolas, monospace; color: #4f46e5;">{{ mgr.id }}</strong></td>
                <td>{{ mgr.loginId || '(아이디 없음)' }}</td>
                <td><strong>{{ mgr.name || '(이름 없음)' }}</strong></td>
                <td class="center">
                  <div class="action-group" style="justify-content: center; gap: 8px;">
                    <button 
                      type="button" 
                      class="action-button edit" 
                      style="padding: 4px 12px; font-size: 12px; height: 32px;"
                      @click="selectManagerForEdit(mgr)"
                    >
                      선택 수정
                    </button>
                    <button 
                      type="button" 
                      class="action-button delete" 
                      style="padding: 4px 12px; font-size: 12px; height: 32px;"
                      @click="deleteManagerAccount(mgr.id, mgr.name)"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 선택된 점주 정보 수정 / 신규 등록 폼 -->
        <form @submit.prevent="saveManagerInfo" style="background: #f8fafc; padding: 18px; border-radius: 10px; border: 1px solid #f1f5f9;">
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 14px; color: #334155;">
              {{ selectedManagerId ? `✏️ [${selectedManagerId}] 계정 정보 수정` : '➕ 신규 점주 계정 추가' }}
            </strong>
            <button 
              v-if="selectedManagerId" 
              type="button" 
              @click="resetManagerForm"
              style="background: none; border: none; color: #64748b; font-size: 12px; cursor: pointer; text-decoration: underline;"
            >
              초기화 (신규 추가 모드로 전환)
            </button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 12px; font-weight: 600; color: #475569;">점주 성명</label>
              <input 
                v-model.trim="managerForm.name" 
                type="text" 
                placeholder="점주 이름 입력" 
                style="padding: 8px 12px; height: 36px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px;"
                required 
              />
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label style="font-size: 12px; font-weight: 600; color: #475569;">로그인 아이디</label>
              <input 
                v-model.trim="managerForm.loginId" 
                type="text" 
                placeholder="아이디 입력" 
                style="padding: 8px 12px; height: 36px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px;"
                required 
              />
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 10px;">
            <label style="font-size: 12px; font-weight: 600; color: #475569;">
              비밀번호 {{ selectedManagerId ? '변경 (미입력 시 기존 유비)' : '설정' }}
            </label>
            <input 
              v-model="managerForm.password" 
              type="password" 
              placeholder="비밀번호 입력" 
              style="padding: 8px 12px; height: 36px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px;"
              :required="!selectedManagerId"
            />
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
            <button type="submit" class="primary-button" style="height: 36px; padding: 0 18px; font-size: 13px;">
              {{ selectedManagerId ? '점주 정보 수정 저장' : '새 점주 계정 등록' }}
            </button>
          </div>
        </form>
      </div>

      <!-- ➕ 신규 키오스크 기기 추가 영역 -->
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

      <!-- 개별 키오스크 기기 가동 현황 테이블 -->
      <h2 style="font-size: 18px; font-weight: 800; margin: 28px 0 16px; color: #253047;">
        🖥️ 개별 키오스크 기기 가동 현황
      </h2>
      
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

const props = defineProps({
  branchId: { type: [Number, String], default: null }
})
const emit = defineEmits(['close', 'refresh-list'])

const branchData = ref(null)
const selectedManagerId = ref(null)

// 키오스크 관련 상태
const newKioskStatus = ref('정상')
const isSubmitting = ref(false)

// 점주 계정 폼
const managerForm = ref({
  loginId: '',
  name: '',
  password: ''
})

const API_BRANCH_URL = '/api/admin/branches'
const API_KIOSK_URL = '/api/admin/kiosks'

// 상세 정보 조회
const fetchBranchDetail = async (id) => {
  try {
    const res = await axios.get(`${API_BRANCH_URL}/${id}`)
    branchData.value = res.data
  } catch (err) {
    console.error('상세 정보 불러오기 실패:', err)
  }
}

// 점주 선택 수정
const selectManagerForEdit = (mgr) => {
  selectedManagerId.value = mgr.id
  managerForm.value = {
    loginId: mgr.loginId || '',
    name: mgr.name || '',
    password: ''
  }
}

// 폼 초기화
const resetManagerForm = () => {
  selectedManagerId.value = null
  managerForm.value = { loginId: '', name: '', password: '' }
}

// 점주 저장 (수정 또는 등록)
const saveManagerInfo = async () => {
  try {
    await axios.put(`${API_BRANCH_URL}/${props.branchId}/manager`, {
      managerId: selectedManagerId.value,
      loginId: managerForm.value.loginId,
      name: managerForm.value.name,
      password: managerForm.value.password
    })

    alert(selectedManagerId.value ? '점주 정보가 수정되었습니다.' : '새 점주 계정이 등록되었습니다.')
    resetManagerForm()
    await fetchBranchDetail(props.branchId)
    emit('refresh-list')
  } catch (err) {
    alert('점주 정보 저장에 실패했습니다.')
  }
}

// 점주 개별 삭제
const deleteManagerAccount = async (managerId, name) => {
  if (!confirm(`점주 계정 [${name || managerId}]을 삭제하시겠습니까?`)) return

  try {
    await axios.delete(`/api/admin/branches/managers/${managerId}`)
    alert('점주 계정이 삭제되었습니다.')
    if (selectedManagerId.value === managerId) resetManagerForm()
    await fetchBranchDetail(props.branchId)
    emit('refresh-list')
  } catch (err) {
    alert('점주 계정 삭제 중 오류가 발생했습니다.')
  }
}

// 키오스크 신규 등록
const registerKiosk = async () => {
  if (!props.branchId) return

  isSubmitting.value = true
  try {
    await axios.post(`${API_BRANCH_URL}/${props.branchId}/kiosks`, {
      status: newKioskStatus.value
    })

    alert('신규 키오스크가 성공적으로 등록되었습니다.')
    newKioskStatus.value = '정상'
    await fetchBranchDetail(props.branchId)
    emit('refresh-list')
  } catch (error) {
    console.error('❌ 키오스크 등록 실패:', error)
    alert(error.response?.data?.message || '키오스크 등록 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// 키오스크 상태 변경
const onStatusChange = async (kiosk, newStatus) => {
  if (kiosk.status === newStatus) return

  const confirmed = confirm(`키오스크 #${kiosk.id}의 상태를 [${newStatus}](으)로 변경하시겠습니까?`)
  if (!confirmed) {
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

// 키오스크 삭제
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

// 뱃지 상태 매칭 함수
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

watch(() => props.branchId, (newId) => {
  if (newId) fetchBranchDetail(newId)
}, { immediate: true })

const closeModal = () => emit('close')

defineExpose({
  refresh: () => {
    if (props.branchId) fetchBranchDetail(props.branchId)
  }
})
</script>