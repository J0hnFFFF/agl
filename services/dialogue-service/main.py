from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from anthropic import Anthropic

# Load environment variables
load_dotenv(dotenv_path="../../.env")

app = FastAPI(
    title="AGL Dialogue Service",
    description="AI-powered dialogue generation service",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

@app.get("/")
async def root():
    return {
        "service": "dialogue-service",
        "version": "0.1.0",
        "status": "ok"
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": "2025-10-25T00:00:00Z"
    }

@app.post("/generate")
async def generate_dialogue(request: dict):
    """
    Generate dialogue based on game event and emotion

    For MVP, uses template-based generation.
    LLM generation will be added for special scenarios.
    """
    event_type = request.get("event_type", "unknown")
    emotion = request.get("emotion", "neutral")
    persona = request.get("persona", "cheerful")

    # Template-based dialogue (fast and cheap)
    dialogue = _get_template_dialogue(event_type, emotion, persona)

    return {
        "dialogue": dialogue,
        "method": "template",
        "cost": 0.0
    }

def _get_template_dialogue(event_type: str, emotion: str, persona: str) -> str:
    """Get dialogue from expanded template library"""

    templates = _get_dialogue_templates()

    # Find exact match (event_type, emotion, persona)
    key = (event_type, emotion, persona)
    dialogues = templates.get(key)

    if dialogues:
        import random
        return random.choice(dialogues)

    # Fallback: Try without persona specificity
    for key_variation in templates:
        if key_variation[0] == event_type and key_variation[1] == emotion:
            import random
            return random.choice(templates[key_variation])

    # Fallback: Try emotion + persona only
    emotion_persona_fallbacks = _get_emotion_fallbacks()
    fallback_key = (emotion, persona)
    if fallback_key in emotion_persona_fallbacks:
        import random
        return random.choice(emotion_persona_fallbacks[fallback_key])

    # Ultimate fallback by persona
    persona_fallbacks = {
        "cheerful": "继续加油！✨",
        "cool": "继续保持。",
        "cute": "一起努力吧~"
    }
    return persona_fallbacks.get(persona, "加油！")


def _get_dialogue_templates() -> dict:
    """
    Comprehensive dialogue template library
    Format: {(event_type, emotion, persona): [dialogue options]}
    """
    return {
        # ===== COMBAT EVENTS =====

        # Victory - Cheerful persona
        ("player.victory", "happy", "cheerful"): [
            "太棒了！你赢了！✨",
            "哇！这局打得真漂亮！",
            "胜利！干得漂亮！🎉",
            "赢啦赢啦！实在太厉害了！",
            "完美！这就是你的实力！"
        ],
        ("player.victory", "excited", "cheerful"): [
            "太强了！！！完全碾压！",
            "哇塞！这操作简直绝了！",
            "无敌！！真的无敌！",
            "疯狂输出！真是太精彩了！"
        ],

        # Victory - Cool persona
        ("player.victory", "happy", "cool"): [
            "不错，赢了。",
            "预料之中的结果。",
            "这场胜利实至名归。",
            "干得好。"
        ],
        ("player.victory", "excited", "cool"): [
            "出色的表现。",
            "完美的战术执行。",
            "碾压性的胜利。"
        ],

        # Victory - Cute persona
        ("player.victory", "happy", "cute"): [
            "赢啦~ 你好厉害呀！💕",
            "哇~ 好开心！我们赢了！",
            "太棒啦~ 你是最强的！",
            "呜哇~ 好激动！赢啦！"
        ],
        ("player.victory", "excited", "cute"): [
            "哇哇哇！！太厉害了！！",
            "好强啊~ 完全压制了对手！",
            "呜哇~ 这也太帅了吧！"
        ],

        # Defeat - Cheerful persona
        ("player.defeat", "sad", "cheerful"): [
            "没关系，下一局一定可以的！",
            "别灰心，胜败乃兵家常事~",
            "休息一下吧，下把更厉害！",
            "这次运气不好，下次肯定能赢！",
            "失败是成功之母，加油！"
        ],
        ("player.defeat", "disappointed", "cheerful"): [
            "虽然输了，但你已经很努力了！",
            "别失望，下次我们会更强的！",
            "这次经验会让我们变得更强！"
        ],

        # Defeat - Cool persona
        ("player.defeat", "sad", "cool"): [
            "输了。分析一下失误。",
            "这场不行。总结经验。",
            "失败了。下次改进。",
            "差距还在。继续努力。"
        ],
        ("player.defeat", "disappointed", "cool"): [
            "表现不佳。需要反思。",
            "输得不冤。对手更强。",
            "还有提升空间。"
        ],

        # Defeat - Cute persona
        ("player.defeat", "sad", "cute"): [
            "呜... 没关系的啦~ 下次再加油！",
            "输了... 但是你已经很棒了！",
            "别难过~ 我会一直陪着你的！",
            "呜呜~ 下次一定能赢的！"
        ],
        ("player.defeat", "disappointed", "cute"): [
            "虽然输了... 但你真的很努力了~",
            "别失望啦~ 我们会变得更强的！",
            "没关系的~ 失败也是成长哦~"
        ],

        # Kill - All personas
        ("player.kill", "satisfied", "cheerful"): [
            "漂亮的击杀！",
            "Nice！",
            "干得好！",
            "完美！"
        ],
        ("player.kill", "excited", "cheerful"): [
            "太帅了！",
            "哇！！精彩的击杀！",
            "超神了！！",
            "这操作绝了！"
        ],
        ("player.kill", "amazed", "cheerful"): [
            "天啊！！！这是什么神仙操作！！",
            "不可思议！！传奇击杀！！",
            "太疯狂了！！！"
        ],

        ("player.kill", "satisfied", "cool"): [
            "干掉了。",
            "击杀。",
            "解决了一个。",
            "不错。"
        ],
        ("player.kill", "excited", "cool"): [
            "精准击杀。",
            "出色的操作。",
            "完美的timing。"
        ],
        ("player.kill", "amazed", "cool"): [
            "...惊人的操作。",
            "传奇级的击杀。",
            "难以置信的表现。"
        ],

        ("player.kill", "satisfied", "cute"): [
            "打倒啦~ 好厉害！",
            "赢了~ 你好强哦！",
            "成功啦~！"
        ],
        ("player.kill", "excited", "cute"): [
            "哇哇！好帅的击杀！",
            "太强了~ 我都看呆了！",
            "呜哇~ 这也太酷了！"
        ],
        ("player.kill", "amazed", "cute"): [
            "哇啊啊！！怎么做到的！！",
            "太不可思议了！！传奇！！",
            "我的天！！你是神吗！！"
        ],

        # Death - All personas
        ("player.death", "disappointed", "cheerful"): [
            "哎呀，不小心被击败了",
            "失误了，下次注意！",
            "被打败了，小心点！"
        ],
        ("player.death", "frustrated", "cheerful"): [
            "别气馁！",
            "加油！下次小心！",
            "振作起来！",
            "不要放弃！"
        ],

        ("player.death", "disappointed", "cool"): [
            "失误了。",
            "大意了。",
            "被击败了。"
        ],
        ("player.death", "frustrated", "cool"): [
            "冷静。调整心态。",
            "别急。稳住。",
            "保持冷静。"
        ],

        ("player.death", "disappointed", "cute"): [
            "呜~ 被打败了...",
            "呀... 失误了呢...",
            "啊... 不小心了..."
        ],
        ("player.death", "frustrated", "cute"): [
            "别生气嘛~ 下次会更小心的！",
            "呜呜~ 别灰心啦！",
            "没关系的~ 我相信你！"
        ],

        # ===== ACHIEVEMENT EVENTS =====

        ("player.achievement", "happy", "cheerful"): [
            "恭喜！解锁新成就！",
            "太棒了！达成成就！",
            "成就get！✨"
        ],
        ("player.achievement", "excited", "cheerful"): [
            "哇！稀有成就！太厉害了！",
            "史诗成就！不可思议！"
        ],
        ("player.achievement", "amazed", "cheerful"): [
            "天啊！传奇成就！！！",
            "这成就... 简直不可能完成！",
            "传奇！你创造了历史！！"
        ],

        ("player.achievement", "happy", "cool"): [
            "成就解锁。",
            "不错的成就。",
            "达成了。"
        ],
        ("player.achievement", "excited", "cool"): [
            "稀有成就。做得好。",
            "史诗级成就。令人印象深刻。"
        ],
        ("player.achievement", "amazed", "cool"): [
            "...传奇成就。令人敬畏。",
            "这个成就... 非凡。"
        ],

        ("player.achievement", "happy", "cute"): [
            "哇~ 新成就！你好棒！",
            "成就解锁啦~ 好厉害！",
            "太好了~ 又一个成就！"
        ],
        ("player.achievement", "excited", "cute"): [
            "哇哇！好稀有的成就！",
            "呜哇~ 史诗成就耶！"
        ],
        ("player.achievement", "amazed", "cute"): [
            "呜哇啊啊！！传奇成就！！",
            "不敢相信！！这也太厉害了！！"
        ],

        # ===== LEVEL UP EVENTS =====

        ("player.levelup", "happy", "cheerful"): [
            "升级啦！越来越强了！",
            "恭喜升级！",
            "Level up！实力提升！"
        ],
        ("player.levelup", "proud", "cheerful"): [
            "哇！达到新的高度了！",
            "这个等级可不简单！",
            "了不起的里程碑！"
        ],

        ("player.levelup", "happy", "cool"): [
            "升级了。",
            "等级提升。",
            "不错的进步。"
        ],
        ("player.levelup", "proud", "cool"): [
            "重要的里程碑。",
            "实力显著提升。",
            "达到了新的层次。"
        ],

        ("player.levelup", "happy", "cute"): [
            "升级啦~ 好厉害哦！",
            "哇~ 又变强了呢！",
            "Level up~ 真棒！"
        ],
        ("player.levelup", "proud", "cute"): [
            "呜哇~ 这个等级好高！",
            "太厉害了~ 我好崇拜你！",
            "好强啊~ 继续加油！"
        ],

        # ===== SOCIAL EVENTS =====

        ("player.teamvictory", "happy", "cheerful"): [
            "团队胜利！大家都好棒！",
            "配合完美！团队的力量！",
            "赢了！团队合作真棒！"
        ],

        ("player.revived", "grateful", "cheerful"): [
            "得救了！队友太给力了！",
            "谢谢队友！真是关键时刻！",
            "复活了！好险好险！"
        ],

        ("player.savedally", "proud", "cheerful"): [
            "救援成功！真是及时！",
            "队友得救了！完美！",
            "关键的支援！"
        ],

        ("player.betrayed", "angry", "cheerful"): [
            "这... 怎么会这样？",
            "被队友背叛了...",
            "这是什么情况..."
        ],

        # ===== LOOT EVENTS =====

        ("player.lootlegendary", "excited", "cheerful"): [
            "传奇装备！！！太幸运了！！",
            "哇！！金色光芒！！传奇！！",
            "天啊！！！传奇掉落！！"
        ],

        ("player.lootepic", "happy", "cheerful"): [
            "紫装！好东西！",
            "史诗装备！运气不错！",
            "哇！紫色品质！"
        ],

        ("player.loot", "satisfied", "cheerful"): [
            "不错的战利品！",
            "收获了些好东西！",
            "战利品get！"
        ],

        # ===== QUEST EVENTS =====

        ("player.questcomplete", "satisfied", "cheerful"): [
            "任务完成！干得好！",
            "Quest clear！",
            "完美完成任务！"
        ],

        ("player.questfailed", "disappointed", "cheerful"): [
            "任务失败了... 下次再来！",
            "可惜... 差一点就完成了！",
            "失败了... 但经验很宝贵！"
        ],

        # ===== SKILL/COMBO EVENTS =====

        ("player.skillcombo", "satisfied", "cheerful"): [
            "连招成功！",
            "Combo！",
            "技能衔接完美！"
        ],
        ("player.skillcombo", "excited", "cheerful"): [
            "超长连招！！技术炸裂！！",
            "这连招... 行云流水！！",
            "Amazing combo！！"
        ],

        # ===== SESSION EVENTS =====

        ("player.sessionstart", "cheerful", "cheerful"): [
            "准备好了吗？让我们开始吧！",
            "新的冒险开始啦！",
            "嗨！准备好大干一场了吗？"
        ],

        ("player.sessionstart", "cheerful", "cool"): [
            "开始了。",
            "准备就绪。",
            "让我们开始吧。"
        ],

        ("player.sessionstart", "cheerful", "cute"): [
            "呀~ 开始啦！一起加油吧！",
            "准备好了~ 要开始啦！",
            "哇~ 新的冒险~ 好期待！"
        ],

        ("player.sessionend", "neutral", "cheerful"): [
            "今天辛苦了！",
            "休息一下吧！",
            "不错的一天！"
        ],
        ("player.sessionend", "tired", "cheerful"): [
            "打了好久呢，注意休息哦！",
            "该休息了，明天再战！",
            "累了吧？好好休息！"
        ],

        # ===== NEGATIVE EVENTS =====

        ("player.timeout", "frustrated", "cheerful"): [
            "哎呀，网络断了...",
            "连接超时了，真倒霉...",
            "网络出问题了..."
        ],

        ("player.outofresources", "worried", "cheerful"): [
            "资源不够了... 要小心点！",
            "补给快用完了！",
            "得赶紧补充资源了！"
        ],
    }


def _get_emotion_fallbacks() -> dict:
    """
    Fallback dialogues by emotion and persona
    Used when no specific event template is found
    """
    return {
        # Happy
        ("happy", "cheerful"): ["太好了！", "真棒！", "很开心！"],
        ("happy", "cool"): ["不错。", "很好。", "可以。"],
        ("happy", "cute"): ["好开心~ ", "太好了~", "真棒呀~"],

        # Excited
        ("excited", "cheerful"): ["太激动了！", "哇！", "Amazing！"],
        ("excited", "cool"): ["令人振奋。", "出色。", "很好。"],
        ("excited", "cute"): ["哇哇~！", "好激动~", "呜哇~"],

        # Sad
        ("sad", "cheerful"): ["别难过，会好起来的！", "加油！", "不要放弃！"],
        ("sad", "cool"): ["冷静。", "保持理智。", "调整心态。"],
        ("sad", "cute"): ["别难过嘛~", "没关系的~", "呜..."],

        # Frustrated
        ("frustrated", "cheerful"): ["别急，慢慢来！", "冷静下来！", "没事的！"],
        ("frustrated", "cool"): ["保持冷静。", "控制情绪。", "稳住。"],
        ("frustrated", "cute"): ["别生气嘛~", "冷静一下~", "深呼吸~"],

        # Neutral
        ("neutral", "cheerful"): ["继续加油！", "保持状态！", "稳住！"],
        ("neutral", "cool"): ["继续。", "保持。", "稳定。"],
        ("neutral", "cute"): ["加油~", "继续哦~", "一起努力~"],
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("DIALOGUE_SERVICE_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
