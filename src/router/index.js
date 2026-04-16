import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Interfaces from '../views/Interfaces.vue'
import Testcases from '../views/Testcases.vue'
import Flows from '../views/Flows.vue'
import Functions from '../views/Functions.vue'
import RunResults from '../views/RunResults.vue'
import SuiteRun from '../views/SuiteRun.vue'
import Users from '../views/Users.vue'
import NLInput from '../views/NLInput.vue'
import ParamTemplates from '../views/ParamTemplates.vue'
import Projects from '../views/Projects.vue'


const routes = [
  { path: '/login', name: 'login', component: Login, meta: { title: '登录' } },
  { path: '/', name: 'dashboard', component: Dashboard, meta: { title: '概览' } },
  { path: '/projects', name: 'projects', component: Projects, meta: { title: '项目管理' } },
  { path: '/interfaces', name: 'interfaces', component: Interfaces, meta: { title: '接口管理' } },
  { path: '/testcases', name: 'testcases', component: Testcases, meta: { title: '用例管理' } },
  { path: '/flows', name: 'flows', component: Flows, meta: { title: '流程管理' } },
  { path: '/functions', name: 'functions', component: Functions, meta: { title: '函数管理' } },
  { path: '/results', name: 'results', component: RunResults, meta: { title: '运行结果' } },
  { path: '/suite', name: 'suite', component: SuiteRun, meta: { title: '套件运行' } },
  { path: '/users', name: 'users', component: Users, meta: { title: '用户管理' } },
  { path: '/nl', name: 'nl', component: NLInput, meta: { title: '自然语言录入' } },
  { path: '/param-templates', name: 'param-templates', component: ParamTemplates, meta: { title: '参数模板' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `测试平台 | ${to.meta.title || '应用'}`
  if (to.path !== '/login' && !store.state.token) {
    return next('/login')
  }
  if (to.path === '/login' && store.state.token) {
    return next('/')
  }
  store.commit('addTab', { path: to.path, title: to.meta.title || to.name })
  next()
})

export default router
