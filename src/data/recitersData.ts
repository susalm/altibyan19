export type ReciterCategoryType = "haramain" | "masters" | "mujawwad" | "teacher" | "other_riwayat";

export interface Reciter {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  bitrate?: string;
  quality?: string;
  riwayah?: string;
  categories?: ReciterCategoryType[];
}

export const recitersList: Reciter[] = [
  // 1. تلاوات الشيخ محمد صديق المنشاوي (أولاً)
  { 
    id: "Minshawy_Murattal_128kbps", 
    nameAr: "محمد صديق المنشاوي (مرتل)", 
    nameEn: "Mohamed Siddiq Al-Minshawi (Murattal)", 
    description: "التلاوة الخاشعة الباكية التي تلامس القلوب والأفئدة", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters"]
  },
  { 
    id: "Minshawy_Mujawwad_192kbps", 
    nameAr: "محمد صديق المنشاوي (مجود)", 
    nameEn: "Mohamed Siddiq Al-Minshawi (Mujawwad)", 
    description: "التلاوة المجودة المليئة بالخشوع والروحانية", 
    bitrate: "192 kbps", 
    quality: "أعلى جودة استوديو 192kbps", 
    riwayah: "حفص عن عاصم",
    categories: ["masters", "mujawwad"]
  },
  { 
    id: "Minshawy_Teacher_128kbps", 
    nameAr: "محمد صديق المنشاوي (المعلم)", 
    nameEn: "Mohamed Siddiq Al-Minshawi (Teacher)", 
    description: "المصحف المعلم بترديد الأطفال ومخارج الحروف", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters", "teacher"]
  },

  // 2. تلاوات الشيخ عبد الباسط عبد الصمد (ثانياً)
  { 
    id: "Abdul_Basit_Murattal_192kbps", 
    nameAr: "عبد الباسط عبد الصمد (مرتل)", 
    nameEn: "Abdul Basit (Murattal)", 
    description: "صاحب الحنجرة الذهبية والأداء الأسطوري الشهير", 
    bitrate: "192 kbps", 
    quality: "أعلى جودة استوديو 192kbps", 
    riwayah: "حفص عن عاصم",
    categories: ["masters"]
  },
  { 
    id: "Abdul_Basit_Mujawwad_128kbps", 
    nameAr: "عبد الباسط عبد الصمد (مجود)", 
    nameEn: "Abdul Basit (Mujawwad)", 
    description: "تلاوة مجودة تجسد جمال الصوت وعظمته", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters", "mujawwad"]
  },
  { 
    id: "AbdulSamad_64kbps_QuranExplorer.Com", 
    nameAr: "عبد الباسط عبد الصمد (إصدار خاص)", 
    nameEn: "AbdulSamad (Special Edition)", 
    description: "تلاوة نادرة مرتلة بصوت الشيخ عبد الباسط عبد الصمد", 
    bitrate: "64 kbps", 
    quality: "جودة نقية 64kbps", 
    riwayah: "حفص عن عاصم",
    categories: ["masters"]
  },

  // 3. تلاوات الشيخ محمود خليل الحصري (ثالثاً)
  { 
    id: "Husary_128kbps", 
    nameAr: "محمود خليل الحصري (مرتل)", 
    nameEn: "Mahmoud Al-Husary (Murattal)", 
    description: "شيخ المقارئ المصرية وإمام التجويد والإتقان", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters"]
  },
  { 
    id: "Husary_128kbps_Mujawwad", 
    nameAr: "محمود خليل الحصري (مجود)", 
    nameEn: "Mahmoud Al-Husary (Mujawwad)", 
    description: "التلاوة المجودة الفائقة الدقة والتحقيق", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters", "mujawwad"]
  },
  { 
    id: "Husary_Muallim_128kbps", 
    nameAr: "محمود خليل الحصري (المعلم)", 
    nameEn: "Mahmoud Al-Husary (Teacher)", 
    description: "التلاوة التعليمية مع مراعاة مخارج الحروف بدقة", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters", "teacher"]
  },

  // 4. بقية القراء الأفاضل
  { 
    id: "Alafasy_128kbps", 
    nameAr: "مشاري بن راشد العفاسي", 
    nameEn: "Mishary Alafasy", 
    description: "صوت عذب وأداء متميز مشهور عالمياً", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Hudhaify_128kbps", 
    nameAr: "علي بن عبد الرحمن الحذيفي", 
    nameEn: "Ali Al-Hudhaify", 
    description: "شيخ عموم المقارئ وإمام وخطيب المسجد النبوي", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "Abdurrahmaan_As-Sudais_192kbps", 
    nameAr: "عبد الرحمن السديس", 
    nameEn: "Abdul Rahman Al-Sudais", 
    description: "إمام وخطيب المسجد الحرام بمكة المكرمة", 
    bitrate: "192 kbps", 
    quality: "أعلى جودة استوديو 192kbps", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "Saood_ash-Shuraym_128kbps", 
    nameAr: "سعود الشريم", 
    nameEn: "Saud Al-Shuraim", 
    description: "إمام المسجد الحرام السابق ذو الصوت الشجي السريع", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "MaherAlMuaiqly128kbps", 
    nameAr: "ماهر المعيقلي", 
    nameEn: "Maher Al-Muaiqly", 
    description: "إمام وخطيب المسجد الحرام ذو الصوت العذب المتدبر", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "Yasser_Ad-Dussary_128kbps", 
    nameAr: "ياسر الدوسري", 
    nameEn: "Yasser Al-Dosari", 
    description: "إمام وخطيب المسجد الحرام صاحب التلاوة الفريدة المؤثرة", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "Abdullaah_3awwaad_Al-Juhaynee_128kbps", 
    nameAr: "عبد الله عواد الجهني", 
    nameEn: "Abdullah Al-Juhany", 
    description: "إمام المسجد الحرام ذو الصوت الخاشع الرخيم", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "Abu_Bakr_Ash-Shaatree_128kbps", 
    nameAr: "أبو بكر الشاطري", 
    nameEn: "Abu Bakr Al-Shatri", 
    description: "تلاوة حجازية ناصعة مفعمة بالخشوع والسكينة", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "ahmed_ibn_ali_al_ajamy_128kbps", 
    nameAr: "أحمد بن علي العجمي", 
    nameEn: "Ahmed Al-Ajmy", 
    description: "تلاوة حماسية مؤثرة تأخذ بمجامع القلوب", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Muhsin_Al_Qasim_192kbps", 
    nameAr: "عبد المحسن القاسم", 
    nameEn: "Abdul Muhsin Al-Qasim", 
    description: "إمام وخطيب المسجد النبوي الشريف ذو التلاوة الراسخة", 
    bitrate: "192 kbps", 
    quality: "أعلى جودة استوديو 192kbps", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "Salah_Al_Budair_128kbps", 
    nameAr: "صلاح البدير", 
    nameEn: "Salah Al-Budair", 
    description: "إمام وخطيب المسجد النبوي الشريف", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "Muhammad_Ayyoub_128kbps", 
    nameAr: "محمد أيوب", 
    nameEn: "Muhammad Ayyoub", 
    description: "إمام المسجد النبوي الشريف صاحب الصوت الحجازي الخاشع", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "Hani_Rifai_192kbps", 
    nameAr: "هاني الرفاعي", 
    nameEn: "Hani Ar-Rifai", 
    description: "تلاوة خاشعة ناعمة تتميز بالنبرة الشجية", 
    bitrate: "192 kbps", 
    quality: "أعلى جودة استوديو 192kbps", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Nasser_Alqatami_128kbps", 
    nameAr: "ناصر القطامي", 
    nameEn: "Nasser Al-Qatami", 
    description: "إمام جامع بالرياض صاحب الأداء الباكي المتميز", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Mohammad_al_Tablaway_128kbps", 
    nameAr: "محمد محمود الطبلاوي", 
    nameEn: "Mohammad Al-Tablawi", 
    description: "صوت وقور ونبرة مميزة من كبار أعلام القرّاء بمصر", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters"]
  },
  { 
    id: "Abdullah_Basfar_192kbps", 
    nameAr: "عبد الله بصفر", 
    nameEn: "Abdullah Basfar", 
    description: "أداء متميز وتلاوة هادئة لتدبر الآيات", 
    bitrate: "192 kbps", 
    quality: "أعلى جودة استوديو 192kbps", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Muhammad_Jibreel_128kbps", 
    nameAr: "محمد جبريل", 
    nameEn: "Muhammad Jibreel", 
    description: "صوت شجي معروف بالدعاء والتلاوات المؤثرة", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Abdullah_Matroud_128kbps", 
    nameAr: "عبد الله المطرود", 
    nameEn: "Abdullah Matroud", 
    description: "تلاوة هادئة ونبرة صوتية خاشعة ومريحة للنفس", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Salaah_AbdulRahman_Bukhatir_128kbps", 
    nameAr: "صلاح بو خاطر", 
    nameEn: "Salah Bukhatir", 
    description: "تلاوة إماراتية وقورة ذات نبرة شجية هادئة", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Khaalid_Abdullaah_al-Qahtaanee_192kbps", 
    nameAr: "خالد القحطاني", 
    nameEn: "Khalid Al-Qahtani", 
    description: "تلاوة مؤثرة خاشعة بنبرة شجية وأداء متميز", 
    bitrate: "192 kbps", 
    quality: "أعلى جودة استوديو 192kbps", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Ali_Hajjaj_AlSuesy_128kbps", 
    nameAr: "علي حجاج السويسي (مجود)", 
    nameEn: "Ali Hajjaj Al-Suwaisy (Mujawwad)", 
    description: "روائع التلاوة المجودة من كبار أعلام القراء بمصر", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters", "mujawwad"]
  },
  { 
    id: "Ahmed_Neana_128kbps", 
    nameAr: "أحمد أحمد نعينع", 
    nameEn: "Ahmed Neana", 
    description: "طبيب القراء وصاحب الحنجرة الرخيمة المتقنة", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters"]
  },
  { 
    id: "Muhammad_AbdulKareem_128kbps", 
    nameAr: "محمد عبد الكريم", 
    nameEn: "Muhammad Abdul Kareem", 
    description: "تلاوة عذبة محققة بقراءات متعددة ونبرة نقية", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Sahl_Yassin_128kbps", 
    nameAr: "سهل ياسين", 
    nameEn: "Sahl Yassin", 
    description: "قارئ وإمام ذو تلاوة هادئة ورصينة", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Yaser_Salamah_128kbps", 
    nameAr: "ياسر سلامة", 
    nameEn: "Yasser Salama", 
    description: "تلاوة بأسلوب الحدر السريع المتقن لأحكام التجويد", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Akram_AlAlaqimy_128kbps", 
    nameAr: "أكرم العلاقمي", 
    nameEn: "Akram Al-Alaqimi", 
    description: "تلاوة محققة عالية النقاوة والصفاء الصوتي", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "aziz_alili_128kbps", 
    nameAr: "عزيز عليلي", 
    nameEn: "Aziz Alili", 
    description: "أداء رصين وتلاوة ناصعة بنبرة صوتية نقية", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "warsh_ibrahim_aldosary_128kbps", 
    nameAr: "إبراهيم الدوسري (ورش عن نافع)", 
    nameEn: "Ibrahim Al-Dosary (Warsh)", 
    description: "تلاوة برواية ورش عن نافع من طريق الأزرق بجودة نقية", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "ورش عن نافع",
    categories: ["other_riwayat"]
  },
  { 
    id: "warsh_Abdul_Basit_128kbps", 
    nameAr: "عبد الباسط عبد الصمد (ورش عن نافع)", 
    nameEn: "Abdul Basit (Warsh)", 
    description: "المصحف المرتل برواية ورش عن نافع للشيخ عبد الباسط", 
    bitrate: "128 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "ورش عن نافع",
    categories: ["masters", "other_riwayat"]
  },
  { 
    id: "warsh_yassin_al_jazaery_64kbps", 
    nameAr: "ياسين الجزائري (ورش عن نافع)", 
    nameEn: "Yassin Al-Jazaery (Warsh)", 
    description: "تلاوة برواية ورش عن نافع من طريق الأزرق بأداء مغاربي رائع", 
    bitrate: "64 kbps", 
    quality: "جودة نقية 64kbps", 
    riwayah: "ورش عن نافع",
    categories: ["other_riwayat"]
  },
  { 
    id: "Mustafa_Ismail_48kbps", 
    nameAr: "مصطفى إسماعيل (مرتل)", 
    nameEn: "Mustafa Ismail (Murattal)", 
    description: "التلاوة المرتلة المتقنة بصوت الشيخ مصطفى إسماعيل", 
    bitrate: "48 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["masters"]
  },
  { 
    id: "Ghamadi_40kbps", 
    nameAr: "سعد الغامدي", 
    nameEn: "Saad Al-Ghamdi", 
    description: "تلاوة شجية متقنة ومحبوبة مفعمة بالخشوع والسكينة", 
    bitrate: "40 kbps", 
    quality: "جودة نقية 40kbps", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Fares_Abbad_64kbps", 
    nameAr: "فارس عباد", 
    nameEn: "Fares Abbad", 
    description: "تلاوة يمنية شجية وندية تأسر القلوب وتعين على التدبر", 
    bitrate: "64 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Ali_Jaber_64kbps", 
    nameAr: "علي عبد الله جابر", 
    nameEn: "Ali Jaber", 
    description: "إمام المسجد الحرام الأسبق صاحب التلاوة التاريخية الخاشعة", 
    bitrate: "64 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain"]
  },
  { 
    id: "khalefa_al_tunaiji_64kbps", 
    nameAr: "خليفة الطنيجي", 
    nameEn: "Khalifa Al-Tunaiji", 
    description: "تلاوة إماراتية متقنة لأحكام التجويد بهدوء ووقار", 
    bitrate: "64 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: []
  },
  { 
    id: "Ayman_Sowaid_64kbps", 
    nameAr: "أيمن رشدي سويد", 
    nameEn: "Ayman Sowaid", 
    description: "تلاوة تعليمية محققة تبرز دقائق التجويد ومخارج الحروف", 
    bitrate: "64 kbps", 
    quality: "جودة عالية HQ", 
    riwayah: "حفص عن عاصم",
    categories: ["teacher"]
  },
  { 
    id: "Ibrahim_Akhdar_32kbps", 
    nameAr: "إبراهيم الأخضر", 
    nameEn: "Ibrahim Al-Akhdar", 
    description: "شيخ قراء المدينة المنورة وإمام المسجد النبوي الأسبق", 
    bitrate: "32 kbps", 
    quality: "جودة نقية 32kbps", 
    riwayah: "حفص عن عاصم",
    categories: ["haramain", "masters"]
  },
  { 
    id: "mahmoud_ali_al_banna_32kbps", 
    nameAr: "محمود علي البنا (مرتل)", 
    nameEn: "Mahmoud Ali Al-Banna", 
    description: "من رواد التلاوة المصرية الرصينة وصاحب الصوت الجليل", 
    bitrate: "32 kbps", 
    quality: "جودة نقية 32kbps", 
    riwayah: "حفص عن عاصم", 
    categories: ["masters"]
  }
];

export const recitersData = recitersList;
