import { quranThematicIndex, ThematicTopic } from "./quranThematicIndex";
import { lyadabbarooGems } from "./lyadabbarooBookGems";

export interface QuranicTheme {
  id: string;
  name: string;
  description: string;
  sectionTitle?: string;
  verses: {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    text: string;
    context: string;
  }[];
}

export interface MishkatGem {
  id: string;
  title: string;
  category: string;
  ayahText: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  page: number;
  tadabburText: string;
}

export const quranicThemes: QuranicTheme[] = quranThematicIndex.map((topic: ThematicTopic) => ({
  id: topic.id,
  name: topic.name,
  description: topic.description,
  sectionTitle: topic.sectionTitle,
  verses: topic.verses
}));

const initialMishkatGems: MishkatGem[] = [
  {
    id: "peace",
    title: "سكينة القلوب والطمأنينة",
    category: "طمأنينة القلب",
    ayahText: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    surahNumber: 13,
    surahName: "الرعد",
    ayahNumber: 28,
    page: 253,
    tadabburText: "إن أعظم علاج للقلق واضطراب النفس هو الالتجاء المباشر لذكر الله تبارك وتعالى؛ فالقلب وعاء لا يسكنه الهدوء الحقيقي إلا عندما يمتلئ بالصلة مع خالقه وحبه ومناجاته."
  },
  {
    id: "ease",
    title: "اليسر الرباني بعد شدائد العسر",
    category: "اليسر بعد العسر",
    ayahText: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا * إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    surahNumber: 94,
    surahName: "الشرح",
    ayahNumber: 5,
    page: 596,
    tadabburText: "بشارة عظيمة لكل مكروب ومهموم: إن العسر لا ينفرد أبداً بل يصحبه اليسر ويدور معه، وجاءت كلمة (مع) لتؤكد التقارب والسرعة، وتكرار الجملة يبعث اليقين القاطع بالفرج القريب."
  },
  {
    id: "healing",
    title: "القرآن شفاء ورحمة للأرواح والصدور",
    category: "الشفاء والرحمة",
    ayahText: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِلْمُؤْمِنِينَ",
    surahNumber: 17,
    surahName: "الإسراء",
    ayahNumber: 82,
    page: 290,
    tadabburText: "القرآن الكريم ليس مجرد كلمات تُقرأ بل هو دواء ناجع وبلسم شافٍ لكل أمراض القلوب من الشبهات والشهوات والأحزان والهموم، ورحمة واسعة تهتدي بها النفوس وتسعد."
  },
  {
    id: "mercy",
    title: "رحمة الله الواسعة التي تسع الذنوب كلها",
    category: "رحمة الله وبشائره",
    ayahText: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا",
    surahNumber: 39,
    surahName: "الزمر",
    ayahNumber: 53,
    page: 464,
    tadabburText: "النداء الإلهي الأكثر دفئاً ومغفرةً، ينسب الله العاصين المسرفين إليه تحبباً وتكريماً ليرغبهم في التوبة، وينهى بصرامة عن القنوط من رحمته التي تمحو جبال الأخطاء والذنوب."
  },
  {
    id: "light",
    title: "الخروج من غياهب الظلمات إلى النور الأبدي",
    category: "الهداية والنور",
    ayahText: "اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُمْ مِنَ الظُّلُمَاتِ إِلَى النُّورِ",
    surahNumber: 2,
    surahName: "البقرة",
    ayahNumber: 257,
    page: 42,
    tadabburText: "عندما تتولى الله يرفع عنك حجب الجهل والحيرة والضلال، وينير بصيرتك بنور الإيمان الساطع والوحي المنزل؛ لتمشي بين الناس بقلب يبصر طريقه وروح تفيض باليقين."
  }
];

export const mishkatGems: MishkatGem[] = [...initialMishkatGems, ...lyadabbarooGems];
