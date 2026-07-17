import api from './index';

// 실시간 지점 원자재 재고 조회 (기존 유지)
export const getBranchInventory = (branchId) => api.get(`/branches/${branchId}/inventory`).then(res => res.data);

// 분점 전체 리스트 조회
export const getAdminBranches = () => api.get('/branches').then(res => res.data);

// 신규 분점 등록
export const createAdminBranch = (branchData) => api.post('/branches', branchData).then(res => res.data);

// 분점 정보 수정
export const updateAdminBranch = (id, branchData) => api.put(`/branches/${id}`, branchData).then(res => res.data);

// 분점 영업 상태 관리
export const updateBranchOperationStatus = (id, status) => api.patch(`/branches/${id}/status?status=${status}`).then(res => res.data);

// 분점 데이터 삭제
export const deleteAdminBranch = (id) => api.delete(`/branches/${id}`).then(res => res.data);