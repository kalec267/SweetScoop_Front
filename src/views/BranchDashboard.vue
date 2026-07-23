<template>
    <div class="branch-dashboard">
        <!-- 헤더 영역 -->
        <div class="dashboard-header">
            <div>
                <h2>분점 관리 파트너 (스윗스쿱 강남역점)</h2>
                <p class="subtitle">실시간 지점 원자재 재고 관리 및 본사 신청 현황</p>
            </div>
            <button class="btn-order" @click="openOrderModal">＋ 본사 재고 신청 (발주)</button>
        </div>

        <!-- 메인 레이아웃 그리드 (2x2 배치) -->
        <div class="dashboard-grid">

            <!-- 1. [상단 좌측] 키오스크 활성화 제어 대시보드 (KioskControlView UI & 스위치 연동) -->
            <div class="grid-section">
                <div class="section-title-box">
                    <h3>🖥️ 매장 키오스크 가동 현황</h3>
                    <span class="badge-tag blue">기기 제어</span>
                </div>

                <div class="kiosk-control-container">
                    <div v-if="isKioskLoading" class="empty-state">
                        키오스크 정보를 불러오는 중...
                    </div>
                    <div v-else-if="kioskList.length === 0" class="empty-state">
                        등록된 키오스크 기기가 없습니다.
                    </div>
                    <div v-else class="kiosk-grid">
                        <div 
                            v-for="kiosk in kioskList" 
                            :key="kiosk.id" 
                            class="kiosk-card"
                            :class="{ 'is-active': isKioskActive(kiosk.status) }"
                        >
                            <!-- 카드 헤더 (이름 및 상태 배지) -->
                            <div class="kiosk-card-header">
                                <span class="kiosk-title">{{ kiosk.kioskName || `키오스크 #${kiosk.id}` }}</span>
                                <span :class="getStatusBadgeClass(kiosk.status)">
                                    {{ getStatusText(kiosk.status) }}
                                </span>
                            </div>

                            <!-- 카드 바디 -->
                            <div class="kiosk-card-body">
                                <p class="kiosk-id-info">기기 식별번호: <strong>#{{ kiosk.id }}</strong></p>
                            </div>

                            <!-- 카드 푸터 (토글 스위치) -->
                            <div class="kiosk-card-footer">
                                <span class="switch-text">
                                    {{ isKioskActive(kiosk.status) ? '운영 중 (ON)' : '운영 중지 (OFF)' }}
                                </span>
                                <label class="switch">
                                    <input 
                                        type="checkbox" 
                                        :checked="isKioskActive(kiosk.status)"
                                        :disabled="kiosk.isUpdating"
                                        @change="toggleKioskStatus(kiosk)"
                                    />
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. [상단 우측] 실시간 키오스크 주문 접수 현황 (Firebase 연동) -->
            <div class="grid-section">
                <div class="section-title-box">
                    <h3>🔔 실시간 키오스크 주문 접수</h3>
                    <span class="badge-tag green">LIVE</span>
                </div>

                <div class="order-list">
                    <div v-if="realtimeOrders.length === 0" class="empty-state">
                        들어온 실시간 주문이 없습니다. 대기 중...
                    </div>

                    <div
                        v-for="order in realtimeOrders"
                        :key="order.orderId"
                        class="order-item live-order-card"
                        @click="toggleOrderDetail(order.orderId)"
                        style="cursor: pointer;">
                        <div class="order-meta">
                            <span class="order-id">주문번호: #{{ order.orderNo }} (웨이팅: <strong>{{ order.waitingNo }}</strong>번)</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <button class="btn-receipt" @click.stop="openReceiptModal(order)">영수증</button>
                                <button class="btn-complete" @click.stop="completeOrder(order.orderId)">제조완료</button>
                                <span class="order-status status-waiting">{{ order.status }}</span>
                                <span style="font-size: 11px; color: #64748b;">{{ order.expanded ? '▲' : '▼' }}</span>
                            </div>
                        </div>

                        <div class="order-body" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                            <div style="display: flex; justify-content: space-between; width: 100%; font-size: 13px; color: #334155; font-weight: 600;">
                                <span>총 결제금액</span>
                                <span style="color: #d13b7d;">{{ Number(order.totalPrice || 0).toLocaleString() }}원</span>
                            </div>

                            <div v-if="order.expanded" class="order-detail-box" @click.stop>
                                <div class="detail-divider"></div>
                                <p class="detail-title">📦 세부 주문 사항</p>
                                <div v-for="(item, idx) in order.items" :key="idx" class="detail-item-row">
                                    <div style="font-weight: 600; color: #1e293b;">
                                        <span v-if="item.sizeName" style="color: #d13b7d; margin-right: 4px;">[{{ item.sizeName }}]</span>
                                        {{ getItemDisplayName(item) }}
                                    </div>
                                    <div v-if="formatItemFlavors(item)" class="option-tag">맛: {{ formatItemFlavors(item) }}</div>
                                    <div v-if="formatOptions(item)" class="option-tag">옵션: {{ formatOptions(item) }}</div>
                                    <div style="color: #64748b; font-size: 12px; margin-top: 6px; display: flex; justify-content: space-between;">
                                        <span>수량: {{ item.quantity }}개</span>
                                        <span>금액: {{ Number(item.totalPrice || item.price || 0).toLocaleString() }}원</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. [하단 좌측] 실시간 매장 원자재 재고 보유량 -->
            <div class="grid-section">
                <div class="section-title-box">
                    <h3>🍦 매장 원자재 재고 보유량</h3>
                    <span class="badge-tag pink">실시간</span>
                </div>

                <div class="inventory-cards">
                    <div v-if="branchInventory.length === 0" class="empty-state">
                        원자재 재고 정보가 없습니다.
                    </div>
                    <div v-for="item in branchInventory" :key="item.itemId" class="inv-card">
                        <div class="inv-info">
                            <span class="inv-name">{{ item.itemName }}</span>
                            <span class="inv-weight">{{ item.stockLevel.toLocaleString() }}g 남음</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div
                                class="progress-bar-fill"
                                :style="{ width: getPercentage(item.stockLevel) + '%' }"
                                :class="getProgressBarClass(item.stockLevel)"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. [하단 우측] 본사 신청 및 배송 현황 -->
            <div class="grid-section">
                <div class="section-title-box">
                    <h3>📄 발주 신청 및 배송 현황</h3>
                    <span class="badge-tag gray">발주 내역</span>
                </div>

                <div class="order-list">
                    <div v-if="myRequests.length === 0" class="empty-state">
                        신청 내역이 없습니다.
                    </div>
                    <div v-for="order in myRequests" :key="order.id" class="order-item">
                        <div class="order-meta">
                            <span class="order-id">#REQ-{{ order.id }}</span>
                            <span class="order-date">{{ order.requestDate }}</span>
                        </div>
                        <div class="order-body">
                            <span class="order-menu">{{ order.menuName }} ({{ order.quantity }}개)</span>
                            <span class="order-status" :class="getStatusClass(order.status)">
                                {{ order.status }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- 신규 발주 모달 -->
        <div v-if="isOrderModalOpen" class="modal-overlay">
            <div class="modal-content">
                <h3>본사 재고 신청</h3>
                <p class="modal-desc">필요한 벌크 원자재 물품과 신청 수량을 입력하세요.</p>

                <div class="form-group">
                    <label>신청 물품 선택</label>
                    <select v-model="orderForm.itemId">
                        <option v-for="item in branchInventory" :key="item.itemId" :value="item.itemId">
                            {{ item.itemName }}
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label>신청 수량 (개/Box)</label>
                    <input type="number" v-model="orderForm.quantity" min="1" placeholder="수량 입력"/>
                </div>

                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeOrderModal">취소</button>
                    <button class="btn-submit" @click="submitOrder">신청 완료</button>
                </div>
            </div>
        </div>

        <!-- 영수증 모달 -->
        <div v-if="isReceiptModalOpen" class="modal-overlay" @click="closeReceiptModal">
            <div class="receipt-modal-content" @click.stop>
                <div class="receipt-header">
                    <h4>🍦 스윗스쿱 강남역점</h4>
                    <p>주문 영수증 (관리자 확인용)</p>
                </div>

                <div class="receipt-info-box">
                    <div>주문번호: #{{ selectedReceipt?.orderNo }}</div>
                    <div>웨이팅 번호: <strong>{{ selectedReceipt?.waitingNo }}번</strong></div>
                    <div>주문 상태: {{ selectedReceipt?.status }}</div>
                </div>

                <div class="receipt-divider-line"></div>

                <div class="receipt-items-list">
                    <div v-for="(item, idx) in selectedReceipt?.items" :key="idx" class="receipt-item-row">
                        <div class="receipt-item-name">
                            <span>
                                <span v-if="item.sizeName" class="receipt-size">[{{ item.sizeName }}]</span>
                                {{ getItemDisplayName(item) }}
                            </span>
                            <span>{{ item.quantity }}개</span>
                        </div>
                        <div v-if="formatItemFlavors(item)" class="receipt-sub-tag">맛: {{ formatItemFlavors(item) }}</div>
                        <div v-if="formatOptions(item)" class="receipt-sub-tag">옵션: {{ formatOptions(item) }}</div>
                        <div class="receipt-item-price">{{ Number(item.totalPrice || item.price || 0).toLocaleString() }}원</div>
                    </div>
                </div>

                <div class="receipt-divider-line"></div>

                <div class="receipt-total-box">
                    <span>총 결제금액</span>
                    <span class="total-price-text">{{ Number(selectedReceipt?.totalPrice || 0).toLocaleString() }}원</span>
                </div>

                <div class="receipt-footer-text">
                    결제수단: {{ selectedReceipt?.paymentMethod || '카드결제' }}<br/>
                    감사합니다. 언제나 신선함을 전하겠습니다.
                </div>

                <div class="modal-actions" style="margin-top: 16px;">
                    <button class="btn-cancel" style="width: 100%;" @click="closeReceiptModal">닫기</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '../api/index.js';
import { db } from '@/api/firebase';
import { collection, query, onSnapshot } from "firebase/firestore";

const branchId = ref(Number(localStorage.getItem('branchId')) || 1);

const branchInventory = ref([]);
const myRequests = ref([]);
const realtimeOrders = ref([]);
const kioskList = ref([]);
const isKioskLoading = ref(false);

const isOrderModalOpen = ref(false);
const orderForm = ref({ itemId: 1, quantity: 1 });

const isReceiptModalOpen = ref(false);
const selectedReceipt = ref(null);

// -------------------------------------------------------------
// 1. 키오스크 활성화 제어 함수 (KioskControlView 규격 통합)
// -------------------------------------------------------------
const fetchKiosks = async () => {
    isKioskLoading.value = true;
    try {
        // 💡 1차 API 경로 호출 (/api/admin/branches/{branchId}/kiosks)
        const res = await axios.get(`/api/admin/branches/${branchId.value}/kiosks`);
        kioskList.value = res.data.map(item => ({
            ...item,
            isUpdating: false
        }));
    } catch (error) {
        // 💡 2차 백업 API 경로 호출 (/api/kiosk/branch/{branchId})
        try {
            const fallbackRes = await axios.get(`/api/kiosk/branch/${branchId.value}`);
            kioskList.value = fallbackRes.data.map(item => ({
                ...item,
                isUpdating: false
            }));
        } catch (e) {
            console.error("키오스크 목록 조회 실패:", e);
        }
    } finally {
        isKioskLoading.value = false;
    }
};

// 키오스크 상태 판별 헬퍼
const isKioskActive = (status) => {
    return status === 'ACTIVE' || status === '정상';
};

// 키오스크 상태 텍스트
const getStatusText = (status) => {
    if (status === 'ACTIVE' || status === '정상') return '정상';
    if (status === 'INACTIVE' || status === '꺼짐') return '꺼짐';
    return status || '장애';
};

// 키오스크 상태 배지 디자인 클래스
const getStatusBadgeClass = (status) => {
    const active = isKioskActive(status);
    return {
        'status-badge': true,
        'badge-normal': active,
        'badge-off': !active && status !== '장애',
        'badge-error': status === '장애'
    };
};

// 키오스크 토글 스위치 상태 변경 API
const toggleKioskStatus = async (kiosk) => {
    const active = isKioskActive(kiosk.status);
    // 현재 정상/ACTIVE 이면 -> 꺼짐/INACTIVE 로 토글
    const nextStatus = active ? '꺼짐' : '정상';
    const nextStatusApi = active ? 'INACTIVE' : 'ACTIVE';

    const confirmMsg = !active
        ? `키오스크 #${kiosk.id}를 활성화(정상) 하시겠습니까?`
        : `키오스크 #${kiosk.id} 가동을 중지(꺼짐) 하시겠습니까?`;

    if (!confirm(confirmMsg)) {
        kioskList.value = [...kioskList.value];
        return;
    }

    kiosk.isUpdating = true;

    try {
        // 💡 Request Body 형태와 Query Param 형태를 모두 지원하도록 시도
        try {
            const res = await axios.patch(`/api/admin/kiosks/${kiosk.id}/status`, { status: nextStatus });
            kiosk.status = res.data?.status || nextStatus;
        } catch (err) {
            const res = await axios.patch(`/api/kiosk/${kiosk.id}/status?status=${nextStatusApi}`);
            kiosk.status = res.data?.status || nextStatusApi;
        }
    } catch (error) {
        console.error('키오스크 상태 변경 실패:', error);
        alert('키오스크 상태 변경에 실패했습니다.');
    } finally {
        kiosk.isUpdating = false;
    }
};

// -------------------------------------------------------------
// 2. 지점 재고 및 발주/주문 함수
// -------------------------------------------------------------
const fetchBranchInventory = async () => {
    try {
        const res = await axios.get(`/api/admin/branches/${branchId.value}/inventory`);
        if (res.data && Array.isArray(res.data)) {
            branchInventory.value = res.data.map(inv => ({
                itemId: inv.item?.id || inv.itemId,
                itemName: inv.item?.itemName || '원자재',
                stockLevel: Number(inv.stockLevel ?? 0)
            }));
        }
    } catch (error) {
        console.error("지점 재고 조회 에러:", error);
    }
};

const fetchMyRequests = async () => {
    try {
        const res = await axios.get(`/api/admin/branches/${branchId.value}/orders`);
        if (res.data && Array.isArray(res.data)) {
            myRequests.value = res.data.map(order => {
                const rawDate = order.requestDate || order.regDate || order.createdDate || '';
                const formattedDate = rawDate ? rawDate.substring(0, 10).replace(/-/g, '.') : '';
                return {
                    id: order.id,
                    menuName: order.item?.itemName || order.itemName || '신청 물품',
                    quantity: order.requestQuantity || order.quantity || 0,
                    requestDate: formattedDate,
                    status: order.approvalStatus || order.status || '대기 중'
                };
            });
        }
    } catch (error) {
        console.error("지점 발주 내역 조회 에러:", error);
    }
};

const getItemDisplayName = (item) => {
    if (!item) return '메뉴명 없음';
    let baseName = item.name || item.menuName || item.productName || item.title || '';
    const icecreamSizes = ['파인트', '쿼터', '패밀리', '하프갤런', '싱글', '더블', '싱글콘', '더블콘', '싱글컵', '더블컵'];
    if (icecreamSizes.some(s => (item.sizeName || '').includes(s)) || baseName.includes(',')) {
        return '아이스크림';
    }
    return baseName;
};

const formatItemFlavors = (item) => {
    if (!item) return '';
    const rawFlavors = item.menus || item.flavors || [];
    let flavorList = [];
    if (Array.isArray(rawFlavors)) {
        flavorList = rawFlavors.map(m => (typeof m === 'object' && m !== null ? (m.name || m.flavorName || '') : m)).filter(Boolean);
    } else if (typeof rawFlavors === 'string') {
        flavorList = [rawFlavors];
    }
    if (flavorList.length === 0 && item.menuName && item.menuName.includes(',')) {
        flavorList = item.menuName.split(',').map(s => s.trim());
    }
    return flavorList.join(', ');
};

const formatOptions = (item) => {
    if (item && item.optionName) return item.optionName;
    const options = item?.options;
    if (!options) return '';
    if (Array.isArray(options)) {
        return options.map(opt => (typeof opt === 'object' && opt !== null ? (opt.name || opt.label || '') : opt)).join(', ');
    }
    return String(options);
};

const initRealtimeOrderListener = () => {
    const ordersQuery = query(collection(db, "orders"));
    onSnapshot(ordersQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                realtimeOrders.value.unshift({
                    ...change.doc.data(),
                    expanded: false
                });
            }
        });
    });
};

const toggleOrderDetail = (orderId) => {
    const target = realtimeOrders.value.find(o => o.orderId === orderId);
    if (target) target.expanded = !target.expanded;
};

const completeOrder = (orderId) => {
    realtimeOrders.value = realtimeOrders.value.filter(order => order.orderId !== orderId);
};

const openReceiptModal = (order) => {
    selectedReceipt.value = order;
    isReceiptModalOpen.value = true;
};
const closeReceiptModal = () => {
    isReceiptModalOpen.value = false;
    selectedReceipt.value = null;
};

const submitOrder = async () => {
    try {
        const payload = {
            branchId: branchId.value,
            itemId: orderForm.value.itemId,
            quantity: orderForm.value.quantity
        };

        await axios.post('/api/admin/branches/orders', payload);
        alert("본사로 재고 신청이 전달되었습니다.");
        closeOrderModal();
        fetchBranchInventory();
        fetchMyRequests();
    } catch (error) {
        alert("본사 발주 신청 처리 중 에러가 발생했습니다.");
    }
};

const getPercentage = (level) => Math.min(100, (level / 10000) * 100);

const getProgressBarClass = (level) => {
    if (level < 3000) return 'bar-danger';
    if (level < 6000) return 'bar-warning';
    return 'bar-success';
};

const getStatusClass = (status) => {
    switch (status) {
        case '대기 중':
        case '대기중':
            return 'status-waiting';
        case '배송 중':
        case '배송중':
            return 'status-shipping';
        case '완료':
        case '승인완료':
            return 'status-done';
        default:
            return '';
    }
};

const openOrderModal = () => {
    orderForm.value = {
        itemId: branchInventory.value[0]?.itemId || 1,
        quantity: 1
    };
    isOrderModalOpen.value = true;
};
const closeOrderModal = () => isOrderModalOpen.value = false;

onMounted(() => {
    fetchKiosks();
    fetchBranchInventory();
    fetchMyRequests();
    initRealtimeOrderListener();
});
</script>

<style scoped>
.branch-dashboard { padding: 30px; background-color: #f8fafc; min-height: 100vh; box-sizing: border-box; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.dashboard-header h2 { font-size: 22px; color: #1e293b; font-weight: 700; }
.subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
.btn-order { background: #d13b7d; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }

/* 2x2 그리드 */
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.grid-section { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; height: 380px; display: flex; flex-direction: column; }

.section-title-box { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title-box h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }

.badge-tag { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.badge-tag.pink { background: #fdf2f8; color: #d13b7d; }
.badge-tag.green { background: #ecfdf5; color: #059669; }
.badge-tag.blue { background: #eff6ff; color: #2563eb; }
.badge-tag.gray { background: #f1f5f9; color: #475569; }

/* 💡 KioskControlView 토글 스위치 UI 스타일 */
.kiosk-control-container { flex: 1; overflow-y: auto; }
.kiosk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.kiosk-card { background-color: #ffffff; border-radius: 12px; padding: 14px; border: 1.5px solid #e5e7eb; transition: all 0.2s; }
.kiosk-card.is-active { border-color: #10b981; }

.kiosk-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.kiosk-title { font-weight: 700; font-size: 0.95rem; color: #111827; }

/* 상태 배지 */
.status-badge { padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
.badge-normal { background-color: #d1fae5; color: #065f46; }
.badge-off { background-color: #f3f4f6; color: #4b5563; }
.badge-error { background-color: #fee2e2; color: #991b1b; }

.kiosk-card-body { margin-bottom: 10px; }
.kiosk-id-info { font-size: 0.8rem; color: #6b7280; margin: 0; }

.kiosk-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #f3f4f6; }
.switch-text { font-size: 0.78rem; font-weight: 600; color: #374151; }

/* 토글 스위치 CSS */
.switch { position: relative; display: inline-block; width: 42px; height: 22px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #d1d5db; transition: .3s; border-radius: 22px; }
.slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
input:checked + .slider { background-color: #10b981; }
input:checked + .slider:before { transform: translateX(20px); }
input:disabled + .slider { opacity: 0.6; cursor: not-allowed; }

/* 재고 프로그레스 바 */
.inventory-cards { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex: 1; }
.inv-card { border: 1px solid #f1f5f9; padding: 12px; border-radius: 8px; }
.inv-info { display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 6px; }
.inv-name { font-weight: 600; color: #334155; }
.inv-weight { font-weight: 700; color: #475569; }
.progress-bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
.bar-success { background: #10b981; }
.bar-warning { background: #f59e0b; }
.bar-danger { background: #ef4444; }

/* 주문 및 발주 리스트 */
.order-list { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; }
.order-item { border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
.live-order-card { background: #fffbfd; border: 1px solid #fce7f3; padding: 12px; border-radius: 8px; }
.order-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
.order-id { font-weight: 600; color: #475569; }
.order-body { display: flex; justify-content: space-between; align-items: center; }
.order-menu { font-size: 13.5px; font-weight: 600; color: #334155; }
.order-status { font-size: 11.5px; font-weight: 700; padding: 3px 6px; border-radius: 4px; }

.btn-receipt { background: #fdf2f8; color: #d13b7d; border: 1px solid #fce7f3; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; }
.btn-complete { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; }

.order-detail-box { width: 100%; margin-top: 8px; }
.detail-divider { height: 1px; background-color: #f1f5f9; margin: 6px 0; }
.detail-title { font-size: 11.5px; font-weight: 700; color: #d13b7d; margin-bottom: 4px; }
.detail-item-row { background: #ffffff; border: 1px solid #f1f5f9; padding: 8px; border-radius: 6px; margin-bottom: 4px; font-size: 12.5px; }
.option-tag { font-size: 10.5px; color: #2563eb; background: #eff6ff; padding: 2px 5px; border-radius: 4px; margin-top: 3px; display: inline-block; font-weight: 600; }

.empty-state { text-align: center; color: #94a3b8; padding: 30px 0; font-size: 13px; }

/* 상태 색상 */
.status-waiting { background: #fffbeb; color: #d97706; }
.status-shipping { background: #eff6ff; color: #2563eb; }
.status-done { background: #ecfdf5; color: #059669; }

/* 모달 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { background: white; padding: 24px; border-radius: 12px; width: 400px; }
.modal-desc { font-size: 13px; color: #94a3b8; margin-top: 4px; margin-bottom: 18px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.form-group input, .form-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn-cancel { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 8px; cursor: pointer; }
.btn-submit { background: #d13b7d; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }

.receipt-modal-content { background: #ffffff; padding: 24px; border-radius: 8px; width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); box-sizing: border-box; }
.receipt-header { text-align: center; margin-bottom: 12px; }
.receipt-header h4 { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
.receipt-header p { font-size: 12px; color: #64748b; }
.receipt-info-box { font-size: 12px; color: #334155; margin-bottom: 8px; line-height: 1.5; }
.receipt-divider-line { border-top: 1px dashed #cbd5e1; margin: 10px 0; }
.receipt-items-list { max-height: 220px; overflow-y: auto; }
.receipt-item-row { margin-bottom: 10px; font-size: 12px; }
.receipt-item-name { font-weight: 700; color: #1e293b; display: flex; justify-content: space-between; }
.receipt-size { color: #d13b7d; margin-right: 4px; }
.receipt-sub-tag { font-size: 11px; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; margin-top: 3px; display: inline-block; font-weight: 600; }
.receipt-item-price { text-align: right; font-weight: 600; color: #334155; font-size: 12px; margin-top: 2px; }
.receipt-total-box { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 8px; }
.total-price-text { color: #d13b7d; }
.receipt-footer-text { text-align: center; font-size: 11px; color: #64748b; margin-top: 14px; line-height: 1.4; }
</style>