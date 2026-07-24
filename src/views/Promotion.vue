<template>
    <div class="menu-management-container">
        <div class="page-header">
            <div>
                <h2>이벤트 관리</h2>
                <p class="subtitle">
                    키오스크에 노출될 이벤트를 등록·수정·삭제합니다.
                </p>
            </div>

            <button class="btn-primary" @click="openCreateModal">
                ＋ 신규 이벤트 등록
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>이벤트명</th>
                        <th>시작일</th>
                        <th>종료일</th>
                        <th>시작시간</th>
                        <th>종료시간</th>
                        <th>관리</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-if="paginatedPromotions.length === 0">
                        <td colspan="6" class="text-center py-5 text-muted">
                            등록된 이벤트가 없습니다.
                        </td>
                    </tr>

                    <tr v-for="promotion in paginatedPromotions" :key="promotion.id">
                        <td>{{ promotion.id }}</td>
                        <td>
                            <span class="event-name">
                                {{ promotion.eventName }}
                            </span>
                        </td>
                        <td>{{ promotion.startDate }}</td>
                        <td>{{ promotion.endDate }}</td>
                        <td>{{ formatDateTime(promotion.startTime) }}</td>
                        <td>{{ formatDateTime(promotion.endTime) }}</td>
                        <td>
                            <div class="btn-group">
                                <button class="btn-detail" @click="openDetailModal(promotion)">
                                    상세보기
                                </button>
                                <button class="btn-edit" @click="openEditModal(promotion)">
                                    수정
                                </button>

                                <button class="btn-delete" @click="removePromotion(promotion.id)">
                                    삭제
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="pagination-container" v-if="promotions.length > 0">
            <div class="pagination-info">
                전체
                {{ promotions.length }}개 항목 중
                {{ (currentPage-1)*itemsPerPage+1 }}
                -
                {{ Math.min(currentPage*itemsPerPage,promotions.length) }}
                표시
            </div>

            <div class="pagination-pages">

                <button
                    class="btn-page-nav"
                    @click="setPage(currentPage - 1)"
                    :disabled="currentPage === 1">
                    &lt;
                </button>

                <button
                    v-for="page in totalPages"
                    :key="page"
                    class="btn-page"
                    :class="{active:currentPage===page}"
                    @click="setPage(page)">
                    {{ page }}
                </button>

                <button
                    class="btn-page-nav"
                    @click="setPage(currentPage + 1)"
                    :disabled="currentPage === totalPages">
                    &gt;
                </button>
            </div>
        </div>
        <!-- 1. 등록 / 수정 팝업 모달 -->
        <div v-if="isModalOpen" class="modal-overlay">
            <div class="modal-content">
                <h3>{{ isEditMode ? '이벤트 수정' : '신규 이벤트 등록' }}</h3>

                <div class="form-group">
                    <label>이벤트명</label>
                    <input type="text" v-model="promotionForm.eventName"/>
                </div>

                <div class="form-group">
                    <label>이벤트 내용</label>
                    <textarea v-model="promotionForm.eventContent"></textarea>
                </div>

                <div class="form-group">
                    <label>시작일</label>
                    <input type="date" v-model="promotionForm.startDate"/>
                </div>

                <div class="form-group">
                    <label>종료일</label>
                    <input type="date" v-model="promotionForm.endDate"/>
                </div>

                <div class="form-group">
                    <label>시작시간</label>
                    <input type="datetime-local" v-model="promotionForm.startTime"/>
                </div>

                <div class="form-group">
                    <label>종료시간</label>
                    <input type="datetime-local" v-model="promotionForm.endTime"/>
                </div>
                <div class="form-group">

                    <label>이벤트 이미지</label>

                    <div class="image-select-list">

                        <div
                            v-for="img in imageList"
                            :key="img.code"
                            class="image-item"
                            @click="selectImage(img)">

                            <img :src="img.url"/>

                            <span>
                                {{ img.name }}
                            </span>

                        </div>

                    </div>
                    <img
                        v-if="promotionForm.imageUrl"
                        :src="promotionForm.imageUrl"
                        style="
    width:40px;
    margin-top:10px;
    height:60px;
    border-radius:10px;
  "/>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" @click="closeModal">
                        취소
                    </button>

                    <button class="btn-primary" @click="submitPromotion">
                        저장
                    </button>
                </div>
            </div>
        </div>
        <div v-if="isDetailModalOpen" class="modal-overlay">
            <div class="modal-content">
                <h3>이벤트 상세보기</h3>

                <div class="form-group">
                    <label>이벤트명</label>
                    <p>{{ selectedPromotion.eventName }}</p>
                </div>

                <div class="form-group">
                    <label>이벤트 내용</label>
                    <p>{{ selectedPromotion.eventContent }}</p>
                </div>

                <div class="form-group">
                    <label>시작일</label>
                    <p>{{ selectedPromotion.startDate }}</p>
                </div>

                <div class="form-group">
                    <label>종료일</label>
                    <p>{{ selectedPromotion.endDate }}</p>
                </div>

                <div class="form-group">
                    <label>시작시간</label>
                    <p>{{ formatDateTime(selectedPromotion.startTime) }}</p>
                </div>

                <div class="form-group">
                    <label>종료시간</label>
                    <p>{{ formatDateTime(selectedPromotion.endTime) }}</p>
                </div>
                <div class="form-group" v-if="selectedPromotion.imageUrl">
                    <label>이벤트 이미지</label>

                    <img
                        :src="selectedPromotion.imageUrl"
                        style="
 width:200px;
 border-radius:10px;
 "/>

                </div>
                <div class="modal-actions">
                    <button class="btn-primary" @click="closeDetailModal">
                        닫기
                    </button>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup="setup">
    import {ref, computed, onMounted} from 'vue'
    import axios from 'axios'

    const imageList = [
        {
            code: "POINT_EVENT",
            name: "포인트 적립 이벤트",
            url: "/images/event/point-event.png"
        }
    ]
    const getImageUrl = (imageCode) => {

        return imageList.find(img => img.code === imageCode)
            ?.url
    }

    const selectedImage = ref(null)

    const selectImage = (img) => {
        console.log("선택한 이미지:", img)

        selectedImage.value = img
        promotionForm.value.imageCode = img.code
        promotionForm.value.imageUrl = img
            .url

            console
            .log(promotionForm.value)

    }

    const currentPage = ref(1)
    const itemsPerPage = 5

    const isModalOpen = ref(false)
    const isEditMode = ref(false)
    const selectedPromotionId = ref(null)

    const promotionForm = ref({
        eventName: "",
        eventContent: "",
        imageCode: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        imageUrl: ""
    })

    const submitPromotion = async () => {

        console.log(JSON.stringify(promotionForm.value))

        if (isEditMode.value) {

            await axios.put(
                `/api/promotion/${selectedPromotionId.value}`,
                promotionForm.value
            )

        } else {

            await axios.post("/api/promotion", promotionForm.value)

        }

        await loadPromotion()
        alert(
            isEditMode.value
                ? "수정되었습니다."
                : "등록되었습니다."
        )
        isModalOpen.value = false
    }

    const closeModal = () => {
        isModalOpen.value = false
    }

    const paginatedPromotions = computed(() => {
        const start = (currentPage.value - 1) * itemsPerPage
        return promotions
            .value
            .slice(start, start + itemsPerPage)
    })

    const totalPages = computed(
        () => Math.max(1, Math.ceil(promotions.value.length / itemsPerPage))
    )

    const setPage = (page) => {
        if (page < 1 || page > totalPages.value) 
            return
        currentPage.value = page
    }

    const promotions = ref([])

    const loadPromotion = async () => {
        try {
            const res = await axios.get("/api/promotion")

            console.log("API 원본:", res.data)

            promotions.value = res.data

        } catch (error) {
            console.error(error)
        }
    }

    //등록창
    const openCreateModal = () => {
        isEditMode.value = false

        promotionForm.value = {
            eventName: "",
            eventContent: "",
            imageCode: "",
            startDate: "",
            endDate: "",
            startTime: "",
            endTime: "",
            imageUrl: ""
        }
        isModalOpen.value = true
    }
    //수정창
    const openEditModal = (promotion) => {
        isEditMode.value = true

        selectedPromotionId.value = promotion.id

        promotionForm.value = {
            eventName: promotion.eventName,
            eventContent: promotion.eventContent,
            imageCode: promotion.imageCode,
            startDate: promotion.startDate,
            endDate: promotion.endDate,
            startTime: promotion.startTime,
            endTime: promotion.endTime,
            imageUrl: promotion.imageUrl
        }

        isModalOpen.value = true
    }
    //상세보기창
    const isDetailModalOpen = ref(false)

    const selectedPromotion = ref({
        eventName: "",
        eventContent: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        imageUrl: ""
    })

    const openDetailModal = (promotion) => {

        selectedPromotion.value = {
            ...promotion,
            imageUrl: getImageUrl(promotion.imageCode)
        }

        console.log(selectedPromotion.value)

        isDetailModalOpen.value = true
    }

    const closeDetailModal = () => {
        isDetailModalOpen.value = false
    }

    const formatDateTime = (value) => {
        if (!value) 
            return "-"

        return value.replace("T", " ")
    }

    // 삭제
    const removePromotion = async (id) => {
        const ok = confirm("정말 삭제하시겠습니까?")

        if (!ok) 
            return

        try {
            await axios.delete(`/api/promotion/${id}`)

            alert("삭제되었습니다.")

            // 목록 새로고침
            await loadPromotion()

            if (currentPage.value > totalPages.value) {
                currentPage.value = Math.max(1, totalPages.value)
            }

            // 또는 아래처럼 바로 화면에서 제거할 수도 있습니다. promotions.value = promotions.value.filter(p =>
            // p.id !== id)

        } catch (error) {
            console.log(error)
            alert("삭제 실패")
        }
    }

    onMounted(loadPromotion)
</script>
<style scoped="scoped">
    /* 이벤트 관리 전용 스타일 스펙 */
    .menu-management-container {
        padding: 20px;
    }
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    .subtitle {
        font-size: 14px;
        color: #64748b;
        margin-top: 4px;
    }
    .table-wrapper {
        background: white;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        padding: 16px;
        overflow-x: auto;
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }
    th {
        background: #f8fafc;
        padding: 12px;
        font-size: 13px;
        color: #64748b;
        text-align: left;
        border-bottom: 1px solid #edf2f7;
    }
    td {
        padding: 14px 12px;
        font-size: 14px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
    }
    .event-name {
        display: inline-block;
        max-width: 100px;
        /* 원하는 너비 */
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .btn-group {
        display: flex;
        gap: 6px;
    }
    .btn-edit {
        background: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
    }
    .btn-delete {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
    }
    .btn-primary {
        background: #6f42c1;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
    }
    .btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
    }

    /* 모달 레이아웃 */
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
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
    .form-group select,
    .form-group textarea {
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

    /* 하단 페이지네이션 구조 */
    .pagination-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px solid #f1f5f9;
    }
    .pagination-info {
        font-size: 13px;
        color: #64748b;
    }
    .pagination-pages {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .btn-page {
        background: white;
        border: 1px solid #e2e8f0;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 500;
        color: #475569;
    }
    .btn-page.active {
        background: #6f42c1;
        color: white;
        border-color: #6f42c1;
    }
    .btn-page-nav:disabled,
    .btn-page:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .btn-page-nav {
        background: white;
        border: 1px solid #e2e8f0;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: #64748b;
    }
    .btn-detail {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
    }

    .form-group p {
        margin: 0;
        padding: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        min-height: 20px;
        white-space: pre-wrap;
    }
    .form-group textarea {
        min-height: 100px;
        resize: vertical;
    }
    .text-center {
        text-align: center;
    }
    .py-5 {
        padding-top: 3rem;
        padding-bottom: 3rem;
    }
    .text-muted {
        color: #94a3b8;
    }

    .image-select-list {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .image-item {
        width: 100px;
        cursor: pointer;
        border: 1px solid #ddd;
        padding: 5px;
        border-radius: 8px;
    }

    .image-item img {
        width: 0;
        height: 0;
        object-fit: cover;
    }

    .image-item:hover {
        border: 2px solid #6f42c1;
    }
</style>