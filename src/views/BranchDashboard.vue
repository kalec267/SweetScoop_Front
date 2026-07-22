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

        <!-- 메인 레이아웃 그리드 (좌: 지점 보유 재고 / 우: 실시간 주문 & 본사 신청 목록) -->
        <div class="dashboard-grid">

            <!-- [왼쪽] 실시간 원자재 보유 현황 -->
            <div class="grid-section">
                <div class="section-title-box">
                    <h3>🍦 매장 원자재 재고 보유량</h3>
                    <span class="badge-tag">실시간</span>
                </div>

                <div class="inventory-cards">
                    <div v-for="item in branchInventory" :key="item.itemId" class="inv-card">
                        <div class="inv-info">
                            <span class="inv-name">{{ item.itemName }}</span>
                            <span class="inv-weight">{{ item.stockLevel.toLocaleString() }}g 남음</span>
                        </div>
                        <!-- 재고량에 따른 프로그레스 바 컬러 차등화 -->
                        <div class="progress-bar-bg">
                            <div
                                class="progress-bar-fill"
                                :style="{ width: getPercentage(item.stockLevel) + '%' }"
                                :class="getProgressBarClass(item.stockLevel)"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- [오른쪽 상단] 실시간 키오스크 주문 접수 현황 (Firebase 연동) -->
            <div class="grid-section" style="margin-bottom: 30px;">
                <div class="section-title-box">
                    <h3>🔔 실시간 키오스크 주문 접수</h3>
                    <span class="badge-tag" style="background: #ecfdf5; color: #059669;">LIVE</span>
                </div>

                <div class="order-list">
                    <div
                        v-if="realtimeOrders.length === 0"
                        style="text-align: center; color: #94a3b8; padding: 20px 0; font-size: 13px;">
                        들어온 실시간 주문이 없습니다. 대기 중...
                    </div>

                    <!-- 💡 주문 카드 클릭 시 상세보기 토글 기능 적용 -->
                    <div
                        v-for="order in realtimeOrders"
                        :key="order.orderId"
                        class="order-item live-order-card"
                        @click="toggleOrderDetail(order.orderId)"
                        style="cursor: pointer;">
                        <div class="order-meta">
                            <span class="order-id">주문번호: #{{ order.orderNo }}
                                (웨이팅:
                                <strong>{{ order.waitingNo }}</strong>번)</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <!-- 💡 영수증 버튼 -->
                                <button class="btn-receipt" @click.stop="openReceiptModal(order)">영수증</button>
                                <!-- 💡 제조완료 버튼 (누르면 화면에서 제거) -->
                                <button class="btn-complete" @click.stop="completeOrder(order.orderId)">제조완료</button>
                                <span class="order-status status-waiting">{{ order.status }}</span>
                                <span style="font-size: 11px; color: #64748b;">{{ order.expanded ? '▲' : '▼' }}</span>
                            </div>
                        </div>

                        <div
                            class="order-body"
                            style="flex-direction: column; align-items: flex-start; gap: 4px;">
                            <!-- 기본 요약 정보 -->
                            <div
                                style="display: flex; justify-content: space-between; width: 100%; font-size: 13px; color: #334155; font-weight: 600;">
                                <span>총 결제금액</span>
                                <span style="color: #d13b7d;">{{ Number(order.totalPrice).toLocaleString() }}원</span>
                            </div>

                            <!-- 💡 클릭했을 때만 펼쳐지는 상세 주문 내역 영역 -->
                            <div v-if="order.expanded" class="order-detail-box" @click.stop>
                                <div class="detail-divider"></div>
                                <p class="detail-title">📦 세부 주문 사항</p>

                                <div v-for="(item, idx) in order.items" :key="idx" class="detail-item-row">
                                    <div style="font-weight: 600; color: #1e293b;">
                                        <span v-if="item.sizeName" style="color: #d13b7d; margin-right: 4px;">[{{ item.sizeName }}]</span>
                                        {{ getItemDisplayName(item) }}
                                    </div>

                                    <!-- 💡 아이스크림 맛 선택 정보 (파란색 태그 스타일) -->
                                    <div v-if="formatItemFlavors(item)" class="option-tag">
                                        맛:
                                        {{ formatItemFlavors(item) }}
                                    </div>

                                    <!-- 💡 음료 및 상품 옵션 정보 출력 -->
                                    <div v-if="formatOptions(item)" class="option-tag">
                                        옵션:
                                        {{ formatOptions(item) }}
                                    </div>

                                    <div
                                        style="color: #64748b; font-size: 12px; margin-top: 6px; display: flex; justify-content: space-between;">
                                        <span>수량:
                                            {{ item.quantity }}개</span>
                                        <span>금액:
                                            {{ Number(item.totalPrice || item.price || 0).toLocaleString() }}원</span>
                                    </div>
                                </div>

                                <div
                                    style="margin-top: 8px; font-size: 12px; color: #64748b; border-top: 1px dashed #e2e8f0; padding-top: 6px;">
                                    결제수단:
                                    {{ order.paymentMethod || '카드결제' }}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <!-- [오른쪽 하단] 최근 본사 재고 신청 내역 -->
            <div class="grid-section">
                <div class="section-title-box">
                    <h3>📄 본사 신청 및 배송 현황</h3>
                </div>

                <div class="order-list">
                    <div v-for="order in myRequests" :key="order.id" class="order-item">
                        <div class="order-meta">
                            <span class="order-id">#REQ-{{ order.id }}</span>
                            <span class="order-date">{{ order.requestDate }}</span>
                        </div>
                        <div class="order-body">
                            <span class="order-menu">{{ order.menuName }}
                                ({{ order.quantity }}개)</span>
                            <span class="order-status" :class="getStatusClass(order.status)">
                                {{ order.status }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- 💡 신규 발주(재고 신청) 모달 창 -->
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

        <!-- 💡 영수증 출력용 모달 창 -->
        <div v-if="isReceiptModalOpen" class="modal-overlay" @click="closeReceiptModal">
            <div class="receipt-modal-content" @click.stop>
                <div class="receipt-header">
                    <h4>🍦 스윗스쿱 강남역점</h4>
                    <p>주문 영수증 (관리자 확인용)</p>
                </div>

                <div class="receipt-info-box">
                    <div>주문번호: #{{ selectedReceipt?.orderNo }}</div>
                    <div>웨이팅 번호:
                        <strong>{{ selectedReceipt?.waitingNo }}번</strong>
                    </div>
                    <div>주문 상태:
                        {{ selectedReceipt?.status }}</div>
                </div>

                <div class="receipt-divider-line"></div>

                <div class="receipt-items-list">
                    <div
                        v-for="(item, idx) in selectedReceipt?.items"
                        :key="idx"
                        class="receipt-item-row">
                        <div class="receipt-item-name">
                            <span>
                                <span v-if="item.sizeName" class="receipt-size">[{{ item.sizeName }}]</span>
                                {{ getItemDisplayName(item) }}
                            </span>
                            <span>{{ item.quantity }}개</span>
                        </div>

                        <!-- 영수증 내부 맛 선택 정보 출력 (파란색 태그 형태) -->
                        <div v-if="formatItemFlavors(item)" class="receipt-sub-tag">
                            맛:
                            {{ formatItemFlavors(item) }}
                        </div>

                        <!-- 영수증 내부 옵션 정보 출력 -->
                        <div v-if="formatOptions(item)" class="receipt-sub-tag">
                            옵션:
                            {{ formatOptions(item) }}
                        </div>

                        <div class="receipt-item-price">
                            {{ Number(item.totalPrice || item.price || 0).toLocaleString() }}원
                        </div>
                    </div>
                </div>

                <div class="receipt-divider-line"></div>

                <div class="receipt-total-box">
                    <span>총 결제금액</span>
                    <span class="total-price-text">{{ Number(selectedReceipt?.totalPrice || 0).toLocaleString() }}원</span>
                </div>

                <div class="receipt-footer-text">
                    결제수단:
                    {{ selectedReceipt?.paymentMethod || '카드결제' }}<br/>
                    감사합니다. 언제나 신선함을 전하겠습니다.
                </div>

                <div class="modal-actions" style="margin-top: 16px;">
                    <button class="btn-cancel" style="width: 100%;" @click="closeReceiptModal">닫기</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup="setup">
    import {ref, onMounted} from 'vue';
    import axios from '../api/index.js';

    import {db} from '@/api/firebase';
    import {collection, query, onSnapshot} from "firebase/firestore";

    const branchId = ref(Number(localStorage.getItem('branchId')) || 1);

    const branchInventory = ref([]);
    const myRequests = ref([]);
    const realtimeOrders = ref([]);

    const isOrderModalOpen = ref(false);
    const orderForm = ref({itemId: 1, quantity: 1});

    // 영수증 모달 관련 상태
    const isReceiptModalOpen = ref(false);
    const selectedReceipt = ref(null);

    const fetchBranchInventory = async () => {
        try {
            const res = await axios.get(`/api/admin/branches/${branchId.value}/inventory`);
            branchInventory.value = res
                .data
                .map(
                    inv => ({itemId: inv.item.id, itemName: inv.item.itemName, stockLevel: inv.stockLevel})
                );
        } catch (error) {
            branchInventory.value = [
                {
                    itemId: 1,
                    itemName: '엄마는 외계인 튜브(1000g)',
                    stockLevel: 8500
                }, {
                    itemId: 2,
                    itemName: '아몬드 봉봉 튜브(1000g)',
                    stockLevel: 2100
                }, {
                    itemId: 3,
                    itemName: '민트 초콜릿 칩 튜브(1000g)',
                    stockLevel: 6000
                }, {
                    itemId: 4,
                    itemName: '그린티 튜브(1000g)',
                    stockLevel: 4500
                }
            ];
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await axios.get(`/api/admin/branches/${branchId.value}/orders`);
            myRequests.value = res
                .data
                .map(order => {
                    const rawDate = order.requestDate || order.regDate || order.createdDate || '';
                    const formattedDate = rawDate
                        ? rawDate
                            .substring(0, 10)
                            .replace(/-/g, '.')
                        : '';
                    return {
                        id: order.id,
                        menuName: order.item
                            ? order.item.itemName
                            : (order.itemName || '신청 물품'),
                        quantity: order.requestQuantity || order.quantity || 0,
                        requestDate: formattedDate,
                        status: order.status || order.orderStatus || '대기 중'
                    };
                });
        } catch (error) {
            myRequests.value = [
                {
                    id: 104,
                    menuName: '아몬드 봉봉 튜브',
                    quantity: 5,
                    requestDate: '2026.07.16',
                    status: '대기 중'
                }, {
                    id: 102,
                    menuName: '엄마는 외계인 튜브',
                    quantity: 10,
                    requestDate: '2026.07.14',
                    status: '배송 중'
                }, {
                    id: 101,
                    menuName: '그린티 튜브',
                    quantity: 3,
                    requestDate: '2026.07.12',
                    status: '완료'
                }
            ];
        }
    };

    // 💡 스마트 메뉴 이름 추출 헬퍼 함수
    const getItemDisplayName = (item) => {
        if (!item) 
            return '메뉴명 없음';
        
        let baseName = item.name || item.menuName || item.productName || item.title || '';
        const icecreamSizes = [
            '파인트',
            '쿼터',
            '패밀리',
            '하프갤런',
            '싱글',
            '더블',
            '싱글콘',
            '더블콘',
            '싱글컵',
            '더블컵'
        ];

        // 파인트 등 사이즈가 있거나 menuName에 쉼표가 포함된 경우 '아이스크림'으로 처리
        if (icecreamSizes.some(s => (item.sizeName || '').includes(s)) || baseName.includes(',')) {
            return '아이스크림';
        }

        return baseName;
    };

    // 💡 아이스크림 맛 선택 정보 포맷팅
    const formatItemFlavors = (item) => {
        if (!item) 
            return '';
        
        // 1. 기존 방식 (menus나 flavors가 있는 경우)
        const rawFlavors = item.menus || item.flavors || [];
        let flavorList = [];
        if (Array.isArray(rawFlavors)) {
            flavorList = rawFlavors
                .map(m => (
                    typeof m === 'object' && m !== null
                        ? (m.name || m.flavorName || '')
                        : m
                ))
                .filter(Boolean);
        } else if (typeof rawFlavors === 'string') {
            flavorList = [rawFlavors];
        }

        // 2. menuName에 쉼표가 포함되어 있는 경우 (현재 JSON 구조 대응)
        if (flavorList.length === 0 && item.menuName && item.menuName.includes(',')) {
            flavorList = item
                .menuName
                .split(',')
                .map(s => s.trim());
        }

        if (flavorList.length === 0) 
            return '';
        return flavorList.join(', ');
    };

    // 💡 옵션 데이터 타입 안전 처리 헬퍼 함수
    const formatOptions = (item) => {
        // optionName 필드가 string으로 들어오는 경우 바로 반환
        if (item && item.optionName) {
            return item.optionName;
        }

        const options = item
            ?.options;
        if (!options) 
            return '';
        if (Array.isArray(options)) {
            return options
                .map(opt => (
                    typeof opt === 'object' && opt !== null
                        ? (opt.name || opt.label || '')
                        : opt
                ))
                .join(', ');
        }
        if (typeof options === 'object') {
            return options.name || options.label || JSON.stringify(options);
        }
        return String(options);
    };

    // 💡 Firestore 실시간 주문 감지 리스너
    const initRealtimeOrderListener = () => {
        const ordersQuery = query(collection(db, "orders"));

        onSnapshot(ordersQuery, (snapshot) => {
            snapshot
                .docChanges()
                .forEach((change) => {
                    if (change.type === "added") {
                        const newOrder = change
                            .doc
                            .data();

                        realtimeOrders
                            .value
                            .unshift({
                                ...newOrder,
                                expanded: false
                            });
                    }
                });
        });
    };

    // 💡 주문 카드 클릭 시 상세보기 토글 함수
    const toggleOrderDetail = (orderId) => {
        const target = realtimeOrders
            .value
            .find(o => o.orderId === orderId);
        if (target) {
            target.expanded = !target.expanded;
        }
    };

    // 💡 제조 완료 버튼 클릭 시 실시간 목록에서 제거하는 함수
    const completeOrder = (orderId) => {
        realtimeOrders.value = realtimeOrders
            .value
            .filter(order => order.orderId !== orderId);
    };

    // 영수증 모달 제어 함수
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
            alert("본사로 재고 신청이 안전하게 전달되었습니다.");
            closeOrderModal();

            const selectedItem = branchInventory
                .value
                .find(item => item.itemId === orderForm.value.itemId);
            const itemName = selectedItem
                ? selectedItem.itemName
                : '신청 물품';

            const today = new Date();
            const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(
                2,
                '0'
            )}.${String(today.getDate()).padStart(2, '0')}`;

            const newRequest = {
                id: myRequests.value.length > 0
                    ? Math.max(...myRequests.value.map(o => o.id)) + 1
                    : 1,
                menuName: itemName,
                quantity: orderForm.value.quantity,
                requestDate: formattedDate,
                status: '대기 중'
            };

            myRequests
                .value
                .unshift(newRequest);
            fetchBranchInventory();
            fetchMyRequests();
        } catch (error) {
            alert("본사 발주 신청 처리 중 에러가 발생했습니다.");
        }
    };

    const getPercentage = (level) => Math.min(100, (level / 10000) * 100);

    const getProgressBarClass = (level) => {
        if (level < 3000) 
            return 'bar-danger';
        if (level < 6000) 
            return 'bar-warning';
        return 'bar-success';
    };

    const getStatusClass = (status) => {
        switch (status) {
            case '대기 중':
                return 'status-waiting';
            case '배송 중':
                return 'status-shipping';
            case '완료':
                return 'status-done';
            default:
                return '';
        }
    };

    const openOrderModal = () => {
        orderForm.value = {
            itemId: branchInventory.value[0]
                ?.itemId || 1,
            quantity: 1
        };
        isOrderModalOpen.value = true;
    };
    const closeOrderModal = () => isOrderModalOpen.value = false;

    onMounted(() => {
        fetchBranchInventory();
        fetchMyRequests();
        initRealtimeOrderListener();
    });
</script>

<style scoped="scoped">
    .branch-dashboard {
        padding: 30px;
        background-color: #f8fafc;
        min-height: 100vh;
        box-sizing: border-box;
    }
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }
    .dashboard-header h2 {
        font-size: 22px;
        color: #1e293b;
        font-weight: 700;
    }
    .subtitle {
        font-size: 14px;
        color: #64748b;
        margin-top: 4px;
    }
    .btn-order {
        background: #d13b7d;
        color: white;
        border: none;
        padding: 10px 18px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }
    .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
    }
    .grid-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
    }
    .section-title-box {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
    }
    .section-title-box h3 {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
    }
    .badge-tag {
        background: #fdf2f8;
        color: #d13b7d;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
    }
    .inventory-cards {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .inv-card {
        border: 1px solid #f1f5f9;
        padding: 14px;
        border-radius: 8px;
    }
    .inv-info {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        margin-bottom: 8px;
    }
    .inv-name {
        font-weight: 600;
        color: #334155;
    }
    .inv-weight {
        font-weight: 700;
        color: #475569;
    }

    .progress-bar-bg {
        height: 8px;
        background: #f1f5f9;
        border-radius: 4px;
        overflow: hidden;
    }
    .progress-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
    }
    .bar-success {
        background: #10b981;
    }
    .bar-warning {
        background: #f59e0b;
    }
    .bar-danger {
        background: #ef4444;
    }

    .order-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 380px;
        overflow-y: auto;
    }
    .order-item {
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 12px;
    }
    .order-item:last-child {
        border-bottom: none;
    }

    .live-order-card {
        background: #fffbfd;
        border: 1px solid #fce7f3;
        padding: 12px;
        border-radius: 8px;
        transition: background-color 0.2s;
    }
    .live-order-card:hover {
        background-color: #fff5f8;
    }

    .order-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 4px;
    }
    .order-id {
        font-weight: 600;
        color: #475569;
    }
    .order-body {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .order-menu {
        font-size: 14px;
        font-weight: 600;
        color: #334155;
    }
    .order-status {
        font-size: 12px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 4px;
    }

    /* 영수증 버튼 스타일 */
    .btn-receipt {
        background: #fdf2f8;
        color: #d13b7d;
        border: 1px solid #fce7f3;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
    }
    .btn-receipt:hover {
        background: #fce7f3;
    }

    /* 💡 제조완료 버튼 스타일 */
    .btn-complete {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
    }
    .btn-complete:hover {
        background: #d1fae5;
    }

    /* 아코디언 상세 정보 스타일 */
    .order-detail-box {
        width: 100%;
        margin-top: 8px;
        animation: fadeIn 0.2s ease-in-out;
    }
    .detail-divider {
        height: 1px;
        background-color: #f1f5f9;
        margin: 8px 0;
    }
    .detail-title {
        font-size: 12px;
        font-weight: 700;
        color: #d13b7d;
        margin-bottom: 6px;
    }
    .detail-item-row {
        background: #ffffff;
        border: 1px solid #f1f5f9;
        padding: 8px 10px;
        border-radius: 6px;
        margin-bottom: 6px;
        font-size: 13px;
    }

    /* 💡 맛 및 옵션 파란색 태그 스타일 통일 */
    .option-tag {
        font-size: 11px;
        color: #2563eb;
        background: #eff6ff;
        padding: 3px 6px;
        border-radius: 4px;
        margin-top: 4px;
        display: inline-block;
        font-weight: 600;
    }

    /* 영수증 모달 스타일 */
    .receipt-modal-content {
        background: #ffffff;
        padding: 24px;
        border-radius: 8px;
        width: 380px;
        font-family: 'Courier New', Courier, monospace;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        box-sizing: border-box;
    }
    .receipt-header {
        text-align: center;
        margin-bottom: 12px;
    }
    .receipt-header h4 {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 2px;
    }
    .receipt-header p {
        font-size: 12px;
        color: #64748b;
    }
    .receipt-info-box {
        font-size: 12px;
        color: #334155;
        margin-bottom: 8px;
        line-height: 1.5;
    }
    .receipt-divider-line {
        border-top: 1px dashed #cbd5e1;
        margin: 10px 0;
    }
    .receipt-items-list {
        max-height: 220px;
        overflow-y: auto;
    }
    .receipt-item-row {
        margin-bottom: 10px;
        font-size: 12px;
    }
    .receipt-item-name {
        font-weight: 700;
        color: #1e293b;
        display: flex;
        justify-content: space-between;
    }
    .receipt-size {
        color: #d13b7d;
        margin-right: 4px;
    }
    .receipt-sub-tag {
        font-size: 11px;
        color: #2563eb;
        background: #eff6ff;
        padding: 2px 6px;
        border-radius: 4px;
        margin-top: 3px;
        display: inline-block;
        font-weight: 600;
    }
    .receipt-item-price {
        text-align: right;
        font-weight: 600;
        color: #334155;
        font-size: 12px;
        margin-top: 2px;
    }
    .receipt-total-box {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 8px;
    }
    .total-price-text {
        color: #d13b7d;
    }
    .receipt-footer-text {
        text-align: center;
        font-size: 11px;
        color: #64748b;
        margin-top: 14px;
        line-height: 1.4;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .status-waiting {
        background: #fffbeb;
        color: #d97706;
    }
    .status-shipping {
        background: #eff6ff;
        color: #2563eb;
    }
    .status-done {
        background: #ecfdf5;
        color: #059669;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
    }
    .modal-content {
        background: white;
        padding: 24px;
        border-radius: 12px;
        width: 400px;
    }
    .modal-desc {
        font-size: 13px;
        color: #94a3b8;
        margin-top: 4px;
        margin-bottom: 18px;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
    }
    .form-group label {
        font-size: 13px;
        font-weight: 600;
        color: #475569;
    }
    .form-group input,
    .form-group select {
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 14px;
    }
    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
    }
    .btn-cancel {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
    }
    .btn-submit {
        background: #d13b7d;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
    }
</style>