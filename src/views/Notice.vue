<template>
    <div class="menu-management-container">
        <div class="page-header">
            <div>
                <h2>공지사항</h2>
                <p class="subtitle">
                    공지사항 입니다
                </p>
            </div>

            <button class="btn-primary" @click="openCreateModal" v-if="userRole === 'HQ'">
                ＋ 등록
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>작성자</th>
                        <th>제목</th>
                        <th>작성 시간</th>
                        <th>관리</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="notice in paginatedNotice" :key="notice.id">
                        <!-- ID -->
                        <td>
                            {{ notice.id }}
                        </td>

                        <!-- 작성자 -->
                        <td>
                            {{ notice.hqManagerName ?? "-" }}
                        </td>

                        <!-- 제목 -->
                        <td>
                            <span class="notice-name">
                                {{ notice.title }}
                            </span>
                        </td>

                        <!-- 작성 시간 -->
                        <td>
                            {{ formatDate(notice.createdAt) }}
                        </td>

                        <!-- 관리 -->
                        <td>
                            <div class="btn-group">
                                <button class="btn-detail" @click="openDetailModal(notice)">
                                    상세보기
                                </button>

                                <button
                                    v-if="userRole === 'HQ'"
                                    class="btn-edit"
                                    @click="openEditModal(notice)">
                                    수정
                                </button>

                                <button
                                    v-if="userRole === 'HQ'"
                                    class="btn-delete"
                                    @click="removeNotice(notice.id)">
                                    삭제
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="pagination-container" v-if="noticeList.length > 0">
            <div class="pagination-info">
                전체
                {{ noticeList.length }}개 항목 중
                {{ (currentPage-1)*itemsPerPage+1 }}
                -
                {{ Math.min(currentPage*itemsPerPage,noticeList.length) }}
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
                <h3>{{ isEditMode ? '수정' : '등록' }}</h3>

                <div class="form-group">
                    <label>제목</label>
                    <input type="text" v-model="noticeForm.title"/>
                </div>

                <div class="form-group">
                    <label>내용</label>
                    <textarea v-model="noticeForm.content"></textarea>
                </div>

                <div class="modal-actions">
                    <button class="btn-secondary" @click="closeModal">
                        취소
                    </button>

                    <button class="btn-primary" @click="submitNotice">
                        저장
                    </button>
                </div>
            </div>
        </div>
        <div v-if="isDetailModalOpen" class="modal-overlay">
            <div class="modal-content">
                <h3>상세보기</h3>

                <div class="form-group">
                    <label>제목</label>
                    <p>{{selectedNotice.title}}</p>
                </div>

                <div class="form-group">
                    <label>내용</label>
                    <p>{{selectedNotice.content}}</p>
                </div>

                <div class="form-group">
                    <label>작성 시간</label>
                    <p>{{formatDate(selectedNotice.createdAt)}}</p>
                </div>

                <div class="form-group">
                    <label>수정 시간</label>
                    <p>
                        {{ selectedNotice.updateAt 
            ? formatDate(selectedNotice.updateAt) 
            : '-' 
        }}
                    </p>
                </div>

                <div class="form-group">
                    <label>작성자</label>
                    <p>notice.title</p>
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

    const userRole = localStorage.getItem("userRole");
    const username = localStorage.getItem("username");

    const currentPage = ref(1)
    const itemsPerPage = 5

    const isModalOpen = ref(false)
    const isEditMode = ref(false)

    //등록값
    const createNoticeForm = () => (
        {title: "", content: "", hqManagerId: username}
    );

    const noticeForm = ref(createNoticeForm());

    const selectedNoticeId = ref(null)

    //버튼 클릭 시
    const submitNotice = async () => {

        if (isEditMode.value) {

            await axios.put(`/api/notice/${selectedNoticeId.value}`, noticeForm.value)

        } else {

            await axios.post("/api/notice", noticeForm.value)
        }

        await loadNotice()

        noticeForm.value = createNoticeForm();

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

    const paginatedNotice = computed(() => {

        const start = (currentPage.value - 1) * itemsPerPage

        return noticeList
            .value
            .slice(start, start + itemsPerPage)

    })

    const totalPages = computed(
        () => Math.max(1, Math.ceil(noticeList.value.length / itemsPerPage))
    )

    const setPage = (page) => {
        if (page < 1 || page > totalPages.value) 
            return
        currentPage.value = page
    }

    const noticeList = ref([])

    const loadNotice = async () => {

        const res = await axios.get("/api/notice")

        noticeList.value = res.data
    }

    //등록창
    const openCreateModal = () => {
        isEditMode.value = false

        noticeForm.value = {
            title: "",
            content: "",
            hqManagerId: username
        }

        isModalOpen.value = true
    }
    //수정창
    const openEditModal = (notice) => {

        isEditMode.value = true

        selectedNoticeId.value = notice.id

        noticeForm.value = {
            title: notice.title,
            content: notice.content,
            hqManagerId: username
        }

        isModalOpen.value = true
    }
    //상세보기창
    const isDetailModalOpen = ref(false)

    const selectedNotice = ref(
        {title: "", content: "", createdAt: "", updateAt: "", hqManagerName: ""}
    )
    const openDetailModal = (notice) => {

        selectedNotice.value = {
            ...notice
        }

        isDetailModalOpen.value = true
    }

    const closeDetailModal = () => {
        isDetailModalOpen.value = false
    }
    // 삭제
    const removeNotice = async (id) => {

        if (!confirm("정말 삭제하시겠습니까?")) 
            return

        await axios.delete(`/api/notice/${id}`)

        await loadNotice()
    }

    const formatDate = (date) => {
        return date
            ? date.replace("T", " ")
            : "-"
    }

    onMounted(loadNotice)
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
    .notice-name {
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
</style>