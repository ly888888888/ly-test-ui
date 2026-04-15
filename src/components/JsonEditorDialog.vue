<template>
  <el-dialog :model-value="modelValue" :title="title" width="70%" @close="close">
    <el-input
      v-model="local"
      type="textarea"
      :rows="18"
      class="mono"
    />
    <div class="tpl" v-if="showTemplateInsert">
      <div class="tpl-title">参数模板引用（type=template，使用模板名称）</div>
      <div class="tpl-grid">
        <div class="tpl-item">
          <div class="tpl-label">参数名</div>
          <el-input v-model="tplKey" placeholder="如 user_id" size="small" />
        </div>
        <div class="tpl-item">
          <div class="tpl-label">模板</div>
          <el-select v-model="tplName" placeholder="选择模板" size="small">
            <el-option v-for="t in templatesLocal" :key="t.id" :label="`${t.name} (${t.type})`" :value="t.name" />
          </el-select>
        </div>
        <div class="tpl-item" v-if="showStepSelect && stepOptions.length">
          <div class="tpl-label">步骤</div>
          <el-select v-model="stepIndex" size="small">
            <el-option v-for="opt in stepOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div class="tpl-item tpl-action">
          <div class="tpl-label">&nbsp;</div>
          <el-button size="small" type="primary" @click="insertTemplate">插入引用</el-button>
        </div>
      </div>
      <div class="tpl-hint">会在当前 JSON 中插入：{"param":{"type":"template","name":"tpl_name"}}</div>
    </div>
    <div class="help-row" v-if="showHelp">
      <el-button size="small" @click="openHelp">格式示例</el-button>
    </div>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确认</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="helpVisible" title="JSON 格式示例" width="60%">
    <pre class="mono help-pre">{{ helpContent }}</pre>
    <template #footer>
      <el-button @click="copyHelp">一键复制</el-button>
      <el-button type="primary" @click="helpVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { listParamTemplates } from '../api'

export default {
  name: 'JsonEditorDialog',
  props: {
    modelValue: Boolean,
    title: String,
    jsonText: String,
    templates: { type: Array, default: null },
    showTemplateInsert: { type: Boolean, default: true },
    showStepSelect: { type: Boolean, default: false },
    showHelp: { type: Boolean, default: true },
    helpContent: { type: String, default: '' }
  },
  data() {
    return {
      local: this.jsonText || '',
      templatesLocal: [],
      tplKey: '',
      tplName: '',
      helpVisible: false,
      stepIndex: 0
    }
  },
  computed: {
    stepOptions() {
      try {
        const obj = JSON.parse(this.local || '{}')
        if (!obj || !Array.isArray(obj.steps)) return []
        return obj.steps.map((s, idx) => ({
          value: idx,
          label: `步骤 ${idx + 1}${s?.name ? `（${s.name}）` : ''}`
        }))
      } catch (e) {
        return []
      }
    }
  },
  watch: {
    jsonText(val) { this.local = val || '' },
    modelValue(val) {
      if (val) {
        this.tplKey = ''
        this.tplName = ''
        this.stepIndex = 0
      }
    },
    templates: {
      immediate: true,
      handler(val) {
        if (Array.isArray(val)) this.templatesLocal = val
      }
    }
  },
  mounted() {
    if (!Array.isArray(this.templates)) {
      this.loadTemplates()
    }
  },
  methods: {
    async loadTemplates() {
      try {
        const res = await listParamTemplates()
        this.templatesLocal = res.data || []
      } catch (e) {
        // ignore if no permission
      }
    },
    insertTemplate() {
      if (!this.tplKey || !this.tplName) {
        this.$message.error('请输入参数名并选择模板')
        return false
      }
      let obj
      try {
        obj = JSON.parse(this.local || '{}')
      } catch (e) {
        this.$message.error('JSON 格式错误，无法插入')
        return false
      }
      if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
        this.$message.error('当前内容不是 JSON 对象')
        return false
      }

      const refObj = { type: 'template', name: this.tplName }
      let insertedPath = ''

      if (this.showStepSelect && Array.isArray(obj.steps) && obj.steps.length > 0) {
        const idx = Math.min(Math.max(this.stepIndex || 0, 0), obj.steps.length - 1)
        if (!obj.steps[idx].params || typeof obj.steps[idx].params !== 'object') {
          obj.steps[idx].params = {}
        }
        obj.steps[idx].params[this.tplKey] = refObj
        insertedPath = `steps[${idx}].params`
      } else if (obj.params && typeof obj.params === 'object' && !Array.isArray(obj.params)) {
        obj.params[this.tplKey] = refObj
        insertedPath = 'params'
      } else {
        obj[this.tplKey] = refObj
        insertedPath = 'root'
      }

      this.local = JSON.stringify(obj, null, 2)
      this.$message.success(`已插入到 ${insertedPath}`)
      return true
    },
    openHelp() {
      this.helpVisible = true
    },
    async copyHelp() {
      try {
        await navigator.clipboard.writeText(this.helpContent || '')
        this.$message.success('已复制')
      } catch (e) {
        this.$message.error('复制失败')
      }
    },
    close() { this.$emit('update:modelValue', false) },
    confirm() {
      if (this.showTemplateInsert && this.tplKey && this.tplName) {
        this.insertTemplate()
      }
      this.$emit('confirm', this.local)
    }
  }
}
</script>

<style scoped>
.tpl {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px dashed var(--border);
  border-radius: 10px;
}

.tpl-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.tpl-grid {
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1fr auto;
  gap: 10px;
  align-items: end;
}

.tpl-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tpl-action {
  justify-self: end;
}

.tpl-label {
  font-size: 12px;
  color: var(--muted);
}

.tpl-hint {
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
}

.help-row {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.help-pre {
  max-height: 520px;
  overflow: auto;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
}

@media (max-width: 900px) {
  .tpl-grid {
    grid-template-columns: 1fr;
  }
  .tpl-action {
    justify-self: start;
  }
}
</style>
