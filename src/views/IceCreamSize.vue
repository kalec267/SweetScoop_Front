<script setup="setup">
    import {ref, onMounted} from "vue";
    import {useRouter, useRoute} from "vue-router";
    import api from "../api/axios";

    const router = useRouter();
    const route = useRoute();

    const sizes = ref([]);
    const loading = ref(false);
    const selectedCategory = ref(1);

    const categories = [
        {
            id: 1,
            name: "아이스크림"
        }, {
            id: 2,
            name: "아이스모찌"
        }, {
            id: 3,
            name: "커피"
        }
    ];

    /*
 * 카테고리별 사이즈 조회
 */
    const loadSize = async (categoryId = 1) => {
        loading.value = true;

        try {
            const response = await api.get(`/api/size/category/${categoryId}`);

            sizes.value = response.data;

            console.log("사이즈 목록:", sizes.value);
        } catch (error) {
            console.error("사이즈 조회 실패:", error);
            sizes.value = [];
        } finally {
            loading.value = false;
        }
    };

    /*
 * 카테고리 변경
 */
    const changeCategory = async (categoryId) => {
        selectedCategory.value = categoryId;

        // 아이스모찌, 커피는 바로 메뉴 화면으로 이동
        if (categoryId === 2 || categoryId === 3) {
            router.push({
                path: "/menu",
                query: {
                    orderType: route.query.orderType,
                    categoryId
                }
            });

            return;
        }

        // 아이스크림만 SIZE 테이블 조회
        await loadSize(categoryId);
    };

    const cupSelectableSizeIds = [1, 2, 3, 4, 5];

    /*
 * 사이즈 선택
 */
    const selectSize = (size) => {
        /*
     * 아이스크림 중 컵/콘 선택이 가능한 사이즈
     */
        if (selectedCategory.value === 1 && cupSelectableSizeIds.includes(size.id)) {
            router.push({
                path: "/cup",
                query: {
                    orderType: route.query.orderType,
                    categoryId: selectedCategory.value,
                    sizeId: size.id
                }
            });

            return;
        }

        /*
     * 파인트 이상, 커피 등은 컵 선택 화면 생략
     */
        router.push({
            path: "/menu",
            query: {
                orderType: route.query.orderType,
                categoryId: selectedCategory.value,
                sizeId: size.id,
                cupId: 1
            }
        });
    };

    const goBack = () => {
        router.push("/");
    };

    onMounted(() => {
        loadSize(1);
    });
</script>

<template>
    <main class="kiosk-frame">
        <header class="top-header">
            <img src="/images/home/logo.png" class="brand-logo" alt="SweetScoop 로고"/>

            <button type="button" class="back-button" @click="goBack">
                ← 이전
            </button>
        </header>

        <section class="title-section">
            <p class="step">STEP 1</p>

            <h1>상품을 선택해주세요</h1>

            <p>
                카테고리와 사이즈를 선택하세요.
            </p>
        </section>

        <!-- 카테고리 -->
        <nav class="category-tab">
            <button
                type="button"
                :class="{
                    active: selectedCategory === 1
                }"
                @click="changeCategory(1)">
                아이스크림
            </button>

            <button
                type="button"
                :class="{
                    active: selectedCategory === 2
                }"
                @click="changeCategory(2)">
                아이스모찌
            </button>

            <button
                type="button"
                :class="{
                    active: selectedCategory === 3
                }"
                @click="changeCategory(3)">
                커피
            </button>
        </nav>

        <!-- 사이즈 목록 -->
        <section class="size-section">
            <p v-if="loading" class="status-message">
                상품을 불러오는 중입니다.
            </p>

            <p v-else-if="sizes.length === 0" class="status-message">
                해당 카테고리에 등록된 사이즈가 없습니다.
            </p>

            <div v-else class="size-grid">
                <button
                    v-for="size in sizes"
                    :key="size.id"
                    type="button"
                    class="size-card"
                    @click="selectSize(size)">
                    <div class="image-area">
                        <img :src="`/images/size/${size.sizeImg}`" :alt="size.name"/>
                    </div>

                    <h2>{{ size.name }}</h2>

                    <p v-if="size.flavorCnt > 0" class="flavor-count">
                        맛
                        {{ size.flavorCnt }}개
                    </p>

                    <strong class="price">
                        ₩{{
                            Number(
                                size.price
                            ).toLocaleString()
                        }}
                    </strong>
                </button>
            </div>
        </section>

        <footer class="bottom-bar">
            <button type="button" class="bottom-back-button" @click="goBack">
                <span class="arrow">‹</span>
                이전
            </button>

            <p class="guide-text">
                상품을 선택하면 다음 단계로 이동합니다.
            </p>
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
        width: 100%;
        min-height: 100vh;
        margin: 0 auto;
        padding-bottom: 100px;
        position: relative;
        background: #fff;
    }

    /* 상단 */

    .top-header {
        height: 66px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 18px;
    }

    .brand-logo {
        width: 46px;
        height: 46px;
        object-fit: contain;
    }

    .back-button {
        padding: 9px 15px;
        border: 0;
        border-radius: 22px;
        background: #ffe3f1;
        color: #d90072;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
    }

    /* 제목 */

    .title-section {
        padding: 15px 20px 24px;
        text-align: center;
    }

    .step {
        margin: 0;
        color: #ff1493;
        font-size: 12px;
        font-weight: 800;
    }

    .title-section h1 {
        margin: 8px 0;
        color: #222;
        font-size: 26px;
    }

    .title-section > p:last-child {
        margin: 0;
        color: #999;
        font-size: 13px;
    }

    .category-tab {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        margin: 0 18px 25px;
        border-bottom: 1px solid #eeeeee;
    }

    .category-tab button {
        padding: 13px 5px;
        border: none;
        border-bottom: 3px solid transparent;
        background: #ffffff;
        color: #999999;
        font-size: 13px;
        cursor: pointer;
        transition: 0.2s;
    }

    .category-tab button:hover {
        color: #ff1493;
        background: #fff7fb;
    }

    .category-tab button.active {
        border-bottom-color: #ff1493;
        color: #ff1493;
        font-weight: 800;
    }

    /* 사이즈 목록 */

    .size-section {
        padding: 0 18px 24px;
    }

    .size-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px 10px;
    }

    .size-card {
        min-width: 0;
        padding: 12px 5px 14px;
        border: 2px solid transparent;
        border-radius: 16px;
        background: #fff;
        text-align: center;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s, transform 0.2s;
    }

    .size-card:hover {
        border-color: #ff8fc8;
        background: #fff8fc;
        transform: translateY(-3px);
    }

    .image-area {
        height: 78px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .image-area img {
        width: 72px;
        height: 72px;
        object-fit: contain;
    }

    .size-card h2 {
        min-height: 34px;
        margin: 8px 0 4px;
        color: #222;
        font-size: 12px;
        line-height: 1.4;
    }

    .flavor-count {
        margin: 0 0 5px;
        color: #999;
        font-size: 10px;
        font-weight: bold;
    }

    .price {
        color: #ff1493;
        font-size: 11px;
    }

    .status-message {
        padding: 100px 0;
        text-align: center;
        color: #999;
        font-size: 14px;
    }

    /* 하단 */

    .bottom-bar {
        width: 100%;
        min-height: 92px;
        padding: 17px 14px;
        display: flex;
        align-items: center;
        gap: 15px;
        position: absolute;
        left: 0;
        bottom: 0;
        border-top: 1px solid #eee;
        background: #fff;
    }

    .bottom-back-button {
        width: 200px;
        height: 58px;
        border: 1px solid #ddd;
        border-radius: 31px;
        background: #fff;
        color: #ff1493;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
    }

    .arrow {
        margin-right: 20px;
        font-size: 32px;
        line-height: 0;
        vertical-align: -3px;
    }

    .guide-text {
        flex: 1;
        margin: 0;
        color: #999;
        font-size: 11px;
        line-height: 1.5;
        text-align: center;
    }

</style>