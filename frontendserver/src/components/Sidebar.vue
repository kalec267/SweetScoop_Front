<template>
    <aside class="sidebar">
      <!-- 상단 브랜드 영역 -->
      <div class="brand-header">
        <span class="brand-icon">🍦</span>
        <h1 class="brand-title">베스킨라빈스 관리자</h1>
      </div>
  
      <!-- 메뉴 리스트 -->
      <nav class="menu-list">
        <p class="menu-category">일반 관리</p>
        <router-link to="/dashboard" class="menu-item" active-class="active">
          <span class="menu-icon">📊</span> 대시보드
        </router-link>
        <router-link to="/order-request" class="menu-item" active-class="active">
          <span class="menu-icon">📝</span> 재고 신청 <span class="badge-count">18</span>
        </router-link>
        <router-link to="/inventory" class="menu-item" active-class="active">
          <span class="menu-icon">📦</span> 재고 현황
        </router-link>
        <router-link to="/delivery" class="menu-item" active-class="active">
          <span class="menu-icon">🚚</span> 배송 관리
        </router-link>
        <router-link to="/branch" class="menu-item" active-class="active">
          <span class="menu-icon">🏪</span> 분점 관리
        </router-link>
  
        <p class="menu-category">본사 전용 설정</p>
        <!-- 덧붙인 핵심 기능 1: 맛 관리 -->
        <router-link to="/menu-management" class="menu-item" active-class="active">
          <span class="menu-icon">🍒</span> 맛 관리 (메뉴)
        </router-link>
        <!-- 덧붙인 핵심 기능 2: 이벤트/배너 관리 -->
        <router-link to="/event-management" class="menu-item" active-class="active">
          <span class="menu-icon">🎁</span> 이벤트 / 배너 관리
        </router-link>
  
        <p class="menu-category">분석</p>
        <router-link to="/analytics" class="menu-item" active-class="active">
          <span class="menu-icon">📈</span> 통계 / 리포트
        </router-link>
      </nav>
  
      <!-- 하단 설정 및 프로필 영역 -->
      <div class="sidebar-footer">
        <div class="menu-item setting-btn">
          <span class="menu-icon">⚙️</span> 설정
        </div>
        <div class="user-profile">
          <div class="avatar">관</div>
          <div class="user-info">
            <p class="username">관리자</p>
            <p class="role">본점 · 슈퍼관리자</p>
          </div>
        </div>
      </div>
    </aside>
  </template>
  
  <style scoped>
  .sidebar {
    width: 260px;
    height: 100vh;
    background: linear-gradient(135deg, #FF4081 0%, #6f42c1 100%);
    color: white;
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    box-sizing: border-box;
    position: fixed;
    left: 0;
    top: 0;
  }
  .brand-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 40px;
    padding-left: 8px;
  }
  .brand-title {
    font-size: 18px;
    font-weight: 700;
  }
  .menu-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-grow: 1;
  }
  .menu-category {
    font-size: 12px;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 8px;
    padding-left: 12px;
  }
  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }
  .menu-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  .menu-item.active {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-weight: 600;
  }
  .badge-count {
    background: #ffc107;
    color: #212529;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: auto;
  }
  .sidebar-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 16px;
  }
  .user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin-top: 10px;
  }
  .avatar {
    background: white;
    color: #6f42c1;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
  .username {
    font-size: 14px;
    font-weight: 600;
  }
  .role {
    font-size: 11px;
    opacity: 0.7;
  }
  </style>