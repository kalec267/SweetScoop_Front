import api from './index';

// 본사 메뉴 조회
export const getAdminMenus = () => api.get('/menus').then(res => res.data);

// 본사 메뉴 등록
export const createAdminMenu = (menuData) => api.post('/menus', menuData).then(res => res.data);

// 본사 메뉴 수정
export const updateAdminMenu = (id, menuData) => api.put(`/menus/${id}`, menuData).then(res => res.data);

// 본사 메뉴 가격 수정
export const updateSizePrice = (sizeId, priceData) => api.patch(`/menus/sizes/${sizeId}/price`, priceData).then(res => res.data);

// 본사 메뉴 삭제
export const deleteAdminMenu = (id) => api.delete(`/menus/${id}`).then(res => res.data);