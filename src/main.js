import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'  // 引入中文语言包
import './styles/theme.css'



const app = createApp(App)
app.use(store)
app.use(router)
app.use(ElementPlus, { locale: zhCn })  // 设置为中文
app.mount('#app')