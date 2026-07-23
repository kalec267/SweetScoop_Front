```vue:src/views/Login.vue
<template>
  <div class="login-wrapper">
    <div class="login-card">
      <!-- 로고 헤더 -->
      <div class="login-header">
        <span class="logo-icecream">🍦</span>
        <h2>Sweet Scoop</h2>
        <p class="subtitle">통합 관리 시스템 로그인</p>
      </div>

      <!-- 로그인 폼 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- 역할 선택 탭 -->
        <div class="role-selector">
          <button 
            type="button" 
            :class="{ active: loginForm.role === 'HQ' }" 
            @click="loginForm.role = 'HQ'"
          >
            본사 관리자
          </button>
          <button 
            type="button" 
            :class="{ active: loginForm.role === 'BRANCH' }" 
            @click="loginForm.role = 'BRANCH'"
          >
            분점 관리자
          </button>
        </div>

        <div class="form-group">
          <label for="username">아이디</label>
          <input 
            type="text" 
            id="username" 
            v-model="loginForm.username" 
            placeholder="아이디를 입력하세요" 
            required
          />
        </div>

        <div class="form-group">
          <label for="password">비밀번호</label>
          <input 
            type="password" 
            id="password" 
            v-model="loginForm.password" 
            placeholder="비밀번호를 입력하세요" 
            required
          />
        </div>

        <button type="submit" class="btn-login">로그인</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../api/index.js';

const router = useRouter();

const loginForm = ref({
  role: 'HQ',
  username: '',
  password: ''
});


const handleLogin = async () => {

  try {

    const res = await axios.post(
      'http://localhost:8888/api/auth/login',
      loginForm.value
    );


    const {
      id,
      role,
      username,
      name,
      branchId
    } = res.data;


    alert(`${name}님, 로그인을 환영합니다!`);


    // 공통 저장
    localStorage.setItem(
      "userRole",
      role
    );

    localStorage.setItem(
      "username",
      username
    );


    // 본사 관리자
    if(role === "HQ") {

      localStorage.setItem(
        "hqManagerId",
        id
      );

    }


    // 지점 관리자
    if(role === "BRANCH") {

      localStorage.setItem(
        "managerId",
        id
      );


      localStorage.setItem(
        "branchId",
        String(branchId)
      );

    }


    console.log("로그인 응답", res.data);


    if(role === "HQ") {

      router.push('/dashboard');

    } 
    else if(role === "BRANCH") {

      router.push('/branch/dashboard');

    }


  } catch(error) {

    console.error(error);

    if(error.response && error.response.status === 401) {

      alert(error.response.data);

    } else {

      alert(
        "서버 연결 실패 또는 등록되지 않은 계정 정보입니다."
      );

    }

  }

};

</script>

<style scoped>
.login-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fdf2f8 0%, #f1f5f9 100%);
  font-family: 'Inter', sans-serif;
}
.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
}
.login-header {
  text-align: center;
  margin-bottom: 30px;
}
.logo-icecream {
  font-size: 40px;
}
.login-header h2 {
  font-size: 24px;
  font-weight: 800;
  color: #d13b7d; 
  margin: 10px 0 4px 0;
}
.subtitle {
  font-size: 14px;
  color: #64748b;
}
.role-selector {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
  margin-bottom: 24px;
}
.role-selector button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}
.role-selector button.active {
  background: white;
  color: #d13b7d;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
}
.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
.form-group input {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.form-group input:focus {
  border-color: #d13b7d;
}
.btn-login {
  width: 100%;
  background: #d13b7d;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;
}
.btn-login:hover {
  background: #b52a65;
}
</style>