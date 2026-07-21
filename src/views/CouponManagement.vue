<template>
  <div class="coupon-management">
    <h2>🎫 쿠폰 및 혜택 관리</h2>

    <!-- [상단] 새 쿠폰 템플릿 등록 폼 -->
    <div class="card create-card">
      <h3>신규 쿠폰 템플릿 등록</h3>
      <form @submit.prevent="handleCreateTemplate" class="form-grid">
        <div class="form-group">
          <label>쿠폰명</label>
          <input 
            v-model="newCoupon.name" 
            type="text" 
            placeholder="예: [여름특가] 2,000원 할인쿠폰" 
            required 
          />
        </div>
        <div class="form-group">
          <label>할인 금액(원)</label>
          <input 
            v-model.number="newCoupon.discountValue" 
            type="number" 
            placeholder="2000" 
            required 
          />
        </div>
        <div class="form-group">
          <label>유효 기간(일)</label>
          <input 
            v-model.number="newCoupon.validDays" 
            type="number" 
            placeholder="30" 
            required 
          />
        </div>
        <button type="submit" class="btn btn-primary">쿠폰 생성</button>
      </form>
    </div>

    <!-- [중단] 탭 전환 (템플릿 쿠폰 vs 회원 발급 쿠폰) -->
    <div class="tab-menu">
      <button 
        :class="{ active: activeTab === 'templates' }" 
        @click="activeTab = 'templates'"
      >
        📌 발급 대기 쿠폰 템플릿 (미연결)
      </button>
      <button 
        :class="{ active: activeTab === 'issued' }" 
        @click="activeTab = 'issued'"
      >
        👥 회원 연결/발급된 쿠폰
      </button>
    </div>

    <!-- TAB 1: 미연결 템플릿 쿠폰 목록 (지급 / 수정 / 삭제 가능) -->
    <div v-if="activeTab === 'templates'" class="card">
      <h3>등록된 쿠폰 템플릿</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>쿠폰 ID</th>
            <th>쿠폰명</th>
            <th>할인 혜택</th>
            <th>지급 및 관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="coupon in templateCoupons" :key="coupon.id">
            <td>{{ coupon.id }}</td>
            <td><strong>{{ coupon.name }}</strong></td>
            <td>{{ coupon.discountValue?.toLocaleString() }}원</td>
            <td>
              <div class="btn-group">
                <button class="btn btn-sm btn-success" @click="openIssueModal(coupon)">
                  🎁 회원 다중 지급
                </button>
                <button class="btn btn-sm btn-warning" @click="openEditModal(coupon)">
                  ✏️ 수정
                </button>
                <button class="btn btn-sm btn-danger" @click="handleDeleteTemplate(coupon.id)">
                  🗑️ 삭제
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="templateCoupons.length === 0">
            <td colspan="4" class="empty">등록된 미연결 쿠폰 템플릿이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TAB 2: 회원 연결/발급 내역 -->
    <div v-if="activeTab === 'issued'" class="card">
      <h3>회원 보유 쿠폰 내역</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>쿠폰 ID</th>
            <th>회원 ID</th>
            <th>쿠폰명</th>
            <th>할인 금액</th>
            <th>발급일</th>
            <th>만료일</th>
            <th>사용 여부</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="coupon in issuedCoupons" :key="coupon.id">
            <td>{{ coupon.id }}</td>
            <td><span class="badge badge-member">Member #{{ coupon.memberId }}</span></td>
            <td>{{ coupon.name }}</td>
            <td>{{ coupon.discountValue?.toLocaleString() }}원</td>
            <td>{{ formatDate(coupon.issueDate) }}</td>
            <td>{{ formatDate(coupon.expiryDate) }}</td>
            <td>
              <span :class="['badge', coupon.isUsed ? 'badge-used' : 'badge-active']">
                {{ coupon.isUsed ? '사용완료' : '미사용' }}
              </span>
            </td>
          </tr>
          <tr v-if="issuedCoupons.length === 0">
            <td colspan="7" class="empty">발급된 회원 쿠폰 내역이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- [모달 1] 다중 회원 쿠폰 일괄 지급 모달 -->
    <div v-if="showIssueModal" class="modal-backdrop" @click.self="closeIssueModal">
      <div class="modal-content">
        <h3>🎁 다중 회원 쿠폰 일괄 발급</h3>
        <p class="modal-subtitle">
          선택한 쿠폰: <strong>{{ selectedTemplate?.name }}</strong>
        </p>

        <div class="member-select-section">
          <div class="select-all">
            <label>
              <input type="checkbox" v-model="isAllSelected" />
              <strong>전체 회원 선택</strong>
            </label>
          </div>
          <div class="member-list">
            <div v-for="member in memberList" :key="member.id" class="member-item">
              <label>
                <input 
                  type="checkbox" 
                  :value="member.id" 
                  v-model="selectedMemberIds" 
                />
                회원 #{{ member.id }} ({{ member.phoneNumber || '연락처 없음' }})
              </label>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeIssueModal">취소</button>
          <button 
            class="btn btn-primary" 
            :disabled="selectedMemberIds.length === 0"
            @click="handleBulkIssue"
          >
            {{ selectedMemberIds.length }}명에게 일괄 발급
          </button>
        </div>
      </div>
    </div>

    <!-- [모달 2] 쿠폰 템플릿 정보 수정 모달 -->
    <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal-content">
        <h3>✏️ 쿠폰 템플릿 수정</h3>
        
        <form @submit.prevent="handleUpdateTemplate" class="modal-form">
          <div class="form-group">
            <label>쿠폰명</label>
            <input v-model="editForm.name" type="text" required />
          </div>

          <div class="form-group">
            <label>할인 금액(원)</label>
            <input v-model.number="editForm.discountValue" type="number" required />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeEditModal">취소</button>
            <button type="submit" class="btn btn-primary">수정 완료</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// --- 상태 변수 ---
const activeTab = ref('templates') // 'templates' | 'issued'
const allCoupons = ref([])
const memberList = ref([])

// 신규 템플릿 입력 폼
const newCoupon = ref({
  name: '',
  discountValue: null,
  validDays: 30
})

// [지급 모달] 관련 상태
const showIssueModal = ref(false)
const selectedTemplate = ref(null)
const selectedMemberIds = ref([])

// [수정 모달] 관련 상태
const showEditModal = ref(false)
const editingCouponId = ref(null)
const editForm = ref({
  name: '',
  discountValue: null
})

// --- Computed ---
// 1. memberId가 null인 템플릿 쿠폰
const templateCoupons = computed(() => {
  return allCoupons.value.filter(c => c.memberId === null)
})

// 2. memberId가 존재하는 발급된 쿠폰
const issuedCoupons = computed(() => {
  return allCoupons.value.filter(c => c.memberId !== null)
})

// 전체 회원 선택 체크박스 바인딩
const isAllSelected = computed({
  get() {
    return memberList.value.length > 0 && selectedMemberIds.value.length === memberList.value.length
  },
  set(value) {
    if (value) {
      selectedMemberIds.value = memberList.value.map(m => m.id)
    } else {
      selectedMemberIds.value = []
    }
  }
})

// --- API 통신 메서드 ---

// 데이터 로드
const fetchData = async () => {
  try {
    const [membersRes, couponsRes] = await Promise.all([
      axios.get('/api/admin/members'),
      axios.get('/api/admin/coupons/all')
    ])
    memberList.value = membersRes.data
    allCoupons.value = couponsRes.data
  } catch (error) {
    console.error('데이터 조회 실패:', error)
  }
}

// 템플릿 등록
const handleCreateTemplate = async () => {
  try {
    const res = await axios.post('/api/admin/coupons/template', newCoupon.value)
    alert('쿠폰 템플릿이 등록되었습니다!')
    allCoupons.value.unshift(res.data)
    newCoupon.value = { name: '', discountValue: null, validDays: 30 }
  } catch (error) {
    alert('쿠폰 등록 실패: ' + (error.response?.data?.message || error.message))
  }
}

// 다중 회원 쿠폰 일괄 발급
const handleBulkIssue = async () => {
  if (selectedMemberIds.value.length === 0) return

  try {
    const issuePromises = selectedMemberIds.value.map(memberId =>
      axios.post(`/api/admin/coupons/issue?couponId=${selectedTemplate.value.id}&memberId=${memberId}`)
    )

    await Promise.all(issuePromises)

    alert(`${selectedMemberIds.value.length}명의 회원에게 쿠폰이 발급되었습니다!`)
    closeIssueModal()
    fetchData()
    activeTab.value = 'issued'
  } catch (error) {
    alert('쿠폰 발급 중 오류가 발생했습니다.')
  }
}

// 템플릿 수정
const handleUpdateTemplate = async () => {
  try {
    const res = await axios.put(`/api/admin/coupons/template/${editingCouponId.value}`, editForm.value)
    alert('쿠폰 템플릿이 수정되었습니다.')

    const index = allCoupons.value.findIndex(c => c.id === editingCouponId.value)
    if (index !== -1) {
      allCoupons.value[index] = res.data
    }

    closeEditModal()
  } catch (error) {
    alert('수정 실패: ' + (error.response?.data?.message || error.message))
  }
}

// 템플릿 삭제
const handleDeleteTemplate = async (couponId) => {
  if (!confirm(`ID [${couponId}] 쿠폰 템플릿을 삭제하시겠습니까?`)) return

  try {
    await axios.delete(`/api/admin/coupons/template/${couponId}`)
    alert('쿠폰 템플릿이 삭제되었습니다.')
    allCoupons.value = allCoupons.value.filter(c => c.id !== couponId)
  } catch (error) {
    alert('삭제 실패: ' + (error.response?.data?.message || error.message))
  }
}

// --- 모달 제어 ---
const openIssueModal = (template) => {
  selectedTemplate.value = template
  selectedMemberIds.value = []
  showIssueModal.value = true
}

const closeIssueModal = () => {
  showIssueModal.value = false
  selectedTemplate.value = null
  selectedMemberIds.value = []
}

const openEditModal = (coupon) => {
  editingCouponId.value = coupon.id
  editForm.value = {
    name: coupon.name,
    discountValue: coupon.discountValue
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingCouponId.value = null
  editForm.value = { name: '', discountValue: null }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.coupon-management {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Pretendard', sans-serif;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  margin-bottom: 24px;
}

.create-card {
  border-left: 5px solid #ff6b6b;
}

.form-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

input[type="text"], input[type="number"] {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

/* 탭 메뉴 */
.tab-menu {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-menu button {
  padding: 12px 20px;
  border: none;
  background: #e9ecef;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-menu button.active {
  background: #ff6b6b;
  color: white;
}

/* 테이블 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.data-table th, .data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
  color: #495057;
}

.empty {
  text-align: center;
  color: #888;
  padding: 30px;
}

/* 뱃지 */
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.badge-member { background: #e7f5ff; color: #1c7ed6; }
.badge-active { background: #e6fcf5; color: #0ca678; }
.badge-used { background: #f1f3f5; color: #868e96; }

/* 버튼 그룹 */
.btn-group {
  display: flex;
  gap: 6px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}
.btn-primary { background: #ff6b6b; color: white; }
.btn-secondary { background: #ced4da; color: #333; }
.btn-success { background: #51cf66; color: white; }
.btn-warning { background: #fcc419; color: #333; }
.btn-danger { background: #ff8787; color: white; }

.btn:hover { opacity: 0.9; }
.btn-sm { padding: 6px 12px; font-size: 13px; }

/* 모달 */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 450px;
  max-width: 90%;
}

.modal-subtitle {
  color: #666;
  margin-bottom: 16px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.member-select-section {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.select-all {
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
}

.member-item {
  padding: 6px 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>