=====================================================================================
- 데이터 흐름
Login.vue에서 보내는 값

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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

[Register]

front(Login.vue)에서 회원가입처리시 handleRegister() 실행 -> API요청 발송 POST /api/admin/auth/register (RegisterController)

RegisterController는 RegisterSaveDto클래스에서 DTO 수집 및 검증 -> RegisterService클래스의 로직 실행 하여 암호화및 DB저장 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

[login]

마찬가지로 front(Login.vue)에서 로그인시 handleLogin() 실행 -> API요청 발송 POST /api/admin/auth/login (LoginController)

LoginController는 LoginRequestDto 클래스에서 DTO 수집 및 검증 -> AuthService클래스의 로직 실행하여 로그인 처리

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


=====================================================================================


