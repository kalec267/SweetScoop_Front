<script setup="setup">

    const props = defineProps({
        menu: {
            type: Object,
            required: true
        },
        selected: {
            type: Boolean,
            default: false
        }
    })

    const emit = defineEmits(["selectMenu"])
</script>

<template>

    <div
        class="menu-card"
        :class="{ selected: selected }"
        @click="emit('selectMenu', menu)">

        <div class="image-area">
            <img :src="menu.menuImg" :alt="menu.name" class="menu-image"></div>

            <h2 class="menu-title">
                {{ menu.name }}
            </h2>

            <p v-if="menu.categoryId !== 1 && menu.price != null" class="menu-price">
                ₩{{ Number(menu.price).toLocaleString() }}
            </p>

        </div>
    </template>

    <style scoped="scoped">
        .menu-card {
            min-width: 0;
            padding: 12px 5px 14px;
            border: 2px solid transparent;
            border-radius: 16px;
            background: #fff;
            text-align: center;
            cursor: pointer;
            transition: 0.2s;
        }

        .menu-card:hover {
            border-color: #ff8fc8;
            background: #fff8fc;
            transform: translateY(-3px);
        }

        .menu-card.selected {
            border-color: #ff1493;
            background: #fff0f7;
        }

        .image-area {
            height: 78px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .menu-image {
            width: 72px;
            height: 72px;
            object-fit: contain;
        }
        .menu-title {
            min-height: 34px;
            margin: 8px 0 4px;
            color: #222;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.4;
        }

        .menu-price {
            color: #ff1493;
            font-size: 11px;
            font-weight: 700;
        }
    </style>