<template>
  <div class="login">
    <div class="card panel">
      <div class="header">
        <div class="brand">
          <div class="logo">TP</div>
          <div>
            <div class="title">测试平台</div>
            <div class="subtitle">统一管理接口、用例与流程</div>
          </div>
        </div>
        <div class="mode">
          <button :class="['mode-btn', { active: !isRegister }]" @click="setMode(false)">登录</button>
          <button :class="['mode-btn', { active: isRegister }]" @click="setMode(true)">注册</button>
        </div>
      </div>

      <div class="panel-body">
        <el-form @submit.prevent>
          <div class="advanced">
            <el-form-item label="Base URL">
              <el-input
                v-model="baseUrl"
                placeholder="留空使用 /api 代理（推荐）"
                clearable
                @input="handleBaseUrlChange"
                @clear="handleBaseUrlChange"
              />
            </el-form-item>
            <div class="hint">开发环境建议留空，自动走 /api 代理</div>
          </div>

          <el-form-item label="账号">
            <el-input v-model="username" autocomplete="username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="password" type="password" show-password autocomplete="current-password" />
          </el-form-item>
          <el-form-item v-if="isRegister" label="确认密码">
            <el-input v-model="confirmPassword" type="password" show-password autocomplete="new-password" />
          </el-form-item>

          <el-form-item label="验证码" v-if="!isRegister">
            <div class="captcha">
              <el-input v-model="captchaInput" placeholder="输入验证码" />
              <div class="captcha-box" @click="refreshCaptcha" :title="captchaHint">
                <span class="code">{{ captchaText || '点击获取' }}</span>
                <span class="count" v-if="captchaCountdown > 0">{{ captchaCountdown }}s</span>
              </div>
            </div>
          </el-form-item>

          <div class="row">
            <el-checkbox v-model="remember">记住账号</el-checkbox>
            <el-button text @click="forgotVisible = true">忘记密码？</el-button>
          </div>

          <div class="actions">
            <el-button type="primary" @click="isRegister ? doRegister() : doLogin()" :loading="loading">
              {{ isRegister ? '注册并登录' : '登录' }}
            </el-button>
            <el-button text @click="toggleMode">{{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}</el-button>
          </div>

          <div v-if="error" class="error">{{ error }}</div>
        </el-form>
      </div>
    </div>
  </div>

  <el-dialog v-model="forgotVisible" title="忘记密码" width="420px">
    <div class="forgot">
      请联系管理员重置密码，或在用户管理中由管理员为你修改密码。
    </div>
    <template #footer>
      <el-button type="primary" @click="forgotVisible = false">知道了</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { login, register, getCaptcha } from '../api'

export default {
  name: 'Login',
  data() {
    const savedUser = localStorage.getItem('remember_username') || ''
    return {
      baseUrl: this.$store.state.baseUrl,
      username: savedUser,
      password: '',
      confirmPassword: '',
      isRegister: false,
      loading: false,
      error: '',
      remember: !!savedUser,
      captchaText: '',
      captchaId: '',
      captchaInput: '',
      captchaCountdown: 0,
      captchaTimer: null,
      forgotVisible: false
    }
  },
  computed: {
    captchaHint() {
      return this.captchaCountdown > 0 ? '点击刷新验证码' : '点击获取验证码'
    }
  },
  beforeUnmount() {
    if (this.captchaTimer) clearInterval(this.captchaTimer)
  },
  methods: {
    handleBaseUrlChange() {
      this.$store.commit('setBaseUrl', this.baseUrl || '')
    },
    setMode(val) {
      this.isRegister = val
      this.error = ''
    },
    toggleMode() {
      this.isRegister = !this.isRegister
      this.error = ''
    },
    async refreshCaptcha() {
      try {
        const res = await getCaptcha()
        this.captchaText = res.data.code
        this.captchaId = res.data.captcha_id
        this.captchaCountdown = res.data.expires_in || 60
        if (this.captchaTimer) clearInterval(this.captchaTimer)
        this.captchaTimer = setInterval(() => {
          this.captchaCountdown -= 1
          if (this.captchaCountdown <= 0) {
            clearInterval(this.captchaTimer)
            this.captchaTimer = null
          }
        }, 1000)
      } catch (e) {
        this.captchaText = ''
        this.captchaId = ''
        this.captchaCountdown = 0
      }
    },
    handleRemember() {
      if (this.remember && this.username) {
        localStorage.setItem('remember_username', this.username)
      } else {
        localStorage.removeItem('remember_username')
      }
    },
    async doLogin() {
      this.loading = true
      this.error = ''
      this.$store.commit('setBaseUrl', this.baseUrl)
      if (!this.captchaId || !this.captchaInput) {
        await this.refreshCaptcha()
        this.error = '请先获取并输入验证码'
        this.loading = false
        return
      }
      try {
        const res = await login({
          username: this.username,
          password: this.password,
          captcha_id: this.captchaId,
          captcha: this.captchaInput
        })
        this.$store.commit('setToken', res.data.token)
        this.$store.commit('setUser', { id: res.data.user_id, permissions: res.data.permissions, username: this.username })
        this.handleRemember()
        this.$router.push('/')
      } catch (e) {
        this.error = e.response?.data?.error || e.message
        this.captchaInput = ''
      } finally {
        this.loading = false
      }
    },
    async doRegister() {
      this.loading = true
      this.error = ''
      if (!this.username || !this.password) {
        this.error = '请输入账号和密码'
        this.loading = false
        return
      }
      if (this.password !== this.confirmPassword) {
        this.error = '两次密码不一致'
        this.loading = false
        return
      }
      this.$store.commit('setBaseUrl', this.baseUrl)
      try {
        const res = await register({
          username: this.username,
          password: this.password
        })
        if (res?.data?.token) {
          this.$store.commit('setToken', res.data.token)
          this.$store.commit('setUser', { id: res.data.user_id, permissions: res.data.permissions, username: this.username })
          this.handleRemember()
          this.$router.push('/')
        } else {
          this.isRegister = false
          this.confirmPassword = ''
          this.$message.success('注册成功，请登录')
        }
      } catch (e) {
        this.error = e.response?.data?.error || e.message
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.card {
  width: 480px;
}

.header {
  padding: 18px 18px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
}

.title {
  font-size: 18px;
  font-weight: 700;
}

.subtitle {
  color: var(--muted);
  font-size: 12px;
}

.mode {
  display: inline-flex;
  gap: 6px;
  background: var(--panel-2);
  padding: 4px;
  border-radius: 10px;
  width: fit-content;
}

.mode-btn {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--muted);
}

.mode-btn.active {
  background: var(--panel);
  color: var(--text);
  box-shadow: var(--shadow);
}

.advanced {
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px 2px;
  margin-bottom: 10px;
}

.captcha {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 10px;
  align-items: center;
}

.captcha-box {
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  background: var(--panel-2);
  letter-spacing: 2px;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  position: relative;
  overflow: hidden;
}

.captcha-box .count {
  position: absolute;
  right: 6px;
  bottom: 2px;
  font-size: 10px;
  color: var(--muted);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -2px;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 6px;
}

.error {
  margin-top: 10px;
  color: var(--accent);
}

.hint {
  margin: -6px 0 10px;
  color: var(--muted);
  font-size: 12px;
}

.forgot {
  color: var(--muted);
}

@media (max-width: 560px) {
  .card {
    width: 100%;
  }
}
</style>
