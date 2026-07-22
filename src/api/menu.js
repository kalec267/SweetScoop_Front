import api from './index';

// 본사 메뉴 조회
export const getAdminMenus = () => api.get('/api/admin/menus').then(res => res.data);

// 본사 메뉴 등록
export const createAdminMenu = (menuData) => api.post('/api/admin/menus', menuData).then(res => res.data);

// 본사 메뉴 수정
export const updateAdminMenu = (id, menuData) => api.put(`/api/admin/menus/${id}`, menuData).then(res => res.data);

// 💡 본사 메뉴 가격 수정 (앞에 /api/admin 명시)
export const updateSizePrice = (menuId, data) => api.patch(`/api/admin/menus/${menuId}/price`, data).then(res => res.data);

// 본사 메뉴 삭제
export const deleteAdminMenu = (id) => api.delete(`/api/admin/menus/${id}`).then(res => res.data);