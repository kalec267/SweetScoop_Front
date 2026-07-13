<script setup>

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
    :class="{ selected }"
    @click="emit('selectMenu', menu)"
>

    <div class="image-box">
        <img
            :src="menu.menuImg"
            :alt="menu.name"
            class="menu-image"
        >
    </div>

    <div class="menu-name">
        {{ menu.name }}
    </div>

</div>

</template>

<style scoped>

.menu-card{

    background:white;

    border:2px solid transparent;

    border-radius:18px;

    padding:12px 8px;

    text-align:center;

    cursor:pointer;

    transition:.2s;

}

.menu-card:hover{

    border-color:#ff9acb;

    background:#fff8fc;

}

.menu-card.selected{

    border-color:#ff1493;

    background:#fff0f7;

}

.image-box{

    width:100%;

    height:90px;

    display:flex;

    justify-content:center;

    align-items:center;

}

.menu-image{

    width:72px;

    height:72px;

    object-fit:contain;

}

.menu-name{

    margin-top:10px;

    font-size:13px;

    font-weight:600;

    color:#333;

    line-height:1.3;

    min-height:34px;

}

</style>