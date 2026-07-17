import api from './index';

// 대시보드 상단 요약 정보 조회
export const getDashboardSummary = () => api.get('/dashboard/summary').then(res => res.data);

// 재고 신청 목록 조회
export const getInventoryRequests = () => api.get('/inventory/requests').then(res => res.data);

// 재고 신청 등록
export const createInventoryRequest = (data) => api.post('/inventory/requests', data).then(res => res.data);

// 재고 신청 승인/반려 처리
export const updateApprovalStatus = (id, statusData) => api.patch(`/inventory/requests/${id}/approval`, statusData).then(res => res.data);

// 배송 상태 변경
export const updateDeliveryStatus = (id, deliveryData) => api.patch(`/inventory/requests/${id}/delivery`, deliveryData).then(res => res.data);