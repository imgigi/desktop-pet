// Onboarding step-by-step guide

// 引导步骤定义
export type OnboardingStep =
  | 'welcome'         // 欢迎
  | 'create-hint'     // 引导创建宠物
  | 'pet-click'       // 点击宠物查看对话
  | 'pet-click-done'  // 点击后的说明
  | 'chat-input'      // 输入框发消息
  | 'state-select'    // 选择动作状态
  | 'pet-switch'      // 切换宠物
  | 'tray-hint'       // 托盘提示
  | 'done'

const STEP_KEY = 'desktop-pet-onboarding-step'

// 步骤内容
const STEPS: Record<Exclude<OnboardingStep, 'done'>, {
  title: string
  desc: string
  position: 'center' | 'top' | 'bottom' | 'above-pet' | 'below-input'
  buttonText: string
  emoji: string
}> = {
  'welcome': {
    title: '欢迎来到桌宠世界！',
    desc: '上传一张朋友的照片，把TA养成你桌面上的小伙伴',
    position: 'center',
    buttonText: '开始养宠物 →',
    emoji: '🎉',
  },
  'create-hint': {
    title: '选一张好玩的照片',
    desc: '点击上传区域或直接拖拽/粘贴图片，然后调整骨骼让TA动起来',
    position: 'top',
    buttonText: '知道了，我来上传',
    emoji: '📸',
  },
  'pet-click': {
    title: '你的宠物诞生了！',
    desc: '试试点击宠物，可以查看最近的对话记录',
    position: 'above-pet',
    buttonText: '我来试试 →',
    emoji: '🐾',
  },
  'pet-click-done': {
    title: '就是这样！',
    desc: '再次点击就能隐藏对话。新消息来了也会自动弹出气泡',
    position: 'above-pet',
    buttonText: '下一步 →',
    emoji: '👆',
  },
  'chat-input': {
    title: '跟TA说点什么',
    desc: '在输入框里打字，按回车发送。消息会发给你绑定的好友',
    position: 'below-input',
    buttonText: '下一步 →',
    emoji: '💬',
  },
  'state-select': {
    title: '让宠物表演动作',
    desc: '发消息前点击左侧的 ✦ 图标，选择一个动作，宠物会在对方的桌面上表演！',
    position: 'below-input',
    buttonText: '下一步 →',
    emoji: '✨',
  },
  'pet-switch': {
    title: '切换宠物',
    desc: '输入框右侧的 🔄 按钮可以快速切换不同的宠物',
    position: 'below-input',
    buttonText: '下一步 →',
    emoji: '🔄',
  },
  'tray-hint': {
    title: '管理面板在这里',
    desc: '看到屏幕顶部（Mac）或底部（Win）状态栏的桌宠图标了吗？点击它可以打开管理面板，绑定好友、修改宠物、调设置',
    position: 'above-pet',
    buttonText: '我学会了！',
    emoji: '⚙️',
  },
}

// 读取当前步骤
export function getOnboardingStep(): OnboardingStep {
  const saved = localStorage.getItem(STEP_KEY)
  if (saved && saved in STEPS) return saved as OnboardingStep
  if (saved === 'done') return 'done'
  return 'welcome'
}

// 保存步骤
export function setOnboardingStep(step: OnboardingStep) {
  localStorage.setItem(STEP_KEY, step)
}

// 跳过全部
export function skipOnboarding() {
  localStorage.setItem(STEP_KEY, 'done')
}

// 下一步映射
function nextStep(current: OnboardingStep, _hasPets: boolean, multiPets: boolean): OnboardingStep {
  switch (current) {
    case 'welcome': return 'create-hint'
    case 'create-hint': return 'done' // 创建完成后由外部触发 pet-click
    case 'pet-click': return 'pet-click-done'
    case 'pet-click-done': return 'chat-input'
    case 'chat-input': return 'state-select'
    case 'state-select': return multiPets ? 'pet-switch' : 'tray-hint'
    case 'pet-switch': return 'tray-hint'
    case 'tray-hint': return 'done'
    default: return 'done'
  }
}

interface Props {
  step: OnboardingStep
  onStepChange: (step: OnboardingStep) => void
  hasPets: boolean
  multiPets: boolean
  mode: 'panel' | 'float'
}

export default function Onboarding({ step, onStepChange, hasPets, multiPets, mode }: Props) {
  if (step === 'done') return null

  const config = STEPS[step]
  if (!config) return null

  // 根据模式过滤：panel模式只显示 welcome/create-hint，float模式显示其余
  const panelSteps: OnboardingStep[] = ['welcome', 'create-hint']
  const floatSteps: OnboardingStep[] = ['pet-click', 'pet-click-done', 'chat-input', 'state-select', 'pet-switch', 'tray-hint']

  if (mode === 'panel' && !panelSteps.includes(step)) return null
  if (mode === 'float' && !floatSteps.includes(step)) return null

  const handleNext = () => {
    const next = nextStep(step, hasPets, multiPets)
    setOnboardingStep(next)
    onStepChange(next)
  }

  const handleSkip = () => {
    skipOnboarding()
    onStepChange('done')
  }

  // 位置样式
  let positionClass = 'onboarding-center'
  if (config.position === 'above-pet') positionClass = 'onboarding-above-pet'
  if (config.position === 'below-input') positionClass = 'onboarding-below-input'
  if (config.position === 'top') positionClass = 'onboarding-top'

  return (
    <div className={`onboarding-overlay ${positionClass}`}>
      <div className="onboarding-card">
        <div className="onboarding-emoji">{config.emoji}</div>
        <div className="onboarding-title">{config.title}</div>
        <div className="onboarding-desc">{config.desc}</div>
        <div className="onboarding-buttons">
          <button className="onboarding-next-btn" onClick={handleNext}>
            {config.buttonText}
          </button>
          <button className="onboarding-skip-btn" onClick={handleSkip}>
            跳过引导
          </button>
        </div>
        <div className="onboarding-progress">
          {step !== 'welcome' && step !== 'create-hint' && (
            <span className="onboarding-progress-text">
              {['pet-click', 'pet-click-done', 'chat-input', 'state-select', 'pet-switch', 'tray-hint'].indexOf(step) + 1}
              /
              {multiPets ? 6 : 5}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
