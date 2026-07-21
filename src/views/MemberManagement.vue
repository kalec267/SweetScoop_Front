<template>
  <div class="member-management">
    <!-- 헤더 영역 -->
    <div class="header-area">
      <div>
        <h2>👥 회원 관리</h2>
        <p class="subtitle">등록된 회원의 포인트, 주문 횟수 및 보유 쿠폰을 관리합니다.</p>
      </div>
      <button class="btn btn-refresh" @click="fetchMembers" :disabled="loading">
        🔄 목록 새로고침
      </button>
    </div>

    <!-- 통계 요약 카드 -->
    <div class="summary-cards">
      <div class="summary-card">
        <span class="card-label">총 회원 수</span>
        <span class="card-value">{{ members.length.toLocaleString() }}명</span>
      </div>
      <div class="summary-card">
        <span class="card-label">총 누적 포인트</span>
        <span class="card-value highlight">{{ totalPoints.toLocaleString() }} P</span>
      </div>
      <div class="summary-card">
        <span class="card-label">총 주문 횟수</span>
        <span class="card-value">{{ totalOrders.toLocaleString() }}회</span>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="card search-card">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="회원 ID 또는 전화번호 검색..." 
        />
        <button v-if="searchQuery" class="btn-clear" @click="searchQuery = ''">✕</button>
      </div>
    </div>

    <!-- 회원 테이블 -->
    <div class="card table-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>DB에서 회원 정보를 불러오는 중입니다...</p>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>회원 ID</th>
            <th>전화번호</th>
            <th>주문 횟수</th>
            <th>보유 포인트</th>
            <th>가입 일시</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in filteredMembers" :key="member.id">
            <td><strong>#{{ member.id }}</strong></td>
            <td class="phone-number">{{ formatPhoneNumber(member.phoneNumber) }}</td>
            <td><strong>{{ member.orderCount?.toLocaleString() || 0 }}</strong> 회</td>
            <td><span class="point-tag">{{ member.point?.toLocaleString() || 0 }} P</span></td>
            <td>{{ formatDate(member.createdAt) }}</td>
            <td>
              <button class="btn btn-sm btn-outline" @click="openDetailModal(member)">
                📄 상세
              </button>
            </td>
          </tr>
          <tr v-if="filteredMembers.length === 0">
            <td colspan="7" class="empty">
              {{ searchQuery ? '검색 결과와 일치하는 회원이 없습니다.' : '등록된 회원이 없습니다.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- [모달] 회원 상세 정보 & 보유 쿠폰 관리 + 즉시 발급 -->
    <div v-if="showDetailModal" class="modal-backdrop" @click.self="closeDetailModal">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>📄 회원 상세 정보 및 쿠폰 관리</h3>
          <button class="close-btn" @click="closeDetailModal">✕</button>
        </div>
        
        <div v-if="selectedMember" class="modal-body">
          <!-- 1. 회원 기본 정보 -->
          <div class="section-title">👤 회원 기본 정보</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">회원 ID</span>
              <span class="value">#{{ selectedMember.id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Customer ID</span>
              <span class="value">{{ selectedMember.customerId }}</span>
            </div>
            <div class="detail-item">
              <span class="label">전화번호</span>
              <span class="value">{{ formatPhoneNumber(selectedMember.phoneNumber) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">주문 횟수</span>
              <span class="value">{{ selectedMember.orderCount }} 회</span>
            </div>
            <div class="detail-item">
              <span class="label">포인트</span>
              <span class="value point">{{ selectedMember.point?.toLocaleString() }} P</span>
            </div>
            <div class="detail-item">
              <span class="label">가입일시</span>
              <span class="value">{{ formatDate(selectedMember.createdAt) }}</span>
            </div>
          </div>

          <hr class="divider" />

          <!-- 2. 쿠폰 수동 즉시 발급 섹션 -->
          <div class="section-title">🎁 회원 대상 쿠폰 즉시 발급</div>
          <div class="issue-box">
            <select v-model="selectedCouponId" class="coupon-select">
              <option :value="null" disabled>발급할 쿠폰 템플릿을 선택하세요</option>
              <option 
                v-for="template in couponTemplates" 
                :key="template.id" 
                :value="template.id"
              >
                [{{ template.id }}] {{ template.name }} ({{ template.discountValue?.toLocaleString() }}원 할인)
              </option>
            </select>
            <button 
              class="btn btn-primary" 
              @click="handleDirectIssueCoupon" 
              :disabled="!selectedCouponId || issueLoading"
            >
              {{ issueLoading ? '발급 중...' : '🎁 즉시 발급' }}
            </button>
          </div>

          <hr class="divider" />

          <!-- 3. 보유 쿠폰 목록 및 관리 -->
          <div class="coupon-header">
            <div class="section-title">🎟️ 보유 쿠폰 목록 (총 {{ memberCoupons.length }}개)</div>
            <button class="btn btn-sm btn-refresh" @click="fetchMemberCoupons(selectedMember.id)">
              🔄 쿠폰 새로고침
            </button>
          </div>

          <div v-if="couponLoading" class="loading-state">
            쿠폰 정보를 불러오는 중입니다...
          </div>

          <div v-else class="coupon-list-container">
            <table class="data-table mini-table">
              <thead>
                <tr>
                  <th>쿠폰 ID</th>
                  <th>쿠폰명</th>
                  <th>할인 금액</th>
                  <th>사용 여부</th>
                  <th>만료일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="coupon in memberCoupons" :key="coupon.id">
                  <td>#{{ coupon.id }}</td>
                  <td><strong>{{ coupon.name }}</strong></td>
                  <td>{{ coupon.discountValue?.toLocaleString() }}원</td>
                  <td>
                    <span :class="['badge', coupon.isUsed ? 'badge-used' : 'badge-active']">
                      {{ coupon.isUsed ? '사용완료' : '미사용' }}
                    </span>
                  </td>
                  <td>{{ formatDate(coupon.expiryDate) }}</td>
                  <td>
                    <button 
                      class="btn btn-sm btn-danger" 
                      @click="handleDeleteMemberCoupon(coupon.id)"
                      :disabled="coupon.isUsed"
                    >
                      🗑️ 회수(삭제)
                    </button>
                  </td>
                </tr>
                <tr v-if="memberCoupons.length === 0">
                  <td colspan="6" class="empty">회원이 보유한 쿠폰이 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeDetailModal">닫기</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// --- 상태 변수 ---
const members = ref([])
const loading = ref(false)
const searchQuery = ref('')

// 모달 및 쿠폰 관련 상태
const showDetailModal = ref(false)
const selectedMember = ref(null)
const memberCoupons = ref([])
const couponTemplates = ref([]) // 발급 가능한 쿠폰 템플릿 목록
const selectedCouponId = ref(null) // 선택된 쿠폰 ID
const couponLoading = ref(false)
const issueLoading = ref(false)

// --- 통계 계산 ---
const totalPoints = computed(() => members.value.reduce((sum, m) => sum + (m.point || 0), 0))
const totalOrders = computed(() => members.value.reduce((sum, m) => sum + (m.orderCount || 0), 0))

// ✨ [수정] DB 회원 목록 가져오기 (customerId === 1 인 회원만 필터링)
const fetchMembers = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/admin/members')
    const allMembers = response.data || []
    
    // customerId가 1인 실제 회원만 필터링 (비회원 customerId === 2 제외)
    members.value = allMembers.filter(m => m.customerId === 1)
  } catch (error) {
    console.error('회원 목록 조회 실패:', error)
    alert('DB에서 회원 정보를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

// --- 전체 쿠폰 조회 및 회원의 쿠폰 / 템플릿 구분 ---
const fetchMemberCoupons = async (memberId) => {
  couponLoading.value = true
  try {
    const res = await axios.get('/api/admin/coupons/all')
    const all = res.data || []
    
    // 1. 해당 회원이 보유한 쿠폰 필터링
    memberCoupons.value = all.filter(c => c.memberId === memberId)
    
    // 2. 발급 가능한 미연결 템플릿 쿠폰 필터링
    couponTemplates.value = all.filter(c => c.memberId === null)
  } catch (error) {
    console.error('쿠폰 조회 실패:', error)
    alert('쿠폰 정보를 가져오지 못했습니다.')
  } finally {
    couponLoading.value = false
  }
}

// 회원의 개별 쿠폰 즉시 발급 요청
const handleDirectIssueCoupon = async () => {
  if (!selectedCouponId.value || !selectedMember.value) return

  const targetCoupon = couponTemplates.value.find(t => t.id === selectedCouponId.value)
  if (!confirm(`[${targetCoupon?.name || '선택 쿠폰'}]을(를) 회원 #${selectedMember.value.id}에게 발급하시겠습니까?`)) {
    return
  }

  issueLoading.value = true
  try {
    await axios.post(`/api/admin/coupons/issue?couponId=${selectedCouponId.value}&memberId=${selectedMember.value.id}`)
    alert('쿠폰이 성공적으로 발급되었습니다!')
    
    selectedCouponId.value = null
    await fetchMemberCoupons(selectedMember.value.id)
  } catch (error) {
    alert('쿠폰 발급 실패: ' + (error.response?.data?.message || error.message))
  } finally {
    issueLoading.value = false
  }
}

// 회원 보유 쿠폰 회수(삭제)
const handleDeleteMemberCoupon = async (couponId) => {
  if (!confirm(`쿠폰 [#${couponId}]을(를) 정말 회수/삭제하시겠습니까?`)) return

  try {
    await axios.delete(`/api/admin/coupons/${couponId}`)
    alert('쿠폰이 성공적으로 회수(삭제)되었습니다.')
    memberCoupons.value = memberCoupons.value.filter(c => c.id !== couponId)
  } catch (error) {
    alert('쿠폰 삭제 실패: ' + (error.response?.data?.message || error.message))
  }
}

// --- 검색 필터링 ---
const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) return members.value
  const query = searchQuery.value.replace(/[^0-9]/g, '')
  const rawQuery = searchQuery.value.toLowerCase().trim()

  return members.value.filter(m => {
    const id = String(m.id)
    const customerId = String(m.customerId || '')
    const phone = m.phoneNumber || ''
    return id.includes(rawQuery) || customerId.includes(rawQuery) || phone.includes(query)
  })
})

// --- 포맷터 함수들 ---
const formatPhoneNumber = (phone) => {
  if (!phone) return '-'
  const clean = phone.replace(/[^0-9]/g, '')
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  if (clean.length === 10) return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  return phone
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// --- 모달 제어 ---
const openDetailModal = (member) => {
  selectedMember.value = member
  selectedCouponId.value = null
  showDetailModal.value = true
  fetchMemberCoupons(member.id)
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedMember.value = null
  memberCoupons.value = []
  selectedCouponId.value = null
}

onMounted(() => {
  fetchMembers()
})
</script>

<style scoped>
.member-management {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Pretendard', sans-serif;
}

.header-area {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }

/* 통계 카드 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.summary-card {
  background: white; border-radius: 12px; padding: 16px 20px;
  display: flex; flex-direction: column; gap: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #edf2f7;
}
.card-label { font-size: 13px; color: #718096; font-weight: 600; }
.card-value { font-size: 22px; font-weight: 800; color: #2d3748; }
.card-value.highlight { color: #ff6b6b; }

/* 테이블 및 카드 */
.card {
  background: white; border-radius: 12px; padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04); border: 1px solid #edf2f7; margin-bottom: 20px;
}
.search-bar { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px 12px; }
.search-bar input { flex: 1; border: none; background: transparent; padding: 10px 0; outline: none; }
.btn-clear { background: none; border: none; color: #a0aec0; cursor: pointer; }

.table-card { padding: 0; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
.data-table th { background: #f8fafc; color: #475569; font-weight: 600; }

.phone-number { font-family: monospace; font-weight: 600; }
.point-tag { color: #d97706; background: #fffbe2; padding: 4px 8px; border-radius: 6px; font-weight: bold; }

/* 뱃지 */
.badge { padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.badge-customer { background: #e0f2fe; color: #0369a1; }
.badge-active { background: #e6fcf5; color: #0ca678; }
.badge-used { background: #f1f3f5; color: #868e96; }

/* 모달 스타일 */
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content.large-modal {
  background: white; padding: 24px; border-radius: 12px;
  width: 720px; max-width: 90%; max-height: 85vh; overflow-y: auto;
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #999; }

.section-title { font-weight: 700; font-size: 15px; margin-bottom: 12px; color: #2d3748; }
.detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
.detail-item { display: flex; justify-content: space-between; background: #f8fafc; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
.detail-item .label { color: #64748b; }
.detail-item .value { font-weight: 600; }

.divider { border: none; border-top: 1px solid #edf2f7; margin: 20px 0; }

/* 발급 박스 스타일 */
.issue-box {
  display: flex;
  gap: 10px;
  background: #fff5f5;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ffe3e3;
  align-items: center;
}

.coupon-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: white;
}

.coupon-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.mini-table th, .mini-table td { padding: 10px 12px; font-size: 13px; }

/* 버튼 스타일 */
.btn { padding: 8px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-primary { background: #ff6b6b; color: white; }
.btn-primary:disabled { background: #ffa8a8; cursor: not-allowed; }
.btn-refresh { background: #ffffff; border: 1px solid #cbd5e1; color: #475569; }
.btn-outline { background: white; border: 1px solid #cbd5e1; color: #334155; }
.btn-secondary { background: #e2e8f0; color: #334155; }
.btn-danger { background: #ff8787; color: white; }
.btn-danger:disabled { background: #e9ecef; color: #adb5bd; cursor: not-allowed; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 20px; }

.loading-state, .empty { text-align: center; padding: 20px; color: #64748b; }
.spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #ff6b6b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>