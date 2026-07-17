<template>
    <div class="branch-container">
      <h2>분점 및 기기(키오스크) 관리</h2>
  
      <div class="branch-grid">
        <div v-for="branch in branches" :key="branch.id" class="branch-card">
          <div class="branch-card-header">
            <h3>{{ branch.name }}</h3>
            <span class="branch-loc">{{ branch.location }}</span>
          </div>
          
          <div class="branch-info-body">
            <p><strong>담당 점주 ID:</strong> {{ branch.managerId }}</p>
            <div class="kiosk-status-section">
              <h4>운영 중인 키오스크</h4>
              <div class="kiosk-tags">
                <span 
                  v-for="kiosk in branch.kiosks" 
                  :key="kiosk.id" 
                  class="kiosk-tag"
                  :class="kiosk.status === '정상' ? 'k-normal' : 'k-error'"
                >
                  🖥️ {{ kiosk.id }}번기 ({{ kiosk.status }})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  // 초기 Mock 데이터 구성 (추후 API 엔드포인트 연동)
  const branches = ref([
    {
      id: 1,
      name: "스윗스쿱 강남역점",
      location: "서울시 강남구 테헤란로 1",
      managerId: "gangnam_mgr",
      kiosks: [{ id: 1, status: "정상" }, { id: 2, status: "정상" }]
    },
    {
      id: 2,
      name: "스윗스쿱 홍대점",
      location: "서울시 마포구 홍익로 10",
      managerId: "hongdae_mgr",
      kiosks: [{ id: 3, status: "정상" }]
    }
  ]);
  </script>