<template>
  <div class="dashboard-container">
    <!-- 대시보드 헤더 -->
    <div class="page-header">
      <div>
        <h2>📊 본사 통합 대시보드</h2>
        <p>Sweet Scoop 전체 시스템의 핵심 현황을 한눈에 요약 확인하고 빠르게 이동합니다.</p>
      </div>
      <div class="current-time">
        <span>⏰ 기준 시각: {{ currentTime }}</span>
      </div>
    </div>

    <!-- 1. 상단 핵심 KPI 요약 카드 -->
    <div class="kpi-grid">
      <!-- 🏢 본사 발주 승인 대기 -->
      <router-link to="/inventory/hq-orders" class="kpi-card warning-card">
        <div class="kpi-icon">🏢</div>
        <div class="kpi-info">
          <span class="label">본사 발주 승인 대기</span>
          <div class="value-group">
            <span class="number">{{ pendingOrdersCount }}</span>
            <span class="unit">건</span>
          </div>
          <span class="sub-text highlight">⚡ 즉시 승인 필요</span>
        </div>
      </router-link>

      <!-- 🚚 배송 관리 요약 -->
      <router-link to="/delivery" class="kpi-card blue-card">
        <div class="kpi-icon">🚚</div>
        <div class="kpi-info">
          <span class="label">현재 배송 진행 중</span>
          <div class="value-group">
            <span class="number">{{ shippingCount }}</span>
            <span class="unit">건</span>
          </div>
          <span class="sub-text">배송 완료 {{ completedDeliveryCount }}건 오늘</span>
        </div>
      </router-link>

      <!-- 🏪 분점 관리 요약 -->
      <router-link to="/admin/branches" class="kpi-card purple-card">
        <div class="kpi-icon">🏪</div>
        <div class="kpi-info">
          <span class="label">운영 중인 전체 분점</span>
          <div class="value-group">
            <span class="number">{{ totalBranchesCount }}</span>
            <span class="unit">개 점포</span>
          </div>
          <span class="sub-text">전점 정상 가동 중</span>
        </div>
      </router-link>

      <!-- 📈 전체 매출 통계 요약 -->
      <router-link to="/sales" class="kpi-card green-card">
        <div class="kpi-icon">📈</div>
        <div class="kpi-info">
          <span class="label">금일 전체 매출</span>
          <div class="value-group">
            <span class="number">{{ todaySales.toLocaleString() }}</span>
            <span class="unit">원</span>
          </div>
          <span class="sub-text">실시간 전사 집계</span>
        </div>
      </router-link>
    </div>

    <!-- 2. 중단 2열 그리드 섹션 -->
    <div class="widget-grid">
      <!-- 📦 [실시간 발주 신청 현황] 위젯 -->
      <div class="widget-card">
        <div class="widget-header">
          <h3>📦 실시간 발주 신청 및 처리 현황</h3>
          <router-link to="/inventory/hq-orders" class="more-link">본사 발주 승인 ❯</router-link>
        </div>
        <div class="widget-body">
          <div v-if="recentOrders.length === 0" class="empty-state">
            신청된 발주 내역이 없습니다.
          </div>
          <table v-else class="mini-table">
            <thead>
              <tr>
                <th>분점명</th>
                <th>신청 물품</th>
                <th>수량</th>
                <th>발주 상태</th>
                <th class="center">바로가기</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td><strong>{{ getBranchName(order) }}</strong></td>
                <td>{{ getItemName(order) }}</td>
                <td><strong>{{ getQuantity(order) }}개</strong></td>
                <td>
                  <span :class="['status-badge', getStatusClass(order.approvalStatus || order.status)]">
                    {{ order.approvalStatus || order.status || '대기중' }}
                  </span>
                </td>
                <td class="center">
                  <router-link to="/inventory/hq-orders" class="link-btn">확인</router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 👥 [회원 & 쿠폰 현황] 위젯 -->
      <div class="widget-card">
        <div class="widget-header">
          <h3>👥 회원 및 쿠폰 발행 현황</h3>
          <router-link to="/admin/coupons" class="more-link">쿠폰 관리 ❯</router-link>
        </div>
        <div class="widget-body">
          <div class="stat-dual-box">
            <div class="stat-sub-card">
              <span class="stat-title">👥 신규 가입 회원 (오늘)</span>
              <strong class="stat-val">+{{ todayNewMembers }}명</strong>
              <span class="stat-desc">총 누적 회원: {{ totalMembers.toLocaleString() }}명</span>
            </div>
            <div class="stat-sub-card">
              <span class="stat-title">🎟️ 발급된 회원 쿠폰</span>
              <strong class="stat-val">{{ activeCouponsCount }}개</strong>
              <router-link to="/admin/coupons" class="inner-link">쿠폰 관리 이동 ❯</router-link>
            </div>
          </div>

          <!-- 💡 [템플릿 반영] 등록된 쿠폰 템플릿 실시간 리스트 -->
          <div class="template-coupon-section">
            <div class="sub-widget-header">
              <span class="sub-title">📌 등록된 쿠폰 템플릿 목록</span>
            </div>
            <div v-if="templateCouponList.length === 0" class="empty-state-sm">
              등록된 쿠폰 템플릿이 없습니다.
            </div>
            <ul v-else class="simple-list">
              <li v-for="coupon in templateCouponList" :key="coupon.id">
                <span class="badge-tag pink">템플릿</span>
                <span class="noti-title">{{ coupon.name }}</span>
                <strong class="discount-val">{{ coupon.discountValue?.toLocaleString() }}원</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 하단 2열 그리드 섹션 -->
    <div class="widget-grid" style="margin-top: 20px;">
      <!-- 🎁 [이벤트 / 프로모션] 위젯 -->
      <div class="widget-card">
        <div class="widget-header">
          <h3>🎁 진행 중인 이벤트 및 프로모션</h3>
          <router-link to="/event-management" class="more-link">이벤트 관리 ❯</router-link>
        </div>
        <div class="widget-body">
          <div v-if="activeEvents.length === 0" class="empty-state">진행 중인 이벤트가 없습니다.</div>
          <ul v-else class="simple-list">
            <li v-for="evt in activeEvents" :key="evt.id">
              <span class="event-tag">이벤트</span>
              <span class="event-title">{{ evt.eventName || evt.event_name || evt.title || '신규 이벤트' }}</span>
              <span class="event-period">
                {{ evt.startDate || evt.start_date || '' }} ~ {{ evt.endDate || evt.end_date || '' }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 🏪 [지점 재고 현황 요약] 위젯 -->
      <div class="widget-card">
        <div class="widget-header">
          <h3>🏪 지점별 재고 현황 요약</h3>
          <router-link to="/inventory/branch-inventory" class="more-link">지점 재고 관리 ❯</router-link>
        </div>
        <div class="widget-body">
          <div v-if="branchInventorySummary.length === 0" class="empty-state">재고 정보를 불러올 수 없습니다.</div>
          <ul v-else class="simple-list">
            <li v-for="inven in branchInventorySummary" :key="inven.id">
              <span class="badge-tag gray">{{ getBranchName(inven) }}</span>
              <span class="noti-title">{{ getItemName(inven) }} (수량: {{ getQuantity(inven) }}개)</span>
              <span :class="['badge-tag', getQuantity(inven) < 5 ? 'red' : 'green']">
                {{ getQuantity(inven) < 5 ? '재고 부족' : '원활' }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const currentTime = ref(new Date().toLocaleString())

// 대시보드 리액티브 상태
const pendingOrdersCount = ref(0)
const shippingCount = ref(0)
const completedDeliveryCount = ref(0)
const totalBranchesCount = ref(0)
const todaySales = ref(0)

const todayNewMembers = ref(0)
const totalMembers = ref(0)
const activeCouponsCount = ref(0)

const recentOrders = ref([])
const activeEvents = ref([])
const branchInventorySummary = ref([])
const templateCouponList = ref([]) // 💡 1. 선언 누락 수정

// 헬퍼 함수
const getBranchName = (item) => {
  if (!item) return '지점'
  return item.branchName || item.branch?.branchName || item.branch?.name || item.branch_name || '강남역점'
}

const getItemName = (item) => {
  if (!item) return '원자재'
  return item.itemName || item.item?.itemName || item.item?.name || item.item_name || '원자재 아이템'
}

const getQuantity = (item) => {
  if (!item) return 0
  return (
    item.requestQuantity ?? 
    item.request_quantity ?? 
    item.quantity ?? 
    item.stockQuantity ??
    item.qty ?? 
    item.count ?? 
    0
  )
}

const fetchDashboardData = async () => {
  try {
    // 💡 2. Promise.allSettled 요청과 변수 할당 개수(8개) 1:1 매칭
    const [
      ordersRes, 
      branchesRes, 
      salesRes, 
      membersRes, 
      couponsRes, 
      couponTemplatesRes,
      eventsRes, 
      inventoryRes
    ] = await Promise.allSettled([
      axios.get('/api/admin/branches/orders'),   
      axios.get('/api/admin/branches'), 
      axios.get('/api/sales/today'), 
      axios.get('/api/admin/members'), 
      axios.get('/api/admin/coupons/all'), 
      axios.get('/api/admin/coupons/templates'), // 템플릿 쿠폰 API
      axios.get('/api/promotion'), 
      axios.get('/api/inventory/branches')
    ])

    // A. 발주 데이터
    if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
      const allOrders = ordersRes.value.data
      recentOrders.value = Array.isArray(allOrders) ? allOrders.slice(0, 5) : []
      pendingOrdersCount.value = recentOrders.value.filter(o => (o.approvalStatus || o.status) === '대기중').length
      shippingCount.value = recentOrders.value.filter(o => (o.deliveryStatus || o.status) === '배송중').length
      completedDeliveryCount.value = recentOrders.value.filter(o => (o.deliveryStatus || o.status) === '배송완료').length
    }

    // B. 분점 데이터
    if (branchesRes.status === 'fulfilled' && branchesRes.value.data) {
      totalBranchesCount.value = Array.isArray(branchesRes.value.data) ? branchesRes.value.data.length : 0
    }

    // C. 매출 데이터
    if (salesRes.status === 'fulfilled' && salesRes.value.data) {
      todaySales.value = salesRes.value.data.totalAmount || salesRes.value.data.todaySales || 0
    }

    // D. 회원 데이터
    if (membersRes.status === 'fulfilled' && membersRes.value.data) {
      const memberData = membersRes.value.data
      if (Array.isArray(memberData)) {
        totalMembers.value = memberData.length
      } else {
        todayNewMembers.value = memberData.todayNewCount || 0
        totalMembers.value = memberData.totalCount || 0
      }
    }

    // E. 전체 쿠폰 개수
    if (couponsRes.status === 'fulfilled' && couponsRes.value.data) {
      activeCouponsCount.value = Array.isArray(couponsRes.value.data) ? couponsRes.value.data.length : 0
    }

    // E-2. 템플릿 쿠폰 바인딩
    if (couponTemplatesRes.status === 'fulfilled' && couponTemplatesRes.value.data) {
      templateCouponList.value = Array.isArray(couponTemplatesRes.value.data) ? couponTemplatesRes.value.data.slice(0, 3) : []
    }

    // F. 이벤트 데이터
    if (eventsRes.status === 'fulfilled' && eventsRes.value.data) {
      activeEvents.value = Array.isArray(eventsRes.value.data) ? eventsRes.value.data.slice(0, 3) : []
    }

    // G. 지점 재고 데이터
    if (inventoryRes.status === 'fulfilled' && inventoryRes.value.data) {
      branchInventorySummary.value = Array.isArray(inventoryRes.value.data) ? inventoryRes.value.data.slice(0, 5) : []
    }

  } catch (error) {
    console.error('대시보드 데이터 조회 오류:', error)
  }
}

const getStatusClass = (status) => {
  if (status === '대기중' || status === '승인대기') return 'waiting'
  if (status === '배송중') return 'ing'
  if (status === '배송완료' || status === '승인완료') return 'done'
  return ''
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-container { padding: 24px; background-color: #f8fafc; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.page-header h2 { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0 0 4px 0; }
.page-header p { font-size: 13px; color: #64748b; margin: 0; }
.current-time { font-size: 12.5px; color: #64748b; background: white; padding: 6px 12px; border-radius: 20px; border: 1px solid #e2e8f0; }

.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.kpi-card { background: white; border-radius: 12px; padding: 18px; display: flex; align-items: center; gap: 14px; border: 1px solid #e2e8f0; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; }
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0, 0, 0, 0.05); }
.kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.warning-card .kpi-icon { background: #fff7ed; }
.blue-card .kpi-icon { background: #eff6ff; }
.purple-card .kpi-icon { background: #f3e8ff; }
.green-card .kpi-icon { background: #f0fdf4; }

.kpi-info { display: flex; flex-direction: column; }
.kpi-info .label { font-size: 12px; font-weight: 600; color: #64748b; }
.value-group { display: flex; align-items: baseline; gap: 4px; margin: 2px 0; }
.value-group .number { font-size: 22px; font-weight: 800; color: #0f172a; }
.value-group .unit { font-size: 12px; color: #475569; }
.sub-text { font-size: 11px; color: #64748b; }
.sub-text.highlight { color: #ea580c; font-weight: 700; }

.widget-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.widget-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px; }
.widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
.widget-header h3 { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0; }
.more-link { font-size: 12px; color: #4f46e5; text-decoration: none; font-weight: 600; }

.empty-state { padding: 30px 0; text-align: center; color: #94a3b8; font-size: 13px; }
.empty-state-sm { padding: 12px 0; text-align: center; color: #94a3b8; font-size: 12px; }
.mini-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.mini-table th { text-align: left; padding: 6px 8px; color: #64748b; background: #f8fafc; font-weight: 600; }
.mini-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
.mini-table .center { text-align: center; }

.status-badge { padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; }
.status-badge.waiting { background: #fff7ed; color: #c2410c; }
.status-badge.ing { background: #eff6ff; color: #1d4ed8; }
.status-badge.done { background: #f0fdf4; color: #15803d; }

.link-btn { font-size: 11px; color: #2563eb; text-decoration: underline; }

.stat-dual-box { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.stat-sub-card { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 6px; }
.stat-title { font-size: 12px; color: #64748b; font-weight: 600; }
.stat-val { font-size: 20px; font-weight: 800; color: #1e293b; }
.stat-desc { font-size: 11px; color: #94a3b8; }
.inner-link { font-size: 11px; color: #4f46e5; text-decoration: none; margin-top: 4px; }

/* 💡 [신규 스타일] 템플릿 쿠폰 위젯 영역 */
.template-coupon-section { margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
.sub-widget-header { margin-bottom: 8px; }
.sub-title { font-size: 12px; font-weight: 700; color: #475569; }
.badge-tag.pink { background: #fce7f3; color: #db2777; }
.discount-val { font-size: 12px; color: #d13b7d; font-weight: 700; }

.simple-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.simple-list li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
.event-tag { background: #fce7f3; color: #be185d; font-size: 10.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.event-title { text-align: center; flex: 1; color: #334155; }
.event-period { font-size: 11px; color: #94a3b8; }

.badge-tag { font-size: 10.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.badge-tag.red { background: #fef2f2; color: #dc2626; }
.badge-tag.green { background: #f0fdf4; color: #16a34a; }
.badge-tag.gray { background: #f1f5f9; color: #475569; }
.noti-title { flex: 1; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>