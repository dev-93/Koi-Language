export const situations = [
  {
    id: 1,
    title: { kr: '카페에서 첫 만남', jp: 'カフェでの初対面' },
    desc: { kr: '우연히 합석하게 된 카페에서 말을 걸어보세요.', jp: '偶然相席になったカフェで話しかけてみましょう。' },
    expressions: {
      kr_wants_jp: [
        { kr: '여기 자리 비어있나요?', jp: 'ここ、空いてますか？', romaji: 'Koko, aitemasuka?', tip: '자연스러운 첫 마디입니다.' },
        { kr: '자주 오시나봐요.', jp: 'よく来られるんですか？', romaji: 'Yoku korarerun desuka?', tip: '가벼운 스몰토크로 대화를 이어갑니다.' }
      ],
      jp_wants_kr: [
        { jp: 'ここ、空いてますか？', kr: '여기 자리 비어있나요?', romaji: 'yeogi jari bieoinnayo?' },
        { jp: 'よく来られるんですか？', kr: '자주 오시나봐요.', romaji: 'jaju osinabwayo.' }
      ]
    },
    difficulty: '초급'
  },
  {
    id: 2,
    title: { kr: '연락처 물어보기', jp: '連絡先を聞く' },
    desc: { kr: '대화가 잘 통했다면 용기내어 연락처를 물어보세요.', jp: '会話が弾んだら勇気を出して連絡先を聞いてみましょう。' },
    expressions: {
      kr_wants_jp: [
        { kr: '라인이나 인스타 하세요?', jp: 'LINEかインスタやってますか？', romaji: 'Rain ka insuta yattemasuka?', tip: '일본에서는 라인이 가장 흔합니다.' },
        { kr: '조금 더 이야기해보고 싶어요.', jp: 'もう少し話してみたいです。', romaji: 'Mou sukoshi hanashite mitaidesu.', tip: '호감을 표시하는 솔직한 말입니다.' }
      ],
      jp_wants_kr: [
        { jp: 'カカオやインスタやってますか？', kr: '카톡이나 인스타 하세요?', romaji: 'katogina inseuta haseyo?' },
        { jp: 'もう少し話してみたいです。', kr: '조금 더 이야기해보고 싶어요.', romaji: 'jogeum deo iyagihaebogo sipeoyo.' }
      ]
    },
    difficulty: '중급'
  },
  {
    id: 3,
    title: { kr: '칭찬하기', jp: '褒める' },
    desc: { kr: '상대방의 외모나 스타일을 가볍게 칭찬해보세요.', jp: '相手の容姿やスタイルを軽く褒めてみましょう。' },
    expressions: {
      kr_wants_jp: [
        { kr: '오늘 스타일 정말 좋으시네요.', jp: '今日のスタイル、すごくいいですね。', romaji: 'Kyou no sutairu, sugoku iidesune.', tip: '자연스러운 칭찬입니다.' },
        { kr: '웃는 모습이 예뻐요.', jp: '笑顔が素敵ですね。', romaji: 'Egao ga sutekidesune.', tip: '호감을 높이는 마법의 문장입니다.' }
      ],
      jp_wants_kr: [
        { jp: '今日のスタイル、すごくいいですね。', kr: '오늘 스타일 정말 좋으시네요.', romaji: 'oneul seutail jeongmal joeusineyo.' },
        { jp: '笑顔が素敵ですね。', kr: '웃는 모습이 예뻐요.', romaji: 'unneun moseubi yeppeoyo.' }
      ]
    },
    difficulty: '초급'
  },
  {
    id: 4,
    title: { kr: '데이트 신청하기', jp: 'デートに誘う' },
    desc: { kr: '다음에 또 만나자고 제안해보세요.', jp: 'また次も会おうと提案してみましょう。' },
    expressions: {
      kr_wants_jp: [
        { kr: '이번 주말에 시간 어때요?', jp: '今週末、時間どうですか？', romaji: 'Konshuumatsu, jikan doudesuka?', tip: '구체적인 시기를 물어보는 것이 좋습니다.' },
        { kr: '같이 밥 먹으러 갈래요?', jp: '一緒にご飯食べに行きませんか？', romaji: 'Isshoni gohan tabeni ikimasenka?', tip: '부담없는 밥 약속을 제안해보세요.' }
      ],
      jp_wants_kr: [
        { jp: '今週末、時間どうですか？', kr: '이번 주말에 시간 어때요?', romaji: 'ibeon jumare sigan eottaeyo?' },
        { jp: '一緒にご飯食べに行きませんか？', kr: '같이 밥 먹으러 갈래요?', romaji: 'gachi bap meogeureo gallaeyo?' }
      ]
    },
    difficulty: '중고급'
  }
];
