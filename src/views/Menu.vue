<script setup="setup">
    import {ref, computed, onMounted} from "vue";
    import {useRoute, useRouter} from "vue-router";

    import api from "../api/axios";
    import MenuCard from "../components/MenuCard.vue";

    const route = useRoute();
    const router = useRouter();
    const orderType = route.query.orderType;
    const categoryId = Number(route.query.categoryId) || 1;
    const sizeId = route.query.sizeId
        ? Number(route.query.sizeId)
        : null;

    const cupId = route.query.cupId
        ? Number(route.query.cupId)
        : null;

    console.log("카테고리:", categoryId);
    console.log("주문 유형:", orderType);
    console.log("사이즈 ID:", sizeId);
    console.log("컵 ID:", cupId);

    const sizeInfo = ref({});
    const selectedCup = ref(null);

    const menus = ref([]);
    const selectedMenusByCategory = ref({
        1: [], // 아이스크림 맛
        2: [], // 아이스모찌
        3: [] // 커피
    });

    const selectedMenus = computed({
        get() {
            return selectedMenusByCategory.value[selectedCategory.value];
        },

        set(value) {
            selectedMenusByCategory.value[selectedCategory.value] = value;
        }
    });
    const selectedCategory = ref(categoryId);

    const loading = ref(false);

    /*
 * 사이즈의 flavorCnt만큼 빈 슬롯 생성
 */
    const flavorSlots = computed(() => {
        // 아이스크림은 사이즈의 맛 개수만큼 고정 슬롯
        if (selectedCategory.value === 1) {
            return Array.from({
                length: Number(sizeInfo.value.flavorCnt) || 0
            });
        }

        // 아이스모찌와 커피는 선택한 메뉴 개수만큼 표시
        return Array.from({length: selectedMenus.value.length});
    });

    /*
 * 현재 선택한 맛 개수
 */
    const selectedCount = computed(() => {
        return selectedMenus.value.length;
    });

    /*
 * 모든 맛을 선택했는지 확인
 */
    const isSelectionComplete = computed(() => {

        // 아이스크림은 사이즈의 맛 개수를 모두 채워야 완료
        if (selectedCategory.value === 1) {
            const flavorCnt = Number(sizeInfo.value.flavorCnt) || 0;

            return flavorCnt > 0 && selectedMenus.value.length === flavorCnt;
        }

        // 아이스모찌와 커피는 1개 이상 선택하면 완료
        return selectedMenus.value.length > 0;
    });

    /*
 * 와플콘 추가 금액을 포함한 최종 가격
 *
 * 컵: 0원
 * 콘: 0원
 * 와플콘: 500원
 */
    const totalPrice = computed(() => {
        const sizePrice = Number(sizeInfo.value.price) || 0;
        const cupAdditionalPrice = Number(
            selectedCup.value
                ?.additionalPrice
        ) || 0;

        return sizePrice + cupAdditionalPrice;
    });

    /*
 * 사이즈 상세 조회
 */
    const loadSize = async () => {
        try {
            const response = await api.get(`/api/size/${sizeId}`);

            sizeInfo.value = response.data;
        } catch (error) {
            console.error("사이즈 조회 실패:", error);
        }
    };

    /*
 * 선택한 컵 정보 조회
 *
 * /api/cup 전체 목록에서
 * 전달받은 cupId와 같은 컵을 찾음
 */
    const loadSelectedCup = async () => {
        try {
            const response = await api.get("/api/cup");

            selectedCup.value = response
                .data
                .find(cup => Number(cup.id) === cupId) || null;
        } catch (error) {
            console.error("컵 정보 조회 실패:", error);
        }
    };

    /*
 * 카테고리별 메뉴 조회
 */
    const loadMenu = async (categoryId = 1) => {
        loading.value = true;

        try {
            const response = await api.get(`/api/menu/category/${categoryId}`);

            menus.value = response.data;
        } catch (error) {
            console.error("메뉴 조회 실패:", error);
            menus.value = [];
        } finally {
            loading.value = false;
        }
    };

    /*
 * 카테고리 변경
 */
    const changeCategory = async (categoryId) => {

        // 아이스크림 탭은 사이즈 선택 화면으로 이동
        if (categoryId === 1) {

            router.push({path: "/size", query: {
                    orderType
                }});

            return;
        }

        // 아이스모찌 / 커피는 현재 화면에서 메뉴판만 변경
        selectedCategory.value = categoryId;

        selectedMenus.value = [];

        await loadMenu(categoryId);
    };

    /*
 * 맛 선택 및 선택 해제
 */
    const selectMenu = (menu) => {
        const index = selectedMenus
            .value
            .findIndex(item => item.id === menu.id);

        // 같은 메뉴를 다시 클릭하면 제거
        if (index !== -1) {
            selectedMenus
                .value
                .splice(index, 1);
            return;
        }

        // 아이스크림만 사이즈별 맛 개수 제한
        if (selectedCategory.value === 1) {
            const maxFlavorCount = Number(sizeInfo.value.flavorCnt) || 0;

            if (selectedMenus.value.length >= maxFlavorCount) {
                alert(`최대 ${maxFlavorCount}개의 맛만 선택할 수 있습니다.`);

                return;
            }
        }

        // 아이스모찌와 커피는 제한 없이 추가
        selectedMenus
            .value
            .push(menu);
    };

    /*
 * 메뉴 선택 여부
 */
    const isSelected = (id) => {
        return selectedMenus
            .value
            .some(item => item.id === id);
    };

    /*
 * 선택 슬롯을 직접 클릭해도 제거 가능
 */
    const removeSelectedMenu = (index) => {
        if (!selectedMenus.value[index]) {
            return;
        }

        selectedMenus
            .value
            .splice(index, 1);
    };

    /*
 * 이전 화면
 */
    const goBack = () => {
        router.back();
    };

    /*
 * 처음 화면
 */
    const goHome = () => {
        router.push("/");
    };

    /*
 * 선택 완료
 */
    const goNext = () => {

        const iceCreamMenus = selectedMenusByCategory.value[1];

        const mochiMenus = selectedMenusByCategory.value[2];

        const coffeeMenus = selectedMenusByCategory.value[3];

        /*
     * 아이스크림 주문이 있는 경우
     * 선택 가능한 맛 개수를 모두 채웠는지 검사
     */
        if (sizeId) {

            const flavorCnt = Number(sizeInfo.value.flavorCnt) || 0;

            if (iceCreamMenus.length !== flavorCnt) {

                alert(`${flavorCnt}개의 아이스크림 맛을 모두 선택해주세요.`);

                return;
            }

        }

        /*
     * 선택한 상품이 하나도 없는 경우
     */
        const hasSelectedProduct = iceCreamMenus.length > 0 || mochiMenus.length > 0 || coffeeMenus.length > 0;

        if (!hasSelectedProduct) {

            alert("상품을 1개 이상 선택해주세요.");

            return;
        }

        const orderData = {

            orderType,

            customerId: 1,

            branchId: 1,

            kioskId: 1,

            iceCream: sizeId
                ? {
                    sizeId,

                    sizeName: sizeInfo.value.name,

                    cupId,

                    cupName: selectedCup.value
                        ?.name || null,

                    basePrice: Number(sizeInfo.value.price) || 0,

                    additionalPrice: Number(
                        selectedCup.value
                            ?.additionalPrice
                    ) || 0,

                    totalPrice: totalPrice.value,

                    flavors: iceCreamMenus.map(
                        menu => ({menuId: menu.id, name: menu.name, menuImg: menu.menuImg})
                    )
                }
                : null,

            mochi: mochiMenus.map(menu => ({
                menuId: menu.id,
                name: menu.name,
                menuImg: menu.menuImg,
                price: Number(menu.price) || 0
            })),

            coffee: coffeeMenus.map(menu => ({
                menuId: menu.id,
                name: menu.name,
                menuImg: menu.menuImg,
                price: Number(menu.price) || 0
            }))

        };

        sessionStorage.setItem("orderData", JSON.stringify(orderData));

        console.log("저장된 주문 JSON:", orderData);

        router.push("/payment");

    };

    const canMoveToPayment = computed(() => {

        const iceCreamMenus = selectedMenusByCategory.value[1];

        const mochiMenus = selectedMenusByCategory.value[2];

        const coffeeMenus = selectedMenusByCategory.value[3];

        const hasProduct = iceCreamMenus.length > 0 || mochiMenus.length > 0 || coffeeMenus.length > 0;

        if (!hasProduct) {
            return false;
        }

        if (sizeId) {

            const flavorCnt = Number(sizeInfo.value.flavorCnt) || 0;

            return (flavorCnt > 0 && iceCreamMenus.length === flavorCnt);

        }

        return true;

    });

    onMounted(async () => {
        await loadMenu(categoryId);

        // 아이스크림인 경우에만 사이즈와 컵 정보 조회
        if (categoryId === 1 && sizeId) {
            await Promise.all([loadSize(), loadSelectedCup()]);
        }
    });
</script>

<template>
    <main class="kiosk-frame">
        <!-- 상단 -->
        <header class="top-header">
            <button type="button" class="home-button" @click="goHome">
                <img src="/images/home/logo.png" alt="SweetScoop"/>
            </button>

            <div class="header-title">
                플레이버 선택
            </div>

            <button type="button" class="top-back-button" @click="goBack">
                이전
            </button>
        </header>

        <!-- 주문 상품 정보 -->
        <section class="product-summary">
            <div>
                <p class="summary-label">
                    선택한 상품
                </p>

                <h1>
                    {{ sizeInfo.name || "사이즈 정보" }}
                </h1>

                <p class="cup-info">
                    {{ selectedCup?.name || "제공 형태 확인 중" }}

                    <span
                        v-if="
                            Number(
                                selectedCup?.additionalPrice
                            ) > 0
                        ">
                        +{{
                            Number(
                                selectedCup.additionalPrice
                            ).toLocaleString()
                        }}원
                    </span>
                </p>
            </div>

            <strong class="total-price">
                ₩{{ totalPrice.toLocaleString() }}
            </strong>
        </section>

        <nav class="category-tab">
            <button
                type="button"
                :class="{ active: selectedCategory === 1 }"
                @click="changeCategory(1)">
                아이스크림
            </button>

            <button
                type="button"
                :class="{ active: selectedCategory === 2 }"
                @click="changeCategory(2)">
                아이스모찌
            </button>

            <button
                type="button"
                :class="{ active: selectedCategory === 3 }"
                @click="changeCategory(3)">
                커피
            </button>
        </nav>

        <!-- 메뉴 목록 -->
        <section class="menu-section">
            <p v-if="loading" class="status-message">
                메뉴를 불러오는 중입니다.
            </p>

            <p v-else-if="menus.length === 0" class="status-message">
                등록된 메뉴가 없습니다.
            </p>

            <div v-else class="menu-grid">
                <MenuCard
                    v-for="menu in menus"
                    :key="menu.id"
                    :menu="menu"
                    :selected="
                        isSelected(menu.id)
                    "
                    @selectMenu="selectMenu"/>
            </div>
        </section>

        <!-- 선택 상태 -->
        <section class="selection-status">
            <strong v-if="selectedCategory === 1">
                맛 선택
                {{ selectedCount }}
                /
                {{ sizeInfo.flavorCnt || 0 }}
            </strong>

            <strong v-else>
                선택한 상품
                {{ selectedCount }}개
            </strong>

            <p>
                선택한 상품을 다시 누르면 취소됩니다.
            </p>
        </section>

        <!-- 빈 슬롯 및 선택된 맛 -->
        <section class="selected-area">
            <button
                v-for="(slot, index) in flavorSlots"
                :key="index"
                type="button"
                class="selected-slot"
                @click="removeSelectedMenu(index)">
                <div
                    class="slot-box"
                    :class="{
                        filled: selectedMenus[index]
                    }">
                    <img
                        v-if="selectedMenus[index]"
                        :src="
                            selectedMenus[index].menuImg
                        "
                        :alt="
                            selectedMenus[index].name
                        "/>

                    <span v-else class="empty-symbol">
                        +
                    </span>
                </div>

                <span class="slot-number">
                    {{ index + 1 }}
                </span>

                <p class="slot-name">
                    {{
                        selectedMenus[index]
                            ? selectedMenus[index].name
                            : "맛 선택"
                    }}
                </p>
            </button>
        </section>

        <!-- 하단 -->
        <footer class="bottom-bar">
            <button type="button" class="bottom-button previous" @click="goBack">
                <span class="arrow">
                    ‹
                </span>

                이전
            </button>

            <button
                type="button"
                class="bottom-button next"
                :disabled="!canMoveToPayment"
                @click="goNext">
                선택 완료
            </button>
        </footer>
    </main>
</template>

<style scoped="scoped">
    :global(body) {
        margin: 0;
        background: #f3f3f3;
        font-family: "Malgun Gothic", "Segoe UI", sans-serif;
    }

    * {
        box-sizing: border-box;
    }

    button {
        font-family: inherit;
    }

    .kiosk-frame {
        width: min(100%, 540px);
        min-height: 100vh;
        margin: 0 auto;
        padding-bottom: 105px;
        position: relative;
        background: #fff;
    }

    /* 상단 */

    .top-header {
        height: 62px;
        display: grid;
        grid-template-columns: 65px 1fr 65px;
        align-items: center;
        padding: 5px 12px;
    }

    .home-button {
        width: 45px;
        height: 45px;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
    }

    .home-button img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .header-title {
        text-align: center;
        color: #ff1493;
        font-size: 15px;
        font-weight: 800;
    }

    .top-back-button {
        padding: 8px 11px;
        border: 0;
        border-radius: 18px;
        background: #ffe5f2;
        color: #d90072;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
    }

    /* 상품 요약 */

    .product-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        padding: 20px 34px 15px;
    }

    .summary-label {
        margin: 0 0 5px;
        color: #aaa;
        font-size: 11px;
    }

    .product-summary h1 {
        margin: 0;
        color: #222;
        font-size: 20px;
    }

    .cup-info {
        margin: 7px 0 0;
        color: #777;
        font-size: 12px;
    }

    .cup-info span {
        margin-left: 5px;
        color: #ff1493;
        font-weight: 700;
    }

    .total-price {
        color: #ff1493;
        font-size: 21px;
        white-space: nowrap;
    }

    /* 선택 상태 */

    .selection-status {
        margin: 5px 22px 15px;
        padding: 12px;
        border-radius: 12px;
        background: #fff5fa;
        text-align: center;
    }

    .selection-status strong {
        color: #ff1493;
        font-size: 15px;
    }

    .selection-status p {
        margin: 5px 0 0;
        color: #999;
        font-size: 11px;
    }

    /* 선택 슬롯 */

    .selected-area {
        min-height: 120px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 12px;
        padding: 4px 15px 12px;
        overflow-x: auto;
    }

    .selected-slot {
        flex: 0 0 76px;
        padding: 0;
        border: 0;
        background: transparent;
        text-align: center;
        cursor: pointer;
    }

    .slot-box {
        width: 70px;
        height: 70px;
        margin: 0 auto;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 2px solid #ff8fc8;
        border-radius: 18px;
        overflow: hidden;
        background: #fff;
    }

    .slot-box.filled {
        background: #fff8fc;
    }

    .slot-box img {
        width: 64px;
        height: 64px;
        object-fit: contain;
    }

    .empty-symbol {
        color: #ff9dce;
        font-size: 25px;
    }

    .slot-number {
        width: 19px;
        height: 19px;
        margin: -7px auto 0;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        background: #ff1493;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
    }

    .slot-name {
        min-height: 26px;
        margin: 4px 0 0;
        color: #777;
        font-size: 9px;
        line-height: 1.35;
    }

    /* 카테고리 */

    .category-tab {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        margin: 0 14px 17px;
        border-bottom: 1px solid #eee;
    }

    .category-tab button {
        padding: 11px 3px;
        border: 0;
        border-bottom: 3px solid transparent;
        background: #fff;
        color: #999;
        font-size: 12px;
        cursor: pointer;
    }

    .category-tab button.active {
        border-bottom-color: #ff1493;
        color: #ff1493;
        font-weight: 800;
    }

    /* 메뉴 */

    .menu-section {
        min-height: 310px;
        padding: 0 14px 20px;
    }

    .menu-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px 5px;
    }

    .status-message {
        padding: 80px 0;
        text-align: center;
        color: #999;
        font-size: 13px;
    }

    /* 하단 */

    .bottom-bar {
        width: 100%;
        height: 94px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        padding: 17px 12px;
        position: absolute;
        left: 0;
        bottom: 0;
        border-top: 1px solid #eee;
        background: #fff;
    }

    .bottom-button {
        border-radius: 31px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
    }

    .bottom-button.previous {
        border: 1px solid #ddd;
        background: #fff;
        color: #ff1493;
    }

    .bottom-button.next {
        border: 0;
        background: #ff1493;
        color: #fff;
    }

    .bottom-button.next:disabled {
        background: #d8d8d8;
        cursor: not-allowed;
    }

    .arrow {
        margin-right: 15px;
        font-size: 31px;
        line-height: 0;
        vertical-align: -3px;
    }

    @media (max-width: 480px) {
        .kiosk-frame {
            border-width: 4px;
        }

        .product-summary {
            padding: 17px 20px 13px;
        }

        .menu-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .selected-area {
            justify-content: flex-start;
        }
    }
</style>