<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const selectOrderType = (type) => {
    router.push({
        path: "/size",
        query: {
            orderType: type
        }
    });
};
</script>

<template>
    <main class="home-page">
        <!-- 상단 로고 -->
        <header class="top-header">
            <img
                class="brand-logo"
                src="/images/home/logo.png"
                alt="SweetScoop"
            />
        </header>

        <!-- 메인 배너 -->
        <section class="banner-section">
            <div class="banner-frame">
                <img
                    class="banner-image"
                    src="/images/home/banner.png"
                    alt="SweetScoop 이벤트 배너"
                />
            </div>
        </section>

        <!-- 주문 방식 선택 -->
        <section class="order-type-section">
            <button
                type="button"
                class="order-type-button"
                @click="selectOrderType('TAKEOUT')"
            >
                <img
                    src="/images/home/takeout.png"
                    alt=""
                    class="button-icon"
                />

                <span>포장</span>
            </button>

            <button
                type="button"
                class="order-type-button"
                @click="selectOrderType('STORE')"
            >
                <img
                    src="/images/home/store.png"
                    alt=""
                    class="button-icon"
                />

                <span>매장</span>
            </button>
        </section>

        <!-- 언어 -->
        <button type="button" class="language-button">
            <span class="flag">🇰🇷</span>
            Language
        </button>
    </main>
</template>

<style scoped>
:global(body) {
    margin: 0;
    background: #f5f5f5;
    font-family:
        "Malgun Gothic",
        "Segoe UI",
        sans-serif;
}

* {
    box-sizing: border-box;
}

button {
    font-family: inherit;
}

.home-page {
    width: min(100%, 540px);
    min-height: 100vh;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    background: #fff;
}

/* 상단 로고 */

.top-header {
    height: 68px;
    display: flex;
    align-items: flex-start;
    padding: 10px 18px;
}

.brand-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
}

/* 이벤트 배너 */

.banner-section {
    padding: 8px 58px 0;
}

.banner-frame {
    width: 100%;
    padding: 9px;
    border: 2px solid #ff93c7;
    border-radius: 15px;
    background: #fff;
}

.banner-image {
    width: 100%;
    aspect-ratio: 0.66;
    display: block;
    object-fit: cover;
}

/* 매장/포장 선택 */

.order-type-section {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 42px 50px 24px;
}

.order-type-button {
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    border: 1.5px solid #ff1493;
    border-radius: 38px;
    background: #fff;
    color: #420027;
    font-size: 18px;
    font-weight: 800;
    cursor: pointer;
    transition:
        transform 0.2s,
        background 0.2s,
        color 0.2s;
}

.order-type-button:hover {
    transform: translateY(-3px);
    background: #fff2f9;
}

.order-type-button:active {
    transform: scale(0.98);
}

.button-icon {
    width: 42px;
    height: 42px;
    object-fit: contain;
}

/* 언어 버튼 */

.language-button {
    align-self: flex-end;
    margin: auto 38px 17px 0;
    padding: 8px 0;
    border: 0;
    background: transparent;
    color: #390023;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
}

.flag {
    margin-right: 5px;
}

/* 반응형 */

@media (max-width: 480px) {
    .top-header {
        height: 58px;
        padding: 8px 14px;
    }

    .brand-logo {
        width: 40px;
        height: 40px;
    }

    .banner-section {
        padding: 8px 38px 0;
    }

    .order-type-section {
        gap: 12px;
        padding: 34px 30px 20px;
    }

    .order-type-button {
        height: 64px;
        gap: 9px;
        font-size: 16px;
    }

    .button-icon {
        width: 36px;
        height: 36px;
    }

    .language-button {
        margin-right: 25px;
    }
}
</style>