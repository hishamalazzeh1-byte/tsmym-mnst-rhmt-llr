import { generateText, Output } from 'ai'
import { z } from 'zod'
import { SERVICES } from '@/lib/data'

export const maxDuration = 30

const triageSchema = z.object({
  urgency: z
    .enum(['emergency', 'urgent', 'routine', 'self-care'])
    .describe(
      'مستوى الخطورة: emergency = طوارئ فورية (اتصل بالإسعاف 123)، urgent = يحتاج رعاية خلال ساعات، routine = يمكن حجز زيارة منزلية، self-care = رعاية ذاتية ومتابعة',
    ),
  summary: z.string().describe('ملخص موجز ومطمئن لحالة المريض باللغة العربية'),
  possibleConditions: z
    .array(z.string())
    .describe('حالات محتملة عامة (وليست تشخيصاً نهائياً) باللغة العربية'),
  recommendedActions: z
    .array(z.string())
    .describe('خطوات عملية ينصح بها المريض الآن باللغة العربية'),
  recommendedServiceId: z
    .string()
    .nullable()
    .describe(
      'معرّف خدمة الرعاية المنزلية الأنسب من القائمة، أو null إذا لم تنطبق أي خدمة',
    ),
  redFlags: z
    .array(z.string())
    .describe('علامات تحذيرية توجب التوجه للطوارئ فوراً باللغة العربية'),
})

// نظام الفرز الاحتياطي الذكي في حال غياب اتصال الذكاء الاصطناعي
function ruleBasedTriage(symptoms: string) {
  const text = symptoms.toLowerCase()

  if (
    text.includes('صدر') ||
    text.includes('قلب') ||
    text.includes('تنفس') ||
    text.includes('إغماء') ||
    text.includes('وعي') ||
    text.includes('نزيف') ||
    text.includes('تشنج')
  ) {
    return {
      urgency: 'emergency',
      summary: 'الأعراض المذكورة قد تشير إلى حالة طارئة تستلزم تدخلاً طبياً فورياً من الإسعاف أو المستشفى.',
      possibleConditions: ['حالة قلبية أو تنفسية حادة', 'نزيف أو هبوط في الدورة الدموية'],
      recommendedActions: [
        'الاتصال فوراً بالإسعاف الرسمي على الرقم 123',
        'عدم بذل أي مجهود والجلوس في وضع مريح',
        'إبقاء شخص مرافق مع المريض حتى وصول المسعفين',
      ],
      recommendedServiceId: 'emergency',
      redFlags: ['ألم ضاغط في الصدر', 'صعوبة شديدة في التنفس', 'فقدان الوعي أو ازرقاق الشفاه'],
    }
  }

  if (text.includes('جرح') || text.includes('خياطة') || text.includes('غرز') || text.includes('قرح')) {
    return {
      urgency: 'routine',
      summary: 'الحالة تحتاج إلى غيار وتعقيم طبي معتمد للجرح لمنع حدوث التهاب أو تلوث.',
      possibleConditions: ['جرح يحتاج غياراً دورياً', 'متابعة التئام الأنسجة'],
      recommendedActions: [
        'تجنب لمس الجرح بأيدي غير معقمة',
        'حجز ممرض معتمد لعمل غيار معقم ومتابعة الجرح',
        'مراقبة أي ارتفاع في درجات الحرارة',
      ],
      recommendedServiceId: 'wound-care',
      redFlags: ['خروج إفرازات صديدية أو رائحة كريهة', 'احمرار شديد متزايد حول الجرح', 'ارتفاع مفاجئ في درجة الحرارة'],
    }
  }

  if (text.includes('عملية') || text.includes('جراحة') || text.includes('خروج')) {
    return {
      urgency: 'routine',
      summary: 'مرحلة تعافٍ بعد إجراء جراحي تتطلب رعاية ومتابعة دقيقة في المنزل.',
      possibleConditions: ['نقاهة ما بعد الجراحة', 'حاجة لمتابعة الأدوية والغيار الجراحي'],
      recommendedActions: [
        'الالتزام الصارم بتعليمات الجراح المعالج',
        'حجز ممرض رعاية ما بعد العمليات للزيارات المنزلية',
        'تسجيل قياسات العلامات الحيوية بانتظام',
      ],
      recommendedServiceId: 'post-op',
      redFlags: ['نزيف من موضع الجراحة', 'ألم شديد لا يستجيب للمسكنات', 'ضيق في التنفس'],
    }
  }

  if (text.includes('حقن') || text.includes('محلول') || text.includes('كانيولا') || text.includes('وريد') || text.includes('عضل')) {
    return {
      urgency: 'routine',
      summary: 'الحالة تستدعي إعطاء أدوية أو محاليل عبر الحقن على يد تمريض محترف.',
      possibleConditions: ['حاجة لتركيب كانيولا أو إعطاء محاليل', 'إعطاء حقن عضلية أو وريدية بوصفة طبية'],
      recommendedActions: [
        'تجهيز الروشتة والأدوية المقررة من الطبيب',
        'حجز ممرض محترف لإعطاء الحقن بأمان وتعقيم تام',
      ],
      recommendedServiceId: 'injections',
      redFlags: ['حدوث حساسية مفاجئة أو تورم بالوجه', 'صعوبة في التنفس عقب أخذ دواء'],
    }
  }

  if (text.includes('مسن') || text.includes('كبير') || text.includes('حركة') || text.includes('سرير')) {
    return {
      urgency: 'routine',
      summary: 'الحالة تتطلب رعاية تمريضية وإنسانية منتظمة تناسب كبار السن.',
      possibleConditions: ['حاجة لمتابعة صحية ووقاية من قرح الفراش', 'إدارة مواعيد الأدوية المزمنة'],
      recommendedActions: [
        'ترتيب زيارات تمريضية دورية لمتابعة الضغط والسكر',
        'الحرص على تقليب المريض بانتظام وتغذيته السليمة',
      ],
      recommendedServiceId: 'elderly',
      redFlags: ['تدهور مفاجئ في درجة الوعي', 'هبوط حاد في الضغط أو السكر'],
    }
  }

  return {
    urgency: 'routine',
    summary: 'تم تقييم الأعراض، ويمكن لزيارة تمريضية منزلية فحص الحالة وقياس العلامات الحيوية بدقة.',
    possibleConditions: ['أعراض عامة تستوجب فحصاً مبدئياً', 'حاجة لمتابعة الضغط والحرارة والنبض'],
    recommendedActions: [
      'حجز ممرض معتمد لتقييم العلامات الحيوية منزلياً',
      'الراحة وتناول السوائل بانتظام',
      'استشارة الطبيب المعالج إن استمرت الأعراض لأكثر من 48 ساعة',
    ],
    recommendedServiceId: null,
    redFlags: ['صعوبة في التنفس', 'ألم حاد مفاجئ', 'فقدان التوازن أو الوعي'],
  }
}

export async function POST(req: Request) {
  const { symptoms, age, gender, duration, history } = await req.json()

  if (!symptoms || typeof symptoms !== 'string') {
    return Response.json({ error: 'الأعراض مطلوبة' }, { status: 400 })
  }

  const serviceList = SERVICES.map((s) => `${s.id}: ${s.title}`).join('\n')

  try {
    const { output } = await generateText({
      model: 'google/gemini-2.5-flash',
      output: Output.object({ schema: triageSchema }),
      system: `أنت مساعد فرز طبي (Triage) لمنصة رعاية تمريضية منزلية في مصر اسمها "رحمة".
مهمتك تقييم أولي لأعراض المريض وتوجيهه لمستوى الرعاية المناسب في مصر.
- تحدث بالعربية الفصحى المبسطة وبأسلوب مطمئن ومهني.
- أنت لست بديلاً عن الطبيب ولا تقدم تشخيصاً نهائياً أو وصفة دواء.
- إذا كانت هناك أي علامات خطر (ألم صدر شديد، صعوبة تنفس، فقدان وعي، نزيف حاد، أعراض جلطة)، اجعل urgency = emergency.
- اختر recommendedServiceId من قائمة الخدمات المتاحة فقط إذا كانت زيارة منزلية مناسبة.

قائمة خدمات الرعاية المنزلية المتاحة:
${serviceList}`,
      prompt: `قيّم الحالة التالية:
- الأعراض: ${symptoms}
- العمر: ${age || 'غير محدد'}
- النوع: ${gender === 'male' ? 'ذكر' : gender === 'female' ? 'أنثى' : 'غير محدد'}
- مدة الأعراض: ${duration || 'غير محددة'}
- تاريخ مرضي / أمراض مزمنة: ${history || 'لا يوجد'}`,
    })

    return Response.json(output)
  } catch (err) {
    console.log('[v0] triage using fallback rule-based system:', err instanceof Error ? err.message : err)
    // نظام الفرز الاحتياطي لضمان استمرارية الخدمة
    const fallbackOutput = ruleBasedTriage(symptoms)
    return Response.json(fallbackOutput)
  }
}
