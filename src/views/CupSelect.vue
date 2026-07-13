<script setup="setup">
    import {ref, onMounted} from "vue";
    import {useRoute, useRouter} from "vue-router";
    import api from "../api/axios";

    const route = useRoute();
    const router = useRouter();

    const cups = ref([]);
    const selectedCup = ref(null);
    
    const orderType = route.query.orderType;
    const sizeId = Number(route.query.sizeId);

    const loadCups = async () => {
        try {
            const response = await api.get("/api/cup");
            cups.value = response.data;
        } catch (error) {
            console.error("컵 목록 조회 실패", error);
        }
    };

    const selectCup = (cup) => {
        selectedCup.value = cup;
    };

    const goNext = () => {
        if (!selectedCup.value) {
            alert("컵 종류를 선택해주세요.");
            return;
        }

        router.push({
            path: "/menu",
            query: {
                orderType,
                sizeId,
                cupId: selectedCup.value.id
            }
        });
    };

    const goBack = () => {
        router.push({path: "/size", query: {
                orderType
            }});
    };

    onMounted(loadCups);
</script>

<template>
    <div class="cup-page">
        <div class="top-bar">
            <button class="back-btn" @click="goBack">
                ← 이전
            </button>
        </div>

        <div class="header">
            <p class="step">STEP 2</p>
            <h1>제공 형태를 선택해주세요</h1>
            <p>컵, 콘, 와플콘 중 하나를 선택하세요.</p>
        </div>

        <div class="cup-grid">
            <button
                v-for="cup in cups"
                :key="cup.id"
                type="button"
                class="cup-card"
                :class="{ selected: selectedCup?.id === cup.id }"
                @click="selectCup(cup)">
                <div class="cup-icon">
                    <img :src="`/images/cup/${cup.name}.png`" :alt="cup.name"/>
                </div>

                <h2>{{ cup.name }}</h2>

                <p class="extra-price">
                    {{ cup.additionalPrice > 0
        ? `+${cup.additionalPrice.toLocaleString()}원`
        : "추가금액 없음"
    }}
                </p>
            </button>
        </div>

        <div class="bottom-bar">
            <div class="selected-info">
                <span>선택:</span>
                <strong>{{ selectedCup?.name || "없음" }}</strong>
            </div>

            <button type="button" class="next-btn" :disabled="!selectedCup" @click="goNext">
                맛 선택하기
            </button>
        </div>
    </div>
</template>

<style scoped="scoped">
    .cup-page {
        width: min(96%, 540px);
        min-height: 100vh;
        margin: 0 auto;
        padding: 0 14px 24px;
        box-sizing: border-box;
        background: #fff;
    }

    /* 상단 */
    .top-bar {
        display: flex;
        justify-content: flex-end;
        padding-top: 12px;
    }

    .back-btn {
        padding: 9px 15px;
        border: 0;
        border-radius: 22px;
        background: #ffe3f1;
        color: #d90072;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
    }

    /* 제목 영역 */
    .header {
        margin: 18px 0 28px;
        text-align: center;
    }

    .header .step {
        margin: 0;
        color: #ff1493;
        font-size: 13px;
        font-weight: 800;
    }

    .header h1 {
        margin: 8px 0;
        font-size: 24px;
    }

    .header > p:last-child {
        margin: 0;
        color: #999;
        font-size: 14px;
    }

    /* 컵 선택 영역 */
    .cup-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
    }

    .cup-card {
        min-height: 150px;
        padding: 12px 8px;
        border: 2px solid #ddd;
        border-radius: 16px;
        background: #fff;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s, transform 0.2s;
    }

    .cup-card:hover {
        transform: translateY(-2px);
    }

    .cup-card.selected {
        border-color: #ff1493;
        background: #fff7fb;
    }

    /* 컵 이미지 */
    .cup-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 72px;
    }

    .cup-icon img {
        width: 64px;
        height: 64px;
        object-fit: contain;
    }

    /* 컵 이름 */
    .cup-card h2 {
        margin: 8px 0 6px;
        font-size: 14px;
        font-weight: 700;
    }

    /* 추가 금액 */
    .extra-price {
        margin: 0;
        color: #ff1493;
        font-size: 12px;
        font-weight: 700;
    }

    /* 하단 영역 */
    .bottom-bar {
        position: sticky;
        bottom: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 40px;
        padding: 16px 0 8px;
        background: rgba(255, 255, 255, 0.98);
    }

    .selected-info {
        flex: 1;
        display: flex;
        gap: 6px;
        padding-left: 4px;
        font-size: 14px;
    }

    .next-btn {
        min-width: 210px;
        padding: 15px 22px;
        border: none;
        border-radius: 30px;
        background: #ff1493;
        color: #fff;
        font-size: 16px;
        font-weight: 800;
        cursor: pointer;
    }

    .next-btn:disabled {
        background: #d6d6d6;
        cursor: not-allowed;
    }

    /* 태블릿 */
    @media (max-width: 760px) {
        .cup-page {
            width: 100%;
        }

        .cup-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }

        .cup-card {
            min-height: 138px;
            padding: 10px 5px;
        }

        .cup-icon {
            height: 62px;
        }

        .cup-icon img {
            width: 56px;
            height: 56px;
        }

        .cup-card h2 {
            font-size: 13px;
        }

        .extra-price {
            font-size: 11px;
        }
    }
</style>