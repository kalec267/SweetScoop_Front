<template>
    <header class="main-header">
      <div class="header-right">
        <button class="icon-btn">
          <span class="icon">🔔</span>
          <span class="badge-dot"></span>
        </button>
        <div class="profile-select">
          <div class="mini-avatar">관</div>
          <span class="name">관리자</span>
          <span class="arrow">▼</span>
        </div>
      </div>
    </header>
  </template>
  
  <style scoped>
  .main-header {
    height: 60px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0 30px;
    background: transparent;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .icon-btn {
    background: white;
    border: 1px solid #e2e8f0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
  }
  .badge-dot {
    width: 6px;
    height: 6px;
    background: #ff4081;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .profile-select {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border: 1px solid #e2e8f0;
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
  }
  .mini-avatar {
    width: 24px;
    height: 24px;
    background: #6f42c1;
    color: white;
    border-radius: 50%;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .name {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }
  .arrow {
    font-size: 10px;
    color: #94a3b8;
  }
  </style>