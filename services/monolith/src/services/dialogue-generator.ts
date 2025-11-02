/**
 * Template-Based Dialogue Generator
 * 90% use templates, 10% use LLM
 */

const TEMPLATES = {
  zh: {
    excited: [
      '太棒了！你真厉害！',
      '哇！！！完美表现！',
      '你是最强的！继续保持！',
      '简直无敌！我就知道你可以！',
      '惊人的操作！我都看呆了！'
    ],
    happy: [
      '做得不错哦~',
      '很好！继续加油！',
      '你越来越棒了呢！',
      '嗯嗯，表现很稳！',
      '真不错，我很开心！'
    ],
    proud: [
      '你真的很优秀！',
      '我为你感到骄傲！',
      '这才是你的实力！',
      '果然没让我失望！'
    ],
    confident: [
      '专注！我相信你！',
      '保持冷静，稳扎稳打！',
      '你可以的，我陪着你！',
      '展现你的实力吧！'
    ],
    disappointed: [
      '没关系，下次一定可以的！',
      '别气馁，胜败乃兵家常事~',
      '休息一下，调整心态继续！',
      '我会一直陪着你的！'
    ],
    frustrated: [
      '别太在意，这不是你的错！',
      '深呼吸，放松一下！',
      '要不要休息一会儿？',
      '相信我，你已经做得很好了！'
    ],
    sad: [
      '抱抱你~ 我在呢！',
      '没事的，我陪着你！',
      '别难过，振作起来！'
    ],
    neutral: [
      '嗯嗯，我在看着呢~',
      '继续吧！',
      '保持这个节奏！'
    ]
  },
  en: {
    excited: [
      'Amazing! You\'re incredible!',
      'Wow!!! Perfect performance!',
      'You\'re unstoppable!',
      'Absolutely crushing it!'
    ],
    happy: [
      'Well done!',
      'Great job! Keep it up!',
      'You\'re getting better!',
      'Nice work!'
    ],
    proud: [
      'I\'m so proud of you!',
      'That\'s your true power!',
      'You\'re excellent!'
    ],
    confident: [
      'Focus! I believe in you!',
      'Stay calm and steady!',
      'You got this!'
    ],
    disappointed: [
      'It\'s okay, you\'ll get it next time!',
      'Don\'t give up!',
      'I\'m here with you!'
    ],
    frustrated: [
      'Take a deep breath!',
      'Want to take a break?',
      'You\'re doing great!'
    ],
    sad: [
      'I\'m here for you!',
      'It\'s alright!',
      'Chin up!'
    ],
    neutral: [
      'I\'m watching!',
      'Keep going!',
      'Stay focused!'
    ]
  }
};

interface DialogueResult {
  dialogue: string;
  emotion: string;
  source: 'template' | 'llm';
  persona: string;
}

export async function generateDialogue(
  emotion: string,
  context: any,
  persona: string,
  language: string
): Promise<DialogueResult> {
  // 90% use templates
  const useTemplate = Math.random() < 0.9;

  if (useTemplate) {
    const lang = language === 'en' ? 'en' : 'zh';
    const templates = TEMPLATES[lang][emotion as keyof typeof TEMPLATES.zh] || TEMPLATES[lang].neutral;
    const dialogue = templates[Math.floor(Math.random() * templates.length)];

    return {
      dialogue,
      emotion,
      source: 'template',
      persona
    };
  }

  // 10% could use LLM (but we'll use template as fallback for now)
  // In production, you would call Anthropic Claude API here
  const lang = language === 'en' ? 'en' : 'zh';
  const templates = TEMPLATES[lang][emotion as keyof typeof TEMPLATES.zh] || TEMPLATES[lang].neutral;
  const dialogue = templates[Math.floor(Math.random() * templates.length)];

  return {
    dialogue,
    emotion,
    source: 'template', // Would be 'llm' if we actually called the API
    persona
  };
}
