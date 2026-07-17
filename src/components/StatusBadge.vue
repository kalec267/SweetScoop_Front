<template>
    <span class="status-badge" :class="badgeClass">
      {{ status }}
    </span>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    status: { type: String, required: true }
  });
  
  const badgeClass = computed(() => {
    switch (props.status) {
      case '대기 중': case '대기중': return 'waiting';
      case '배송 중': case '배송중': return 'shipping';
      case '완료': case '승인완료': return 'success';
      case '반려': return 'rejected';
      default: return 'default';
    }
  });
  </script>
  
  <style scoped>
  .status-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  .waiting { background-color: #fffbeb; color: #d97706; }
  .shipping { background-color: #eff6ff; color: #2563eb; }
  .success { background-color: #ecfdf5; color: #059669; }
  .rejected { background-color: #fef2f2; color: #dc2626; }
  .default { background-color: #f1f5f9; color: #475569; }
  </style>