<template>
  <div class="login-wrapper">
    <div class="login-card">
      <!-- 로고 헤더 -->
      <div class="login-header">
        <span class="logo-icecream">🍦</span>
        <h2>Sweet Scoop</h2>
        <p class="subtitle">통합 관리 시스템</p>
      </div>

      <!-- 상단 탭 (로그인 / 회원가입 전환) -->
      <div class="mode-selector">
        <button 
          type="button" 
          :class="{ active: currentMode === 'LOGIN' }" 
          @click="currentMode = 'LOGIN'"
        >
          로그인
        </button>
        <button 
          type="button" 
          :class="{ active: currentMode === 'REGISTER' }" 
          @click="currentMode = 'REGISTER'"
        >
          분점 등록 신청
        </button>
      </div>

      <!-- ==========================================
           [CASE 1] 로그인 폼 영역
           ========================================== -->
      <form v-if="currentMode === 'LOGIN'" @submit.prevent="handleLogin" class="auth-form">
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

        <button type="submit" class="btn-submit">로그인</button>
      </form>

      <!-- ==========================================
           [CASE 2] 회원가입 폼 영역
           ========================================== -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <!-- 1. 로그인 아이디 -->
        <div class="form-group">
          <label for="reg-login-id">아이디</label>
          <input 
            id="reg-login-id"
            v-model="registerForm.loginId" 
            type="text" 
            placeholder="사용할 아이디 입력" 
            required 
          />
        </div>

        <!-- 2. 비밀번호 -->
        <div class="form-group">
          <label for="reg-password">비밀번호</label>
          <input 
            id="reg-password"
            v-model="registerForm.password" 
            type="password" 
            placeholder="비밀번호 입력" 
            required 
          />
        </div>

        <!-- 3. 관리자 이름 -->
        <div class="form-group">
          <label for="reg-name">이름 (점주명)</label>
          <input 
            id="reg-name"
            v-model="registerForm.name" 
            type="text" 
            placeholder="실명 입력" 
            required 
          />
        </div>

        <!-- 4. 소속 분점 ID -->
        <div class="form-group">
          <label for="reg-branch-id">소속 분점 번호 (숫자)</label>
          <input 
            id="reg-branch-id"
            v-model="registerForm.branchId" 
            type="number" 
            placeholder="지점 코드 숫자 입력 (예: 1)" 
          />
        </div>

        <button type="submit" class="btn-submit">가입 신청하기</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../api/index.js'; 

const router = useRouter();

const currentMode = ref('LOGIN');

const registerForm = ref({
  loginId: '',
  password: '',
  name: '',
  branchId: null
});

const loginForm = ref({
  role: 'HQ', 
  username: '',
  password: ''
});

const errorMessage = ref('');

const handleRegister = async () => {
  try {
    errorMessage.value = '';
    
    if (!registerForm.value.loginId || !registerForm.value.password || !registerForm.value.name) {
      alert('모든 필수 항목을 입력해 주세요.');
      return;
    }

    const response = await axios.post('admin/auth/register', {
      loginId: registerForm.value.loginId,
      password: registerForm.value.password,
      name: registerForm.value.name,
      branchId: registerForm.value.branchId ? Number(registerForm.value.branchId) : null
    });

    if (response.status === 200) {
      alert('회원가입이 성공적으로 완료되었습니다! 로그인해 주세요.');
      registerForm.value = { loginId: '', password: '', name: '', branchId: null };
      currentMode.value = 'LOGIN'; 
    }
  } catch (error) {
    console.error('회원가입 에러:', error);
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || error.response.data;
      alert(errorMessage.value);
    } else {
      alert('회원가입 중 오류가 발생했거나 이미 존재하는 아이디입니다.');
    }
  }
};

const handleLogin = async () => {
  try {
    const res = await axios.post('admin/auth/login', loginForm.value);
    const { role, username, name, branchId } = res.data;

    alert(`${name}님, 로그인을 환영합니다!`);
    
    localStorage.clear();
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', username);
    
    if (branchId) {
      localStorage.setItem('branchId', String(branchId));
    }

    if (role === 'HQ') {
      router.push('/dashboard'); 
    } else if (role === 'BRANCH') {
      router.push('/branch/dashboard'); 
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      alert(error.response.data);
    } else {
      alert("서버 연결 실패 또는 등록되지 않은 계정 정보입니다.");
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
  box-sizing: border-box;
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
  margin-bottom: 20px;
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

/* 상단 메인 변환 탭 */
.mode-selector {
  display: flex;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 24px;
}

.mode-selector button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-selector button.active {
  color: #d13b7d;
  border-bottom: 2px solid #d13b7d;
  margin-bottom: -2px;
}

/* 세로 정렬 폼 바디 수립 */
.auth-form {
  display: flex;
  flex-direction: column;
  width: 100%;
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

/* 폼 그룹 및 인풋창 너비 최적화 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
  width: 100%;
  box-sizing: border-box;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-align: left;
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background-color: #ffffff; /* 💡 시인성 확보를 위해 밝은 배경으로 리셋 */
  color: #1e293b;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus { 
  border-color: #d13b7d; 
}

/* 가입신청/로그인 통합 버튼 스타일 */
.btn-submit {
  width: 100%;
  background: #d13b7d;
  color: white;
  border: none;
  padding: 13px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  box-sizing: border-box;
  transition: background 0.2s;
}

.btn-submit:hover { 
  background: #b52a65; 
}
</style>